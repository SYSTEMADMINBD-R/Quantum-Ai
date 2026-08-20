import { useConnection } from "@/hooks/use-connection";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { WifiOff, Wifi, X, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const { isOnline, wasOffline, dismissOfflineWarning } = useConnection();
  const { offlineModelState } = useQuantumApp();

  const modelReady = offlineModelState.status === "ready";

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 text-sm text-cyan-400">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              {modelReady
                ? "You're offline — using the local AI model"
                : "You're offline — download the offline model to chat without internet"}
            </span>
            {modelReady && (
              <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            )}
          </div>
        </motion.div>
      )}

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
