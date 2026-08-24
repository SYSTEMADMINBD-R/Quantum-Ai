import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { cn } from "@/lib/utils";
import { Brain, Shield, Zap } from "lucide-react";

export function ModeSwitcher() {
  const { currentMode, setMode } = useQuantumApp();
  const config = MODE_CONFIG[currentMode];

  return (
    <div className="flex items-center gap-1.5 md:gap-2">
      <div className="relative flex items-center rounded-xl bg-muted/50 p-0.5 md:p-1">
        <button
          onClick={() => setMode("general")}
          className={cn(
            "relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-300 min-h-[40px]",
            currentMode === "general"
              ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Brain className="h-4 w-4 md:h-4.5 md:w-4.5" />
          <span className="hidden sm:inline">General</span>
          {currentMode === "general" && (
            <Zap className="h-3 w-3 md:h-3.5 md:w-3.5 text-cyan-400/60 hidden sm:block" />
          )}
        </button>
        <button
          onClick={() => setMode("hacking")}
          className={cn(
            "relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2 rounded-lg text-sm md:text-base font-medium transition-all duration-300 min-h-[40px]",
            currentMode === "hacking"
              ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Shield className="h-4 w-4 md:h-4.5 md:w-4.5" />
          <span className="hidden sm:inline">Hacking</span>
          {currentMode === "hacking" && (
            <Zap className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-400/60 hidden sm:block" />
          )}
        </button>
      </div>
      <div className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className={cn("font-medium", config.textClass)}>
          {config.model}
        </span>
        <span>•</span>
        <span>{config.description}</span>
      </div>
    </div>
  );
}
