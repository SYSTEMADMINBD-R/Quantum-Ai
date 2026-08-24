import { useConnection } from "@/hooks/use-connection";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { WifiOff, Wifi, X, Cpu, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const { isOnline, wasOffline, dismissOfflineWarning } = useConnection();
  const { offlineModelState } = useQuantumApp();

  const modelReady = offlineModelState.status === "ready";
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
          <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border-b border-emerald-500/20 px-3 md:px-4 py-2 text-xs md:text-sm text-emerald-400">
            <Cpu className="h-4 w-4 shrink-0" />
            <span className="text-center">Offline — using local AI model</span>
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
