import { useState, useRef, useEffect } from "react";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { useConnection } from "@/hooks/use-connection";
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
import {
  Send,
  Square,
  PanelLeft,
  WifiOff,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ChatApp() {
  const {
    currentConversation,
    isStreaming,
    sendMessage,
    stopStreaming,
    offlineModelState,
  } = useQuantumApp();
  const { isOnline } = useConnection();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

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
    (isOnline || offlineModelState.status === "ready") && input.trim().length > 0;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    if (!canSend) return;
    setInput("");
    try {
      await sendMessage(trimmed);
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

  const getPlaceholder = () => {
    if (!isOnline && offlineModelState.status === "ready") {
      return "Offline — using local AI model";
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
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Drawer */}
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
            {/* Mobile: hamburger menu */}
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
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400/80 bg-amber-500/8 px-2 py-1.5 rounded-md">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
            {/* Check Keys — icon only on mobile */}
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

              {/* Streaming indicator */}
              {isStreaming &&
                messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating response…</span>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <WelcomeScreen />
        )}

        {/* Input Area */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-md p-2.5 md:p-3">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-xl border border-border/40 bg-muted/20 p-1.5 md:p-2 focus-within:border-primary/40 transition-colors">
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
            <p className="text-[11px] md:text-xs text-muted-foreground/40 text-center mt-1.5 px-2">
              {!isOnline && offlineModelState.status !== "ready"
                ? "Go online to download the offline AI model first"
                : isMobile
                  ? "Tap send · Return for newline"
                  : "Enter to send · Shift+Enter for newline"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
