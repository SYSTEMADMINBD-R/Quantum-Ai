"use client";

import { useEffect, useState } from "react";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Download, Cpu, Check, Loader2, AlertCircle, X } from "lucide-react";
import {
  OFFLINE_MODELS,
  isWllamaSupported,
  wllamaEngine,
  type WllamaState,
} from "@/lib/wllama-engine";

function OfflineModelSection({
  settings,
  updateSettings,
}: {
  settings: any;
  updateSettings: (s: any) => void;
}) {
  const [supported] = useState(isWllamaSupported);
  const [engineState, setEngineState] = useState<WllamaState>(wllamaEngine.getState());

  useEffect(() => {
    return wllamaEngine.subscribe(setEngineState);
  }, []);

  const selectedModel = settings.offlineModelId || "qwen3-1.7b-q4_k_m";

  const handleDownload = async (modelId: string) => {
    updateSettings({ ...settings, offlineModelId: modelId });
    await wllamaEngine.loadModel(modelId);
  };

  const handleCancel = () => {
    wllamaEngine.cancel();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-base font-medium text-slate-300 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-purple-400" />
        Offline AI Model
      </h3>

      {!supported ? (
        <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-amber-400 font-medium">WebAssembly not available</p>
              <p className="text-xs text-amber-400/70 mt-1">
                Your browser doesn&apos;t support WebAssembly. The built-in knowledge base will be used for offline responses.
                Try Chrome, Firefox, or Edge for real offline AI models.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            Download a real AI model to use offline. Runs on your phone&apos;s CPU — no special GPU needed.
            Works on ANY Android phone with 4GB+ RAM. Download once, use forever.
          </p>

          {/* Download progress */}
          {(engineState.status === "downloading" || engineState.status === "loading") && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                  <span className="text-sm text-purple-300">
                    {engineState.status === "downloading" ? "Downloading model..." : "Loading model..."}
                  </span>
                </div>
                {engineState.canCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    onClick={handleCancel}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-1">
                <div
                  className="bg-purple-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${engineState.progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">{engineState.downloadProgress || "Preparing..."}</p>
            </div>
          )}

          {/* Error */}
          {engineState.status === "error" && engineState.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{engineState.error}</p>
            </div>
          )}

          {/* Model list */}
          <div className="space-y-2">
            {OFFLINE_MODELS.map((model) => {
              const isSelected = selectedModel === model.id;
              const isLoaded = engineState.status === "ready" && engineState.modelId === model.id;
              const isDownloadingThis = engineState.status === "downloading" || engineState.status === "loading";

              return (
                <div
                  key={model.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-200">{model.name}</span>
                        {model.recommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
                            Recommended
                          </span>
                        )}
                        {isLoaded && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium flex items-center gap-1">
                            <Check className="h-2.5 w-2.5" /> Loaded
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{model.description}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{model.size} · {model.params} params</p>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className={`shrink-0 h-8 text-xs ${
                        isSelected
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "border-white/10 text-slate-300 hover:bg-white/5"
                      }`}
                      disabled={isDownloadingThis}
                      onClick={() => handleDownload(model.id)}
                    >
                      {isLoaded ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : isDownloadingThis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsDialog() {
  const { settings, updateSettings } = useQuantumApp();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-slate-400 hover:text-slate-200 hover:bg-white/5"
        >
          <Settings className="h-4.5 w-4.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#141920] border-white/10 text-slate-200 max-w-lg max-h-[85vh] overflow-y-auto mx-4 md:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info banner */}
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400">
              API keys are configured server-side. No setup needed — the app
              works on any device automatically.
            </p>
          </div>

          {/* System Prompts */}
          <div className="space-y-3">
            <h3 className="text-base font-medium text-slate-300">
              General System Prompt
            </h3>
            <Textarea
              value={settings.systemPrompts.general}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  systemPrompts: {
                    ...settings.systemPrompts,
                    general: e.target.value,
                  },
                })
              }
              className="bg-white/5 border-white/10 text-slate-200 text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-slate-300">
              Hacking System Prompt
            </h3>
            <Textarea
              value={settings.systemPrompts.hacking}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  systemPrompts: {
                    ...settings.systemPrompts,
                    hacking: e.target.value,
                  },
                })
              }
              className="bg-white/5 border-white/10 text-slate-200 text-sm min-h-[80px]"
            />
          </div>

          {/* Offline AI Model */}
          <OfflineModelSection settings={settings} updateSettings={updateSettings} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
