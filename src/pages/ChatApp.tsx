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
} from "lucide-react";

export default function ChatApp() {
  const {
    currentConversation,
    isStreaming,
    sendMessage,
    stopStreaming,
    createConversation,
  } = useQuantumApp();
  const { isOnline } = useConnection();
  const [input, setInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = currentConversation?.messages ?? [];
  const hasMessages = messages.length > 0;

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

    setInput("");
    try {
      if (!currentConversation) {
        createConversation();
      }
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarCollapsed ? null : (
          <ChatSidebar
            collapsed={false}
            onToggle={() => setSidebarCollapsed(true)}
          />
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Banner */}
        <OfflineIndicator />

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="h-8 w-8"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            )}
            <ModeSwitcher />
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                <WifiOff className="h-3 w-3" />
                Offline
              </div>
            )}
            <SettingsDialog />
          </div>
        </header>

        {/* Chat Area */}
        {hasMessages ? (
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto py-4">
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
                    <span>Thinking...</span>
                  </div>
                )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        ) : (
          <WelcomeScreen />
        )}

        {/* Input Area */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-md p-3">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-2xl border border-border/50 bg-muted/30 p-2 focus-within:border-primary/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isOnline
                    ? "You're offline — AI responses need internet"
                    : "Type your message..."
                }
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[2.5rem] max-h-32 text-sm"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button
                  onClick={stopStreaming}
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || !isOnline}
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white disabled:opacity-30"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
