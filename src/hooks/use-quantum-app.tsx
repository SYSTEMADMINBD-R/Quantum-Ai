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
  getActiveApiKey,
} from "@/lib/settings-storage";
import {
  saveConversation,
  getAllConversations,
  deleteConversation as deleteConversationDB,
} from "@/lib/storage";
import { streamChat } from "@/lib/chat-service";
import { useConnection } from "@/hooks/use-connection";
import type { OfflineModelState } from "@/lib/offline-ai";
import {
  getOfflineModelStatus,
  onOfflineModelStatus,
  preloadOfflineModel,
} from "@/lib/offline-ai";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";

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

export function QuantumAppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<QuantumSettings>(loadSettings);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMode>(
    settings.defaultMode,
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [offlineModelState, setOfflineModelState] = useState<OfflineModelState>(
    getOfflineModelStatus,
  );
  const { isOnline } = useConnection();
  const abortRef = useRef<AbortController | null>(null);

  // Cloud sync (optional — for users who want to persist settings)
  const { isAuthenticated } = useConvexAuth();

  // Refs to avoid stale closures
  const convRef = useRef<Conversation | null>(null);
  const modeRef = useRef<AIMode>(currentMode);
  const settingsRef = useRef<QuantumSettings>(settings);
  const isOnlineRef = useRef<boolean>(isOnline);


  useEffect(() => { convRef.current = currentConversation; }, [currentConversation]);
  useEffect(() => { modeRef.current = currentMode; }, [currentMode]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

  // No cloud settings sync needed — API keys are server-side via Convex env vars

  // Subscribe to offline model status changes
  useEffect(() => {
    return onOfflineModelStatus(setOfflineModelState);
  }, []);

  // Pre-load offline model when online (so it's ready when user goes offline)
  useEffect(() => {
    if (isOnline && offlineModelState.status === "idle") {
      const timer = setTimeout(() => preloadOfflineModel(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, offlineModelState.status]);

  useEffect(() => {
    getAllConversations()
      .then(setConversations)
      .catch(console.error)
      .finally(() => setIsLoadingConversations(false));
  }, []);

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
        setCurrentMode(conv.mode);
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
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const mode = modeRef.current;
      const currentSettings = settingsRef.current;
      const online = isOnlineRef.current;

      // API keys are now server-side (Convex env vars). No client-side key needed.
      // Pass a dummy key to indicate we're using the server proxy.
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
                saveConversation(finalConv).catch(console.error);
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
    [offlineModelState.status],
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
    setMode: setCurrentMode,
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
