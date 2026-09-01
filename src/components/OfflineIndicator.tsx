import { useConnection } from "@/hooks/use-connection";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { WifiOff, Wifi, X, Cpu, AlertCircle, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OFFLINE_MODELS, wllamaEngine } from "@/lib/wllama-engine";
import { useState, useEffect } from "react";

export function OfflineIndicator() {
  const { isOnline, wasOffline, dismissOfflineWarning } = useConnection();
  const { offlineModelState, settings } = useQuantumApp();

  // Also track wllama engine state for generating status
  const [wllamaStatus, setWllamaStatus] = useState(wllamaEngine.getState().status);
  useEffect(() => {
    return wllamaEngine.subscribe((s) => setWllamaStatus(s.status));
  }, []);

  const modelReady = offlineModelState.status === "ready" || wllamaStatus === "ready";
  const modelError = offlineModelState.status === "error";
  const modelIdle = offlineModelState.status === "idle" && wllamaStatus !== "ready";
  const modelGenerating = wllamaStatus === "generating";

  // Find the model name from settings
  const activeModel = OFFLINE_MODELS.find((m) => m.id === settings.offlineModelId);
  const modelName = activeModel?.name ?? "Knowledge Base";

  return (
    <AnimatePresence>
      {/* Offline — model generating */}
      {!isOnline && modelGenerating && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-blue-500/10 border-b border-blue-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-blue-400">
            <Brain className="h-4 w-4 shrink-0 animate-pulse" />
            <span className="text-center">
              <span className="font-semibold text-blue-300">{modelName}</span> — generating response…
            </span>
          </div>
        </motion.div>
      )}

      {/* Offline — model ready */}
      {!isOnline && modelReady && !modelGenerating && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-emerald-400">
            <Cpu className="h-4 w-4 shrink-0" />
            <span className="text-center">
              Offline — <span className="font-semibold text-emerald-300">{modelName}</span> active
            </span>
          </div>
        </motion.div>
      )}

      {/* Offline — no model */}
      {!isOnline && modelIdle && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-amber-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span className="text-center">
              Offline — go online first to enable offline chat
            </span>
          </div>
        </motion.div>
      )}

      {/* Offline — model error */}
      {!isOnline && modelError && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-red-500/10 border-b border-red-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-center">Offline — model download failed. Go online and retry.</span>
          </div>
        </motion.div>
      )}

      {/* Back online */}
      {isOnline && wasOffline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-emerald-400">
            <Wifi className="h-4 w-4 shrink-0" />
            <span>You're back online!</span>
            <button
              onClick={dismissOfflineWarning}
              className="ml-2 p-1.5 hover:bg-emerald-500/20 rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
