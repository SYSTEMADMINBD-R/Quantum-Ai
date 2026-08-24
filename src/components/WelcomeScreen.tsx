"use client";

import { Link } from "react-router";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { MODE_CONFIG } from "@/types/quantum";
import { Brain, Zap, Wifi, WifiOff, CheckCircle } from "lucide-react";


export function WelcomeScreen() {
  const { settings, currentMode, offlineModelState, isOnline } =
    useQuantumApp();
  const config = MODE_CONFIG[currentMode];



  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12 overflow-y-auto">
      {/* Logo */}
      <div className="relative mb-5 md:mb-6">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg shadow-cyan-500/20 overflow-hidden">
          <img src="/logo.svg" alt="Quantum AI" className="w-full h-full" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-500 border-2 border-[#0c1017] flex items-center justify-center">
          <Zap className="h-2.5 w-2.5 md:h-3 md:w-3 text-white" />
        </div>
      </div>

      {/* Title */}
      <Link to="/" className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2 hover:opacity-80 transition-opacity">
        Quantum AI
      </Link>
      <p className="text-sm md:text-base font-medium text-cyan-400 mb-1 text-center">
        {config.label} — {config.description}
      </p>
      <p className="text-slate-500 text-sm md:text-base max-w-md text-center leading-relaxed px-2">
        {currentMode === "general"
          ? "Ask anything — from creative writing to technical questions. Powered by Google's Gemini models."
          : "Expert cybersecurity analysis, penetration testing guidance, and security research. Powered by Groq."}
      </p>

      {/* Feature badges — wrap on mobile */}
      <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-6 md:mt-8 text-sm text-slate-500">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            {isOnline ? (
              <Wifi className="h-4.5 w-4.5 md:h-5 md:w-5 text-emerald-400" />
            ) : (
              <WifiOff className="h-4.5 w-4.5 md:h-5 md:w-5 text-amber-400" />
            )}
          </div>
          <span className="text-xs md:text-sm">{isOnline ? "Online" : "Offline"}</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="h-4.5 w-4.5 md:h-5 md:w-5 text-cyan-400" />
          </div>
          <span className="text-xs md:text-sm">Dual Modes</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <CheckCircle className="h-4.5 w-4.5 md:h-5 md:w-5 text-emerald-400" />
          </div>
          <span className="text-xs md:text-sm">Offline AI</span>
        </div>
      </div>

      {/* Offline mode - always available */}
      <div className="mt-6 md:mt-8 p-4 md:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-md w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-semibold text-emerald-400">
              Offline Mode Ready
            </h3>
            <p className="text-xs md:text-sm text-slate-400">
              Built-in AI engine — works instantly without internet or downloads.
            </p>
          </div>
        </div>
      </div>

      {/* Usage tips */}
      <div className="mt-6 md:mt-8 text-xs md:text-sm text-slate-600 max-w-md text-center space-y-2 px-2">
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
