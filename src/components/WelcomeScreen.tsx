"use client";

import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { hasApiKeys } from "@/lib/settings-storage";
import { Brain, Zap, Wifi, WifiOff, Download, Loader2 } from "lucide-react";

export function WelcomeScreen() {
  const { settings, currentMode, offlineModelState, isOnline } =
    useQuantumApp();
  const config = MODE_CONFIG[currentMode];
  const keys = hasApiKeys(settings);
  const hasKey = currentMode === "general" ? keys.general : keys.hacking;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="relative mb-6">
        <div
          className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg shadow-cyan-500/20`}
        >
          <Brain className="h-10 w-10 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0c1017] flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 text-white" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
        Quantum AI
      </h1>
      <p className="text-sm font-medium text-cyan-400 mb-1">
        {config.label} — {config.description}
      </p>
      <p className="text-slate-500 text-sm max-w-md text-center leading-relaxed">
        {currentMode === "general"
          ? "Ask anything — from creative writing to technical questions. Powered by Google's Gemini models."
          : "Expert cybersecurity analysis, penetration testing guidance, and security research. Powered by Groq."}
      </p>

      {/* Feature badges */}
      <div className="flex gap-6 mt-8 text-xs text-slate-500">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-400" />
            ) : (
              <WifiOff className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <span>Dual Modes</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {offlineModelState.status === "ready" ? (
              <Download className="h-4 w-4 text-emerald-400" />
            ) : offlineModelState.status === "downloading" ||
              offlineModelState.status === "loading" ? (
              <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
            ) : (
              <Download className="h-4 w-4 text-slate-400" />
            )}
          </div>
          <span>Offline AI</span>
        </div>
      </div>

      {/* Offline model download section */}
      {isOnline && offlineModelState.status === "idle" && (
        <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] max-w-sm w-full">
          <div className="flex items-center gap-3 mb-3">
            <Download className="h-5 w-5 text-cyan-400 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-slate-200">
                Enable Offline Mode
              </h3>
              <p className="text-xs text-slate-500">
                Download a lightweight AI model (~400MB) that runs locally in
                your browser. Once installed, chat works without internet.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            The model downloads in the background and is cached permanently.
          </p>
        </div>
      )}

      {/* Downloading progress */}
      {(offlineModelState.status === "downloading" ||
        offlineModelState.status === "loading") && (
        <div className="mt-8 p-4 rounded-xl bg-white/[0.03] border border-cyan-500/20 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-slate-200">
                {offlineModelState.status === "downloading"
                  ? "Downloading AI Model..."
                  : "Loading Model into Memory..."}
              </h3>
              <p className="text-xs text-slate-500">
                {offlineModelState.progress !== undefined
                  ? `${Math.round(offlineModelState.progress)}% complete`
                  : "Preparing..."}
              </p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${offlineModelState.progress ?? 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Model ready */}
      {offlineModelState.status === "ready" && (
        <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-sm w-full">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-emerald-400">
                Offline AI Ready
              </h3>
              <p className="text-xs text-slate-500">
                Model installed and working. Chat works without internet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      <p className="mt-8 text-xs text-slate-600 max-w-sm text-center">
        {isOnline
          ? "Start typing below — AI is powered by server-side API keys. No setup needed."
          : offlineModelState.status === "ready"
            ? "Offline mode active — responses use the local AI model."
            : "Connect to the internet to use cloud AI, or download the offline model."}
      </p>
    </div>
  );
}
