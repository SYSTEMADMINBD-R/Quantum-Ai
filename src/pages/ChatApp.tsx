import { useState, useRef, useEffect } from "react";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { useConnection } from "@/hooks/use-connection";
import { useAuth } from "@/hooks/use-auth";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ModeSwitcher } from "@/components/ModeSwitcher";
import { SettingsDialog } from "@/components/SettingsDialog";
import { MessageBubble } from "@/components/MessageBubble";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import type { MessageAttachment } from "@/types/quantum";
import { OFFLINE_MODELS } from "@/lib/wllama-engine";
import {
  Send,
  Square,
  PanelLeft,
  WifiOff,
  Loader2,
  CheckCircle2,
  Mic,
  MicOff,
  Paperclip,
  X,
  Image,
  FileText,
  Cloud,
  CloudOff,
} from "lucide-react";

// Speech Recognition type
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export default function ChatApp() {
  const {
    currentConversation,
    isStreaming,
    sendMessage,
    stopStreaming,
    offlineModelState,
    settings,
    isSyncing,
  } = useQuantumApp();
  const { isOnline } = useConnection();
  const { isAuthenticated, user } = useAuth();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const messages = currentConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close mobile sidebar when conversation changes
  useEffect(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [currentConversation?.id, isMobile]);

  const canSend =
    (isOnline || offlineModelState.status === "ready") && (input.trim().length > 0 || attachments.length > 0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && attachments.length === 0) || isStreaming) return;
    if (!canSend) return;

    const msgContent = trimmed || (attachments.length > 0 ? `Attached ${attachments.length} file(s)` : "");
    setInput("");
    setAttachments([]);
    try {
      await sendMessage(msgContent);
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input
  const toggleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        // If first result, replace. Otherwise append.
        if (event.resultIndex === 0) return transcript;
        const base = prev.endsWith(transcript.slice(0, 10)) ? prev : prev + " ";
        return base + transcript;
      });
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  // File attachment
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            dataUrl,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be re-attached
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Find model name for offline display
  const activeModel = OFFLINE_MODELS.find((m) => m.id === settings.offlineModelId);
  const offlineModelName = activeModel?.name ?? null;

  const getPlaceholder = () => {
    if (isRecording) return "Listening…";
    if (!isOnline && offlineModelState.status === "ready") {
      return offlineModelName ? `Offline — ${offlineModelName} active` : "Offline — using local AI model";
    }
    if (!isOnline && offlineModelState.status === "idle") {
      return "Offline — go online first to download the AI model";
    }
    if (!isOnline) {
      return "Offline — AI model not available";
    }
    return "Type your message…";
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar — always visible on md+ */}
      {!isMobile && (
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <ChatSidebar
              collapsed={false}
              onToggle={() => setSidebarOpen(false)}
            />
          ) : (
            <div className="flex flex-col items-center w-12 border-r border-border/30 bg-muted/20 py-3 gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="h-10 w-10"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile sidebar — overlay drawer */}
      {isMobile && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-y-0 left-0 z-50 w-[280px]"
              >
                <ChatSidebar
                  collapsed={false}
                  onToggle={() => setMobileMenuOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Banner */}
        <OfflineIndicator />

        {/* Header */}
        <header className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 border-b border-border/30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-3">
            {isMobile ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="h-10 w-10"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            ) : (
              !sidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="h-10 w-10"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              )
            )}
            <ModeSwitcher />
          </div>
          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Cloud sync indicator */}
            {isAuthenticated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60 px-1.5">
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                ) : isOnline ? (
                  <Cloud className="h-3 w-3 text-cyan-400/60" />
                ) : (
                  <CloudOff className="h-3 w-3 text-amber-400/60" />
                )}
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/8 px-2 py-1.5 rounded-md">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const { checkApiKeys } = await import("@/lib/chat-service");
                  const result = await checkApiKeys();
                  setDiagResult(
                    result.status.message +
                    "\n\nGemini keys: " + result.gemini.count +
                    (result.gemini.keyPreview.length > 0 ? " (" + result.gemini.keyPreview.join(", ") + ")" : "") +
                    "\nGroq keys: " + result.groq.count +
                    (result.groq.keyPreview.length > 0 ? " (" + result.groq.keyPreview.join(", ") + ")" : "")
                  );
                } catch (e) {
                  setDiagResult("Error: " + (e instanceof Error ? e.message : String(e)));
                }
              }}
              className="text-sm text-muted-foreground hover:text-foreground gap-1.5 h-10"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden sm:inline">Check Keys</span>
            </Button>
            <SettingsDialog />
          </div>
        </header>

        {/* Diagnostic Banner */}
        {diagResult && (
          <div className="mx-3 md:mx-4 mt-2 p-3 md:p-3.5 rounded-lg bg-muted/50 border border-border/30 text-sm whitespace-pre-wrap">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-foreground">API Key Diagnostics</span>
              <button onClick={() => setDiagResult(null)} className="text-muted-foreground hover:text-foreground p-1">
                ✕
              </button>
            </div>
            <pre className="text-muted-foreground overflow-x-auto text-xs md:text-sm">{diagResult}</pre>
          </div>
        )}

        {/* Chat Area */}
        {hasMessages ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="max-w-3xl mx-auto py-3 md:py-4 px-1">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isLatest={i === messages.length - 1}
                />
              ))}

              {isStreaming &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>
                      {!isOnline && offlineModelName
                        ? `${offlineModelName} — generating response…`
                        : "Generating response…"
                      }
                    </span>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <WelcomeScreen />
        )}

        {/* Input Area */}
        <div className="border-t border-border/40 bg-background/80 backdrop-blur-md p-2.5 md:p-3">
          <div className="max-w-3xl mx-auto">
            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/40 text-xs shrink-0"
                  >
                    {att.type.startsWith("image/") ? (
                      <Image className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-cyan-400" />
                    )}
                    <span className="text-foreground/80 max-w-[120px] truncate">
                      {att.name}
                    </span>
                    <span className="text-muted-foreground/50">
                      {(att.size / 1024).toFixed(0)}KB
                    </span>
                    <button
                      onClick={() => removeAttachment(i)}
                      className="p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-end gap-1.5 md:gap-2 rounded-xl border border-border/60 bg-muted/20 p-1.5 md:p-2 focus-within:border-primary/50 transition-colors">
              {/* Attach button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
                title="Attach file"
              >
                <Paperclip className="h-4.5 w-4.5" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.json,.csv,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={getPlaceholder()}
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[2.75rem] md:min-h-[2.5rem] max-h-32 text-base placeholder:text-muted-foreground/40 py-2"
                disabled={isStreaming || (!isOnline && offlineModelState.status !== "ready")}
              />

              {/* Voice button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoiceInput}
                disabled={isStreaming}
                className={`h-10 w-10 shrink-0 rounded-lg transition-colors ${
                  isRecording
                    ? "text-red-400 bg-red-500/15 hover:bg-red-500/25 voice-recording"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                title={isRecording ? "Stop recording" : "Voice input"}
              >
                {isRecording ? (
                  <MicOff className="h-4.5 w-4.5" />
                ) : (
                  <Mic className="h-4.5 w-4.5" />
                )}
              </Button>

              {/* Send / Stop button */}
              {isStreaming ? (
                <Button
                  onClick={stopStreaming}
                  size="icon"
                  className="h-10 w-10 md:h-9 md:w-9 shrink-0 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!canSend || isStreaming}
                  size="icon"
                  className="h-10 w-10 md:h-9 md:w-9 shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white disabled:opacity-20"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Bottom info */}
            <div className="flex items-center justify-between mt-1.5 px-1">
              <p className="text-[11px] md:text-xs text-muted-foreground/40">
                {!isOnline && offlineModelState.status !== "ready"
                  ? "Go online to download the offline AI model first"
                  : isMobile
                    ? "Tap send · Return for newline"
                    : "Enter to send · Shift+Enter for newline"
                }
              </p>
              {isAuthenticated && (
                <p className="text-[11px] md:text-xs text-cyan-400/40 hidden sm:block">
                  ☁️ Synced across devices
                </p>
              )}
              {!isAuthenticated && (
                <p className="text-[11px] md:text-xs text-muted-foreground/30 hidden sm:block">
                  Guest mode · <a href="/auth" className="underline hover:text-muted-foreground/50">Sign in to sync</a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
