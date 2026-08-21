import { useConnection } from "@/hooks/use-connection";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { WifiOff, Wifi, X, Cpu, Download, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { preloadOfflineModel } from "@/lib/offline-ai";

export function OfflineIndicator() {
  const { isOnline, wasOffline, dismissOfflineWarning } = useConnection();
  const { offlineModelState } = useQuantumApp();

  const modelReady = offlineModelState.status === "ready";
  const modelDownloading = offlineModelState.status === "downloading" || offlineModelState.status === "loading";
  const modelError = offlineModelState.status === "error";
  const modelIdle = offlineModelState.status === "idle";

  return (
    <AnimatePresence>
      {/* Offline — model ready */}
      {!isOnline && modelReady && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
            <Cpu className="h-4 w-4 shrink-0" />
            <span>Offline — using local AI model</span>
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
          <div className="flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-sm text-amber-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              Offline — download the offline model while online to chat without internet
            </span>
          </div>
        </motion.div>
      )}

      {/* Offline — model downloading */}
      {!isOnline && modelDownloading && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 text-sm text-cyan-400">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span>
              Offline — model downloading {offlineModelState.progress !== undefined ? `(${Math.round(offlineModelState.progress)}%)` : ""}
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
          <div className="flex items-center justify-center gap-2 bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Offline — model download failed. Go online and retry.</span>
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
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
            <Wifi className="h-4 w-4 shrink-0" />
            <span>You're back online!</span>
            <button
              onClick={dismissOfflineWarning}
              className="ml-2 p-0.5 hover:bg-emerald-500/20 rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
