import { toast } from "sonner";
import {
  useState,
  useCallback,
  useEffect,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { AIMode, Conversation, Message, QuantumSettings } from "@/types/quantum";
import { DEFAULT_SETTINGS } from "@/types/quantum";
import {
  loadSettings,
  saveSettings,
} from "@/lib/settings-storage";
import {
  saveConversation,
  getAllConversations,
  deleteConversation as deleteConversationDB,
} from "@/lib/storage";
import { streamChat } from "@/lib/chat-service";
import { EASTER_EGG_COMMANDS } from "@/lib/easter-eggs";
import { useConnection } from "@/hooks/use-connection";
import type { OfflineModelState } from "@/lib/offline-ai";
import {
  getOfflineModelStatus,
  onOfflineModelStatus,
  preloadOfflineModel,
} from "@/lib/offline-ai";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { wllamaEngine } from "@/lib/wllama-engine";

interface QuantumAppState {
  settings: QuantumSettings;
  updateSettings: (settings: QuantumSettings) => void;
  currentMode: AIMode;
  setMode: (mode: AIMode) => void;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  createConversation: () => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  isStreaming: boolean;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  isLoadingConversations: boolean;
  offlineModelState: OfflineModelState;
  isOnline: boolean;
  isSyncing: boolean;
}

const QuantumAppContext = createContext<QuantumAppState | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateTitle(content: string): string {
  const words = content.split(/\s+/).slice(0, 6);
  const title = words.join(" ");
  return title.length > 40 ? title.slice(0, 40) + "…" : title;
}

// Convert Convex conversation format to client Conversation type
function fromCloudConversation(cloud: any): Conversation {
  return {
    id: cloud.conversationId,
    title: cloud.title,
    messages: cloud.messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      mode: m.mode,
      timestamp: m.timestamp,
      model: m.model,
    })),
    mode: cloud.mode,
    createdAt: cloud.createdAt,
    updatedAt: cloud.updatedAt,
  };
}

export function QuantumAppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<QuantumSettings>(loadSettings);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [currentMode, _setCurrentMode] = useState<AIMode>(
    settings.defaultMode,
  );

  // Switching mode clears the current conversation so histories stay separate
  const setCurrentMode = useCallback((mode: AIMode) => {
    _setCurrentMode(mode);
    setCurrentConversation(null);
    convRef.current = null;
  }, []);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [offlineModelState, setOfflineModelState] = useState<OfflineModelState>(
    getOfflineModelStatus,
  );
  const { isOnline } = useConnection();
  const abortRef = useRef<AbortController | null>(null);

  // Auth state
  const { isAuthenticated } = useConvexAuth();

  // Cloud sync mutations
  const saveCloudConv = useMutation(api.conversations.save);
  const removeCloudConv = useMutation(api.conversations.remove);
  const bulkSaveCloud = useMutation(api.conversations.bulkSave);

  // Cloud conversations query (only fetches when authenticated)
  const cloudConversations = useQuery(
    api.conversations.list,
    isAuthenticated ? {} : "skip",
  );

  // Refs to avoid stale closures
  const convRef = useRef<Conversation | null>(null);
  const modeRef = useRef<AIMode>(currentMode);
  const settingsRef = useRef<QuantumSettings>(settings);
  const isOnlineRef = useRef<boolean>(isOnline);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);

  useEffect(() => { convRef.current = currentConversation; }, [currentConversation]);
  useEffect(() => { modeRef.current = currentMode; }, [currentMode]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);
  useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);

  // Subscribe to offline model status changes
  useEffect(() => {
    return onOfflineModelStatus(setOfflineModelState);
  }, []);

  // Auto-load cached wllama model on app startup (works online AND offline)
  useEffect(() => {
    const modelId = settings.offlineModelId;
    if (modelId && wllamaEngine.getState().status === "idle") {
      // Load from IndexedDB cache — works offline too, takes 2-5 seconds
      const timer = setTimeout(() => {
        wllamaEngine.loadModel(modelId).catch((err) => {
          console.warn("[Quantum AI] Auto-load cached model failed:", err);
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [settings.offlineModelId]);

  // Pre-load knowledge base when online (fallback)
  useEffect(() => {
    if (isOnline && offlineModelState.status === "idle" && !settings.offlineModelId) {
      const timer = setTimeout(() => preloadOfflineModel(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineModelState.status, settings.offlineModelId]);

  // Load local conversations on mount
  useEffect(() => {
    getAllConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoadingConversations(false));
  }, []);

  // Sync: when cloud conversations arrive, merge with local
  useEffect(() => {
    if (cloudConversations === undefined) return; // still loading
    if (cloudConversations === null) return; // not authenticated

    setIsSyncing(true);

    const cloudList = cloudConversations.map(fromCloudConversation);

    setConversations((localConvs) => {
      // Merge: cloud is source of truth, add any local-only conversations
      const cloudIds = new Set(cloudList.map((c) => c.id));
      const localOnly = localConvs.filter((c) => !cloudIds.has(c.id));

      // Save local-only conversations to cloud
      if (localOnly.length > 0 && isAuthenticatedRef.current) {
        const toSync = localOnly.map((c) => ({
          conversationId: c.id,
          title: c.title,
          messages: c.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            mode: m.mode,
            timestamp: m.timestamp,
            model: m.model,
          })),
          mode: c.mode,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        // Fire-and-forget cloud save
        bulkSaveCloud({ conversations: toSync }).catch(console.error);
      }

      // Combined list: cloud + local-only, sorted by updatedAt
      const merged = [...cloudList, ...localOnly].sort(
        (a, b) => b.updatedAt - a.updatedAt,
      );

      // Also save merged list locally
      merged.forEach((conv) => saveConversation(conv).catch(console.error));

      setIsSyncing(false);
      return merged;
    });
  }, [cloudConversations, bulkSaveCloud]);

  const createConversation = useCallback((): Conversation => {
    const conv: Conversation = {
      id: generateId(),
      title: "New conversation",
      messages: [],
      mode: modeRef.current,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentConversation(conv);
    convRef.current = conv;
    setConversations((prev) => [conv, ...prev]);
    return conv;
  }, []);

  const selectConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === id);
      if (conv) {
        setCurrentConversation(conv);
        convRef.current = conv;
        _setCurrentMode(conv.mode);
      }
      return prev;
    });
  }, []);

  const deleteConv = useCallback(async (id: string) => {
    await deleteConversationDB(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (convRef.current?.id === id) {
      setCurrentConversation(null);
      convRef.current = null;
    }
    // Also delete from cloud if authenticated
    if (isAuthenticatedRef.current) {
      removeCloudConv({ conversationId: id }).catch(console.error);
    }
  }, [removeCloudConv]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);
  const sendMessage = useCallback(
    async (content: string) => {
      const mode = modeRef.current;
      const currentSettings = settingsRef.current;
      const online = isOnlineRef.current;

      // Check for hidden Easter egg commands
      const trimmedLower = content.trim().toLowerCase();
      if (EASTER_EGG_COMMANDS[trimmedLower]) {
        const eggMessage: Message = {
          id: generateId(),
          role: "user",
          content,
          mode,
          timestamp: Date.now(),
        };

        let conv = convRef.current;
        if (!conv) {
          conv = {
            id: generateId(),
            title: generateTitle(content),
            messages: [eggMessage],
            mode,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        } else {
          conv = {
            ...conv,
            messages: [...conv.messages, eggMessage],
            updatedAt: Date.now(),
          };
        }

        const eggResponse: Message = {
          id: generateId(),
          role: "assistant",
          content: EASTER_EGG_COMMANDS[trimmedLower],
          mode,
          timestamp: Date.now(),
        };

        const finalConv = {
          ...conv,
          messages: [...conv.messages, eggResponse],
          updatedAt: Date.now(),
        };

        setCurrentConversation(finalConv);
        convRef.current = finalConv;
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === finalConv.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = finalConv;
            return updated;
          }
          return [finalConv, ...prev];
        });

        saveConversation(finalConv).catch(console.error);
        if (isAuthenticatedRef.current) {
          saveCloudConv({
            conversationId: finalConv.id,
            title: finalConv.title,
            messages: finalConv.messages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              mode: m.mode,
              timestamp: m.timestamp,
              model: m.model,
            })),
            mode: finalConv.mode,
            createdAt: finalConv.createdAt,
            updatedAt: finalConv.updatedAt,
          }).catch(console.error);
        }
        return;
      }

      const apiKey = "server-proxy";

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        mode,
        timestamp: Date.now(),
      };

      // Create or update conversation
      let conv = convRef.current;
      if (!conv) {
        conv = {
          id: generateId(),
          title: generateTitle(content),
          messages: [userMessage],
          mode,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      } else {
        conv = {
          ...conv,
          messages: [...conv.messages, userMessage],
          updatedAt: Date.now(),
        };
      }

      setCurrentConversation(conv);
      convRef.current = conv;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conv!.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = conv!;
          return updated;
        }
        return [conv!, ...prev];
      });

      setIsStreaming(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        mode,
        timestamp: Date.now(),
      };

      try {
        await streamChat(
          {
            apiKey,
            mode,
            systemPrompt: currentSettings.systemPrompts[mode],
            conversationHistory: conv.messages,
            isOnline: online,
          },
          {
            onChunk: (text) => {
              const updatedMsg = { ...assistantMessage, content: text };
              setCurrentConversation((prev) => {
                if (!prev) return prev;
                const msgs = [...prev.messages];
                const existingIdx = msgs.findIndex(
                  (m) => m.id === assistantMessage.id,
                );
                if (existingIdx >= 0) {
                  msgs[existingIdx] = updatedMsg;
                } else {
                  msgs.push(updatedMsg);
                }
                const updated = { ...prev, messages: msgs, updatedAt: Date.now() };
                convRef.current = updated;
                return updated;
              });
            },
            onDone: (fullText) => {
              const finalMsg: Message = {
                ...assistantMessage,
                content: fullText,
              };
              setCurrentConversation((prev) => {
                if (!prev) return prev;
                const msgs = prev.messages.map((m) =>
                  m.id === finalMsg.id ? finalMsg : m,
                );
                const finalConv = {
                  ...prev,
                  messages: msgs,
                  updatedAt: Date.now(),
                };
                convRef.current = finalConv;

                // Save locally
                saveConversation(finalConv).catch(console.error);

                // Save to cloud if authenticated
                if (isAuthenticatedRef.current) {
                  saveCloudConv({
                    conversationId: finalConv.id,
                    title: finalConv.title,
                    messages: finalConv.messages.map((m) => ({
                      id: m.id,
                      role: m.role as "user" | "assistant",
                      content: m.content,
                      mode: m.mode,
                      timestamp: m.timestamp,
                      model: m.model,
                    })),
                    mode: finalConv.mode,
                    createdAt: finalConv.createdAt,
                    updatedAt: finalConv.updatedAt,
                  }).catch(console.error);
                }

                setConversations((p) =>
                  p.map((c) => (c.id === finalConv.id ? finalConv : c)),
                );
                return finalConv;
              });
              setIsStreaming(false);
              toast.success("Response received");
            },
            onError: (error) => {
              console.error("Stream error:", error);
              toast.error(`Error: ${error.message}`);
              const errorMsg: Message = {
                id: generateId(),
                role: "assistant",
                content: `⚠️ Error: ${error.message}\n\nPlease check your API key in Settings and try again.`,
                mode,
                timestamp: Date.now(),
              };
              setCurrentConversation((prev) => {
                if (!prev) return prev;
                const updated = {
                  ...prev,
                  messages: [...prev.messages, errorMsg],
                  updatedAt: Date.now(),
                };
                convRef.current = updated;
                saveConversation(updated).catch(console.error);
                return updated;
              });
              setIsStreaming(false);
            },
          },
        );
      } catch (error) {
        setIsStreaming(false);
        throw error;
      }
    },
    [offlineModelState.status, saveCloudConv],
  );

  const updateSettingsHandler = useCallback(
    (newSettings: QuantumSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
    },
    [],
  );

  const value: QuantumAppState = {
    settings,
    updateSettings: updateSettingsHandler,
    currentMode,
    setMode: setCurrentMode as (mode: AIMode) => void,
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation: deleteConv,
    isStreaming,
    sendMessage,
    stopStreaming,
    isLoadingConversations,
    offlineModelState,
    isOnline,
    isSyncing,
  };

  return (
    <QuantumAppContext.Provider value={value}>
      {children}
    </QuantumAppContext.Provider>
  );
}

export function useQuantumApp(): QuantumAppState {
  const context = useContext(QuantumAppContext);
  if (!context) {
    throw new Error("useQuantumApp must be used within QuantumAppProvider");
  }
  return context;
}
