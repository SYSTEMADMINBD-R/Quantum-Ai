import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { cn } from "@/lib/utils";
import {
  Brain,
  Shield,
  Zap,
  Globe,
  WifiOff,
  Key,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = {
  general: [
    "Explain quantum computing in simple terms",
    "Write a Python function to sort a list",
    "What are the best practices for REST API design?",
    "Help me debug this React component",
  ],
  hacking: [
    "Explain SQL injection attack vectors and defenses",
    "What are common XSS vulnerabilities in web apps?",
    "How does a man-in-the-middle attack work?",
    "Walk through a basic penetration testing methodology",
  ],
};

export function WelcomeScreen() {
  const { currentMode, settings, createConversation, sendMessage } =
    useQuantumApp();
  const config = MODE_CONFIG[currentMode];
  const hasApiKey =
    currentMode === "general"
      ? settings.geminiApiKeys.length > 0
      : settings.groqApiKeys.length > 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Logo */}
        <div className="mb-8 relative">
          <div
            className={cn(
              "mx-auto h-20 w-20 rounded-2xl flex items-center justify-center bg-gradient-to-br",
              config.color,
              "shadow-2xl",
            )}
          >
            {currentMode === "general" ? (
              <Brain className="h-10 w-10 text-white" />
            ) : (
              <Shield className="h-10 w-10 text-white" />
            )}
          </div>
          <div
            className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-16 rounded-full bg-gradient-to-r blur-sm",
              config.color,
            )}
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            Quantum AI
          </span>
        </h1>
        <p className={cn("text-sm font-medium mb-1", config.textClass)}>
          {config.label} — {config.description}
        </p>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {currentMode === "general"
            ? "Ask anything — from creative writing to technical questions. Powered by Google's Gemini models."
            : "Deep technical analysis on security, networking, and ethical hacking. Powered by Groq's ultra-fast inference."}
        </p>

        {/* No API Key Warning */}
        {!hasApiKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left"
          >
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">
                  API key required
                </p>
                <p className="text-xs text-amber-400/70 mt-1">
                  {currentMode === "general"
                    ? "Add your Google AI Studio API key in Settings to start chatting with Gemini."
                    : "Add your Groq API key in Settings to start chatting with Groq's fast inference."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            {
              icon: Globe,
              title: "Offline Ready",
              desc: "App works offline, chat needs internet",
            },
            {
              icon: Zap,
              title: "Dual Modes",
              desc: "General + Hacking with different models",
            },
            {
              icon: WifiOff,
              title: "Local Storage",
              desc: "Conversations saved on your device",
            },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-border/30 bg-muted/30 p-3"
            >
              <feature.icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs font-medium">{feature.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Suggestions */}
        {hasApiKey && (
          <div className="mt-8 space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              <Sparkles className="h-3 w-3 inline mr-1" />
              Try asking
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS[currentMode].map((suggestion) => (
                <motion.button
                  key={suggestion}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={async () => {
                    createConversation();
                    await sendMessage(suggestion);
                  }}
                  className="group flex items-center gap-2 rounded-xl border border-border/30 bg-muted/20 p-3 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
                >
                  <span className="flex-1">{suggestion}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
