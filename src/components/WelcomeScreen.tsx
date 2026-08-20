import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { cn } from "@/lib/utils";
import {
  Brain,
  Shield,
  Zap,
  Globe,
  WifiOff,
  ArrowRight,
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { preloadOfflineModel } from "@/lib/offline-ai";

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
  const {
    currentMode,
    settings,
    createConversation,
    sendMessage,
    offlineModelState,
    isOnline,
  } = useQuantumApp();
  const config = MODE_CONFIG[currentMode];
  const hasApiKey =
    currentMode === "general"
      ? settings.geminiApiKeys.length > 0
      : settings.groqApiKeys.length > 0;

  const canChat = hasApiKey || offlineModelState.status === "ready";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto min-h-0">
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
          {!isOnline
            ? "You're offline. Chat with the local AI model running in your browser."
            : hasApiKey
              ? "Ask anything — powered by cloud AI with ultra-fast inference."
              : "Add an API key in Settings, or use the built-in offline model."}
        </p>

        {/* Offline Model Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-xl border border-border/30 bg-muted/20 p-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {offlineModelState.status === "ready" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : offlineModelState.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-400" />
              ) : offlineModelState.status === "idle" ? (
                <Download className="h-5 w-5 text-cyan-400" />
              ) : (
                <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {offlineModelState.status === "ready"
                  ? "Offline model ready"
                  : offlineModelState.status === "downloading"
                    ? `Downloading offline model (${offlineModelState.progress}%)`
                    : offlineModelState.status === "loading"
                      ? "Loading offline model into memory…"
                      : offlineModelState.status === "error"
                        ? "Offline model failed to load"
                        : "Offline AI model"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {offlineModelState.status === "ready"
                  ? "Qwen2-0.5B running locally. Works without internet."
                  : offlineModelState.status === "downloading"
                    ? `Downloading ${offlineModelState.modelSize} from Hugging Face. This may take a few minutes on first load.`
                    : offlineModelState.status === "error"
                      ? offlineModelState.error
                      : "A small language model that runs in your browser. Download once, use forever — even offline."}
              </p>
              {(offlineModelState.status === "idle" ||
                offlineModelState.status === "error") && (
                <button
                  onClick={preloadOfflineModel}
                  className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  {offlineModelState.status === "error"
                    ? "Retry download"
                    : "Download offline model"}
                </button>
              )}
              {offlineModelState.status === "downloading" && (
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${offlineModelState.progress}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            {
              icon: Globe,
              title: "Online + Offline",
              desc: "Cloud AI online, local model offline",
            },
            {
              icon: Zap,
              title: "Dual Modes",
              desc: "General + Hacking with different engines",
            },
            {
              icon: WifiOff,
              title: "Installable",
              desc: "Install as an app on any device",
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

        {/* Suggestions — show when we can chat (API key or offline model ready) */}
        {canChat && (
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
