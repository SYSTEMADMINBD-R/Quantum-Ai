"use client";

import { useCallback } from "react";
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
import { Settings } from "lucide-react";

export function SettingsDialog() {
  const { settings, updateSettings } = useQuantumApp();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-white/5"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#141920] border-white/10 text-slate-200 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Info banner */}
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-400">
              API keys are configured server-side. No setup needed — the app
              works on any device automatically.
            </p>
          </div>

          {/* System Prompts */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">
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
              className="bg-white/5 border-white/10 text-slate-200 text-xs min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-300">
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
              className="bg-white/5 border-white/10 text-slate-200 text-xs min-h-[80px]"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
