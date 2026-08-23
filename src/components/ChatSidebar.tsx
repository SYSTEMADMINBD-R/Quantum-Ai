import { Link } from "react-router";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG, type AIMode } from "@/types/quantum";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  Brain,
  Shield,
  Zap,
  Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

interface ChatSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatSidebar({ collapsed, onToggle }: ChatSidebarProps) {
  const {
    conversations,
    currentConversation,
    createConversation,
    selectConversation,
    deleteConversation,
    currentMode,
  } = useQuantumApp();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter conversations by current mode
  const filteredConversations = useMemo(
    () => conversations.filter((c) => c.mode === currentMode),
    [conversations, currentMode],
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-12 border-r border-border/30 bg-muted/20 py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9"
        >
          <PanelLeft className="h-4.5 w-4.5" />
        </Button>
        <Separator />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => createConversation()}
          className="h-9 w-9"
        >
          <Plus className="h-4.5 w-4.5" />
        </Button>
        <div className="flex flex-col gap-1 mt-2">
          {filteredConversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={cn(
                "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                currentConversation?.id === conv.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={conv.title}
            >
              <MessageSquare className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="flex flex-col border-r border-border/30 bg-muted/20 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Quantum AI" className="h-8 w-8 rounded-lg" />
          <Link to="/" className="text-base font-semibold hover:text-cyan-400 transition-colors">Quantum AI</Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <PanelLeftClose className="h-4.5 w-4.5" />
        </Button>
      </div>

      {/* Mode status */}
      <div className="px-3 py-2">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm",
            MODE_CONFIG[currentMode].bgClass,
            MODE_CONFIG[currentMode].borderClass,
            "border",
          )}
        >
          {currentMode === "general" ? (
            <Brain className="h-4 w-4 text-cyan-400" />
          ) : (
            <Shield className="h-4 w-4 text-emerald-400" />
          )}
          <span className={cn("font-medium", MODE_CONFIG[currentMode].textClass)}>
            {MODE_CONFIG[currentMode].label}
          </span>
          <span className="text-muted-foreground ml-auto text-xs">
            {MODE_CONFIG[currentMode].model}
          </span>
        </div>
        {/* Server-side status */}
        <div className="mt-1.5 px-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>API configured server-side</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <Button
          onClick={() => createConversation()}
          className="w-full gap-2 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 border border-cyan-500/20 text-cyan-400"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      <Separator className="opacity-30" />

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          <AnimatePresence mode="popLayout">
            {filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <button
                  onClick={() => selectConversation(conv.id)}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    currentConversation?.id === conv.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded shrink-0 font-medium",
                    conv.mode === "general"
                      ? "bg-cyan-500/15 text-cyan-400"
                      : "bg-emerald-500/15 text-emerald-400",
                  )}>
                    {conv.mode === "general" ? "Gen" : "Hack"}
                  </span>
                  {hoveredId === conv.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="shrink-0 p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <p className="mt-1">Start a new one above</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer credit */}
      <div className="border-t border-border/30 px-3 py-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
          <Code2 className="h-3.5 w-3.5" />
          <span>Made by <span className="text-cyan-400/70 font-medium">RAGIB</span></span>
        </div>
      </div>
    </motion.aside>
  );
}
