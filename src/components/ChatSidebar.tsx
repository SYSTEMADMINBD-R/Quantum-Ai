import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
    settings,
  } = useQuantumApp();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (collapsed) {
    return (
      <div className="flex flex-col items-center w-12 border-r border-border/30 bg-muted/20 py-3 gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Separator />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => createConversation()}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex flex-col gap-1 mt-2">
          {conversations.slice(0, 10).map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                currentConversation?.id === conv.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              title={conv.title}
            >
              <MessageSquare className="h-3.5 w-3.5" />
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
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="text-sm font-semibold">Quantum AI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-7 w-7"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode status */}
      <div className="px-3 py-2">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
            MODE_CONFIG[currentMode].bgClass,
            MODE_CONFIG[currentMode].borderClass,
            "border",
          )}
        >
          {currentMode === "general" ? (
            <Brain className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
          )}
          <span className={cn("font-medium", MODE_CONFIG[currentMode].textClass)}>
            {MODE_CONFIG[currentMode].label}
          </span>
          <span className="text-muted-foreground ml-auto">
            {MODE_CONFIG[currentMode].model}
          </span>
        </div>
        {/* API key status */}
        <div className="mt-1.5 px-1 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              currentMode === "general"
                ? settings.geminiApiKeys.length > 0
                  ? "bg-emerald-400"
                  : "bg-amber-400"
                : settings.groqApiKeys.length > 0
                  ? "bg-emerald-400"
                  : "bg-amber-400",
            )}
          />
          {currentMode === "general"
            ? `${settings.geminiApiKeys.length} Gemini key(s)`
            : `${settings.groqApiKeys.length} Groq key(s)`}
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
            {conversations.map((conv) => (
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
                    "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    currentConversation?.id === conv.id
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{conv.title}</span>
                  {hoveredId === conv.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="shrink-0 p-1 hover:bg-destructive/10 rounded text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {conversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-xs">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No conversations yet</p>
              <p className="mt-1">Start a new one above</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
