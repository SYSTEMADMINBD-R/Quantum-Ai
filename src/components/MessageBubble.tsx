import type { Message } from "@/types/quantum";
import { MODE_CONFIG } from "@/types/quantum";
import { cn } from "@/lib/utils";
import { User, Bot, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const modeConfig = MODE_CONFIG[message.mode];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  };

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "group flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-primary/10 text-primary"
            : `${modeConfig.iconBg} ${modeConfig.textClass}`,
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "relative max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/50 text-foreground rounded-tl-sm border border-border/30",
        )}
      >
        {/* Mode indicator for assistant */}
        {!isUser && (
          <div className="mb-2 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                modeConfig.iconBg,
                modeConfig.textClass,
              )}
            >
              {message.mode === "hacking" ? "🛡️" : "🧠"} {modeConfig.label}
            </span>
            {message.model && (
              <span className="text-[10px] text-muted-foreground">
                via {message.model}
              </span>
            )}
          </div>
        )}

        {/* Message text */}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Copy button */}
        {!isUser && message.content && (
          <button
            onClick={copyToClipboard}
            className="absolute -bottom-3 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent border border-border/50"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-400" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1.5 text-[10px]",
            isUser
              ? "text-primary-foreground/50"
              : "text-muted-foreground/50",
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.div>
  );
}
