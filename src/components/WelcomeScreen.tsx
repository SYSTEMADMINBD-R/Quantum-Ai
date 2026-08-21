"use client";

import { Link } from "react-router";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { hasApiKeys } from "@/lib/settings-storage";
import { Brain, Zap, Wifi, WifiOff, Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { preloadOfflineModel } from "@/lib/offline-ai";

export function WelcomeScreen() {
  const { settings, currentMode, offlineModelState, isOnline } =
    useQuantumApp();
  const config = MODE_CONFIG[currentMode];
  const keys = hasApiKeys(settings);
  const hasKey = currentMode === "general" ? keys.general : keys.hacking;

  const handleDownload = () => {
    preloadOfflineModel();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="relative mb-6">
        <div
          className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg shadow-cyan-500/20`}
        >
          <Brain className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0c1017] flex items-center justify-center">
          <Zap className="h-3 w-3 text-white" />
        </div>
      </div>

      {/* Title */}
      <Link to="/" className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 hover:opacity-80 transition-opacity">
        Quantum AI
      </Link>
      <p className="text-base font-medium text-cyan-400 mb-1">
        {config.label} — {config.description}
      </p>
      <p className="text-slate-500 text-base max-w-md text-center leading-relaxed">
        {currentMode === "general"
          ? "Ask anything — from creative writing to technical questions. Powered by Google's Gemini models."
          : "Expert cybersecurity analysis, penetration testing guidance, and security research. Powered by Groq."}
      </p>

      {/* Feature badges */}
      <div className="flex gap-6 mt-8 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-emerald-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-cyan-400" />
          </div>
          <span>Dual Modes</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {offlineModelState.status === "ready" ? (
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : offlineModelState.status === "downloading" ||
              offlineModelState.status === "loading" ? (
              <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
            ) : (
              <Download className="h-5 w-5 text-slate-400" />
            )}
          </div>
          <span>Offline AI</span>
        </div>
      </div>

      {/* === OFFLINE MODEL SECTION — This is the key UI === */}

      {/* Model not downloaded yet + Online → Show download button */}
      {offlineModelState.status === "idle" && (
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-b from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 max-w-md w-full">
          <div className="text-center mb-4">
            <Download className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200 mb-2">
              Download Offline AI
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              This installs a lightweight AI model (~400MB) that runs directly in your browser.
              Once downloaded, you can chat <span className="text-cyan-400 font-medium">without internet</span> — no API keys needed.
            </p>
          </div>

          {isOnline ? (
            <Button
              onClick={handleDownload}
              className="w-full gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium py-5 text-base"
            >
              <Download className="h-5 w-5" />
              Download & Install Offline Model
            </Button>
          ) : (
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-amber-400 font-medium mb-1">
                Internet Required for Download
              </p>
              <p className="text-xs text-slate-500">
                Connect to the internet first, then come back to download the offline model.
                After that, it works forever without internet.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600 text-center mt-3">
            Downloaded once → cached permanently in your browser
          </p>
        </div>
      )}

      {/* Download in progress */}
      {(offlineModelState.status === "downloading" ||
        offlineModelState.status === "loading") && (
        <div className="mt-8 p-6 rounded-xl bg-gradient-to-b from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 max-w-md w-full">
          <div className="text-center mb-4">
            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-200 mb-1">
              {offlineModelState.status === "downloading"
                ? "Downloading AI Model..."
                : "Loading Model into Memory..."}
            </h3>
            <p className="text-sm text-slate-400">
              {offlineModelState.progress !== undefined
                ? `${Math.round(offlineModelState.progress)}% complete`
                : "Preparing..."}
            </p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${offlineModelState.progress ?? 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-slate-600 text-center mt-3">
            Keep this tab open — downloading from Hugging Face
          </p>
        </div>
      )}

      {/* Model is ready */}
      {offlineModelState.status === "ready" && (
        <div className="mt-8 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-md w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-emerald-400">
                Offline AI Ready
              </h3>
              <p className="text-sm text-slate-400">
                Model installed. Chat works without internet!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Model error */}
      {offlineModelState.status === "error" && (
        <div className="mt-8 p-5 rounded-xl bg-red-500/10 border border-red-500/20 max-w-md w-full">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-red-400">
                Download Failed
              </h3>
              <p className="text-sm text-slate-400">
                {offlineModelState.error || "An error occurred during download."}
              </p>
            </div>
          </div>
          {isOnline && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Download className="h-4 w-4" />
              Retry Download
            </Button>
          )}
        </div>
      )}

      {/* Usage tips */}
      <div className="mt-8 text-sm text-slate-600 max-w-md text-center space-y-2">
        {!isOnline && offlineModelState.status !== "ready" ? (
          <div className="flex items-center justify-center gap-2 text-amber-400/80">
            <WifiOff className="h-4 w-4" />
            <span>Go online to download the offline model first</span>
          </div>
        ) : !isOnline && offlineModelState.status === "ready" ? (
          <p>Offline mode active — responses use the local AI model.</p>
        ) : (
          <p>Start typing below — AI is powered by server-side API keys. No setup needed.</p>
        )}
      </div>
    </div>
  );
}
