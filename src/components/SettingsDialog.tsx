"use client";

import { useCallback, useRef, useState } from "react";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  Plus,
  Trash2,
  KeyRound,
  Download,
  Upload,
  Copy,
  Check,
} from "lucide-react";

export function SettingsDialog() {
  const { settings, updateSettings } = useQuantumApp();
  const [open, setOpen] = useState(false);
  const [newGeminiKey, setNewGeminiKey] = useState("");
  const [newGroqKey, setNewGroqKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addGeminiKey = useCallback(() => {
    const key = newGeminiKey.trim();
    if (!key) return;
    if (settings.geminiApiKeys.includes(key)) {
      setNewGeminiKey("");
      return;
    }
    updateSettings({ ...settings, geminiApiKeys: [...settings.geminiApiKeys, key] });
    setNewGeminiKey("");
  }, [newGeminiKey, settings, updateSettings]);

  const addGroqKey = useCallback(() => {
    const key = newGroqKey.trim();
    if (!key) return;
    if (settings.groqApiKeys.includes(key)) {
      setNewGroqKey("");
      return;
    }
    updateSettings({ ...settings, groqApiKeys: [...settings.groqApiKeys, key] });
    setNewGroqKey("");
  }, [newGroqKey, settings, updateSettings]);

  const removeGeminiKey = useCallback(
    (index: number) => {
      const updated = settings.geminiApiKeys.filter((_, i) => i !== index);
      updateSettings({ ...settings, geminiApiKeys: updated });
    },
    [settings, updateSettings],
  );

  const removeGroqKey = useCallback(
    (index: number) => {
      const updated = settings.groqApiKeys.filter((_, i) => i !== index);
      updateSettings({ ...settings, groqApiKeys: updated });
    },
    [settings, updateSettings],
  );

  const maskKey = (key: string) => {
    if (key.length <= 12) return "••••••••";
    return key.slice(0, 6) + "••••" + key.slice(-4);
  };

  const handleExport = useCallback(() => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        geminiApiKeys: settings.geminiApiKeys,
        groqApiKeys: settings.groqApiKeys,
        systemPrompts: settings.systemPrompts,
      },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quantum-ai-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const handleCopyExport = useCallback(() => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        geminiApiKeys: settings.geminiApiKeys,
        groqApiKeys: settings.groqApiKeys,
        systemPrompts: settings.systemPrompts,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [settings]);

  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText);
      const data = parsed.data || parsed;
      updateSettings({
        ...settings,
        geminiApiKeys: data.geminiApiKeys || settings.geminiApiKeys,
        groqApiKeys: data.groqApiKeys || settings.groqApiKeys,
        systemPrompts: data.systemPrompts || settings.systemPrompts,
      });
      setImportText("");
      setShowImport(false);
    } catch {
      // invalid JSON
    }
  }, [importText, settings, updateSettings]);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setImportText(text);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <KeyRound className="h-5 w-5 text-cyan-400" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Export / Import */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export Keys
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyExport}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImport(!showImport)}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Import File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileImport}
            />
          </div>

          {showImport && (
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">
                Paste exported settings JSON:
              </Label>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='{"version":1,"data":{"geminiApiKeys":[...],...}}'
                className="bg-white/5 border-white/10 text-slate-200 min-h-[100px] font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={handleImport}
                disabled={!importText.trim()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Apply Import
              </Button>
            </div>
          )}

          {/* Gemini API Keys */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                General Mode — Gemini API Keys
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Get yours at{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            {settings.geminiApiKeys.map((key, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={maskKey(key)}
                  readOnly
                  className="bg-white/5 border-white/10 text-slate-400 font-mono text-xs flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGeminiKey(i)}
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste Gemini API key..."
                value={newGeminiKey}
                onChange={(e) => setNewGeminiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGeminiKey()}
                className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 text-xs"
              />
              <Button
                size="icon"
                onClick={addGeminiKey}
                disabled={!newGeminiKey.trim()}
                className="h-9 w-9 bg-cyan-600 hover:bg-cyan-500 text-white shrink-0 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Groq API Keys */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                Hacking Mode — Groq API Keys
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Get yours at{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Groq Console
                </a>
              </p>
            </div>
            {settings.groqApiKeys.map((key, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={maskKey(key)}
                  readOnly
                  className="bg-white/5 border-white/10 text-slate-400 font-mono text-xs flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGroqKey(i)}
                  className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste Groq API key..."
                value={newGroqKey}
                onChange={(e) => setNewGroqKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGroqKey()}
                className="bg-white/5 border-white/10 text-slate-200 placeholder:text-slate-600 text-xs"
              />
              <Button
                size="icon"
                onClick={addGroqKey}
                disabled={!newGroqKey.trim()}
                className="h-9 w-9 bg-emerald-600 hover:bg-emerald-500 text-white shrink-0 disabled:opacity-30"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* System Prompts */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                General System Prompt
              </h3>
            </div>
            <Textarea
              value={settings.systemPrompts.general}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  systemPrompts: { ...settings.systemPrompts, general: e.target.value },
                })
              }
              className="bg-white/5 border-white/10 text-slate-200 text-xs min-h-[80px]"
            />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-slate-300">
                Hacking System Prompt
              </h3>
            </div>
            <Textarea
              value={settings.systemPrompts.hacking}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  systemPrompts: { ...settings.systemPrompts, hacking: e.target.value },
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
