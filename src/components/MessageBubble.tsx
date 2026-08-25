import type { Message } from "@/types/quantum";
import { MODE_CONFIG } from "@/types/quantum";
import { cn } from "@/lib/utils";
import { User, Bot, Copy, Check, Image, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface MessageBubbleProps {
  message: Message;
  isLatest?: boolean;
}

export function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isUser = message.role === "user";
  const modeConfig = MODE_CONFIG[message.mode];
  const hasAttachments = message.attachments && message.attachments.length > 0;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

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
        "group flex gap-2.5 md:gap-3 px-3 md:px-4 py-2.5 md:py-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 md:h-9 md:w-9 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-primary/10 text-primary"
            : `${modeConfig.iconBg} ${modeConfig.textClass}`,
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 md:h-4.5 md:w-4.5" />
        ) : (
          <Bot className="h-4 w-4 md:h-4.5 md:w-4.5" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "relative max-w-[85%] md:max-w-[70%] rounded-2xl px-3.5 md:px-5 py-2.5 md:py-3.5 text-[15px] md:text-base leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/50 text-foreground rounded-tl-sm border border-border/40",
        )}
      >
        {/* Attachments */}
        {hasAttachments && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.attachments!.map((att, i) => (
              <div key={i}>
                {att.type.startsWith("image/") ? (
                  <div className="relative group/att">
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      className="max-w-[200px] max-h-[150px] rounded-lg border border-border/30 object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded">
                      {att.name}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs">
                    <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-foreground/80">{att.name}</div>
                      <div className="text-muted-foreground/50 text-[10px]">
                        {(att.size / 1024).toFixed(0)}KB
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Mode indicator for assistant */}
        {!isUser && (
          <div className="mb-1.5 md:mb-2 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 md:px-2.5 py-0.5 text-[11px] md:text-xs font-medium",
                modeConfig.iconBg,
                modeConfig.textClass,
              )}
            >
              {message.mode === "hacking" ? "🛡️" : "🧠"} {modeConfig.label}
            </span>
            {message.model && (
              <span className="text-[11px] md:text-xs text-muted-foreground hidden sm:inline">
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
            className={cn(
              "absolute -bottom-3 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-muted transition-opacity hover:bg-accent border border-border/50",
              isMobile
                ? "opacity-70"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            "mt-1.5 text-[11px] md:text-xs",
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
