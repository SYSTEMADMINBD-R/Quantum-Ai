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
        <header className="flex items-center justify-between px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-md">
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
          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80 bg-amber-500/8 px-2 py-1 rounded-md">
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
                  <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-md p-3">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-2 rounded-xl border border-border/40 bg-muted/20 p-2 focus-within:border-primary/40 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !isOnline
                    ? "Offline — AI responses require an internet connection"
                    : "Type your message…"
                }
                rows={1}
                className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[2.25rem] max-h-32 text-sm placeholder:text-muted-foreground/40"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button
                  onClick={stopStreaming}
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300"
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || !isOnline}
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white disabled:opacity-20"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
