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
  Smartphone,
  Monitor,
  HardDrive,
  Key,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { preloadOfflineModel } from "@/lib/offline-ai";
import { useState } from "react";

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

function detectPlatform(): "ios" | "android" | "windows" | "other" {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(ua)) return "windows";
  return "other";
}

function getInstallInstructions(platform: string) {
  switch (platform) {
    case "ios":
      return {
        icon: Smartphone,
        steps: [
          "Open this page in Safari",
          "Tap the Share button (⬆️ box icon)",
          'Tap "Add to Home Screen"',
          'Tap "Add" to confirm',
        ],
      };
    case "android":
      return {
        icon: Smartphone,
        steps: [
          "Open this page in Chrome",
          'Tap the menu (⋮) → "Install app"',
          'Or tap "Add to Home Screen"',
          "Confirm the install",
        ],
      };
    case "windows":
      return {
        icon: Monitor,
        steps: [
          "Open this page in Edge or Chrome",
          'Click the install icon in the address bar (⊕)',
          'Or click menu → "Install Quantum AI"',
          "Confirm the install",
        ],
      };
    default:
      return {
        icon: Globe,
        steps: [
          "Open this page in Chrome or Edge",
          'Click the install icon in the address bar',
          "Confirm the install",
        ],
      };
  }
}

export function WelcomeScreen() {
  const {
    currentMode,
    settings,
    createConversation,
    sendMessage,
    offlineModelState,
    isOnline,
  } = useQuantumApp();
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const config = MODE_CONFIG[currentMode];
  const hasApiKey =
    currentMode === "general"
      ? settings.geminiApiKeys.length > 0
      : settings.groqApiKeys.length > 0;

  const canChat = hasApiKey || offlineModelState.status === "ready";
  const platform = detectPlatform();
  const installInfo = getInstallInstructions(platform);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Logo */}
        <div className="mb-6 relative">
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

        {/* Setup Steps — clear guide */}
        <div className="mt-6 space-y-3 text-left max-w-md mx-auto">
          {/* Step 1: Install as app */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-border/30 bg-muted/20 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px] font-bold text-cyan-400">
                1
              </div>
              <p className="text-sm font-medium text-foreground">
                Install as an app
              </p>
              <button
                onClick={() => setShowInstallGuide(!showInstallGuide)}
                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showInstallGuide ? "Hide" : "How?"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground ml-9">
              Install Quantum AI on your device for a native app experience.
              Works just like ChatGPT or Gemini — icon on home screen, full screen, no browser bar.
            </p>
            {showInstallGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="ml-9 mt-3 space-y-1.5"
              >
                {installInfo.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-cyan-400 font-mono">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Step 2: Download offline model */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-border/30 bg-muted/20 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px] font-bold text-emerald-400">
                2
              </div>
              <p className="text-sm font-medium text-foreground">
                Download the offline AI
              </p>
            </div>
            <p className="text-xs text-muted-foreground ml-9 mb-3">
              Download the language model once. After that, it works forever — even with no internet.
            </p>

            <div className="ml-9">
              {offlineModelState.status === "ready" ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-medium">Ready — model installed and working</span>
                </div>
              ) : offlineModelState.status === "downloading" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-medium">
                      Downloading… {offlineModelState.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                      animate={{ width: `${offlineModelState.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {offlineModelState.modelSize} — this may take a few minutes on WiFi.
                  </p>
                </div>
              ) : offlineModelState.status === "loading" ? (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">Loading model into memory…</span>
                </div>
              ) : offlineModelState.status === "error" ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Download failed</span>
                  </div>
                  <p className="text-[10px] text-red-400/70">{offlineModelState.error}</p>
                  <button
                    onClick={preloadOfflineModel}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Retry download
                  </button>
                </div>
              ) : (
                <button
                  onClick={preloadOfflineModel}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-3 text-sm font-medium transition-all"
                >
                  <Download className="h-4 w-4" />
                  Download Offline Model
                  <span className="text-xs opacity-70 ml-1">(~400MB)</span>
                </button>
              )}
            </div>
          </motion.div>

          {/* Step 3: Add API keys (optional) */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-border/30 bg-muted/20 p-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px] font-bold text-purple-400">
                3
              </div>
              <p className="text-sm font-medium text-foreground">
                Add API keys <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground ml-9">
              For faster, smarter cloud AI — add your Gemini or Groq API keys in Settings (⚙️).
              Without keys, the offline model handles everything.
            </p>
          </motion.div>
        </div>

        {/* Suggestions — show when we can chat */}
        {canChat && (
          <div className="mt-6 space-y-2">
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
