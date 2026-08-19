import { useState } from "react";
import { useQuantumApp } from "@/hooks/use-quantum-app";
import { DEFAULT_SETTINGS } from "@/types/quantum";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Plus,
  Trash2,
  Key,
  Brain,
  Shield,
  Save,
  RotateCcw,
} from "lucide-react";

export function SettingsDialog() {
  const { settings, updateSettings } = useQuantumApp();
  const [open, setOpen] = useState(false);
  const [geminiKeys, setGeminiKeys] = useState<string[]>(
    settings.geminiApiKeys,
  );
  const [groqKeys, setGroqKeys] = useState<string[]>(settings.groqApiKeys);
  const [systemPromptGeneral, setSystemPromptGeneral] = useState(
    settings.systemPrompts.general,
  );
  const [systemPromptHacking, setSystemPromptHacking] = useState(
    settings.systemPrompts.hacking,
  );
  const [newGeminiKey, setNewGeminiKey] = useState("");
  const [newGroqKey, setNewGroqKey] = useState("");

  const handleSave = () => {
    updateSettings({
      ...settings,
      geminiApiKeys: geminiKeys.filter((k) => k.trim()),
      groqApiKeys: groqKeys.filter((k) => k.trim()),
      systemPrompts: {
        general: systemPromptGeneral,
        hacking: systemPromptHacking,
      },
    });
    setOpen(false);
  };

  const addGeminiKey = () => {
    if (newGeminiKey.trim()) {
      setGeminiKeys([...geminiKeys, newGeminiKey.trim()]);
      setNewGeminiKey("");
    }
  };

  const addGroqKey = () => {
    if (newGroqKey.trim()) {
      setGroqKeys([...groqKeys, newGroqKey.trim()]);
      setNewGroqKey("");
    }
  };

  const removeGeminiKey = (index: number) => {
    setGeminiKeys(geminiKeys.filter((_, i) => i !== index));
  };

  const removeGroqKey = (index: number) => {
    setGroqKeys(groqKeys.filter((_, i) => i !== index));
  };

  const resetPrompts = () => {
    setSystemPromptGeneral(DEFAULT_SETTINGS.systemPrompts.general);
    setSystemPromptHacking(DEFAULT_SETTINGS.systemPrompts.hacking);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          // Reset form state when opening
          setGeminiKeys(settings.geminiApiKeys);
          setGroqKeys(settings.groqApiKeys);
          setSystemPromptGeneral(settings.systemPrompts.general);
          setSystemPromptHacking(settings.systemPrompts.hacking);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Quantum AI Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              System Prompts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-6 mt-4">
            {/* Gemini Keys */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-400" />
                <Label className="text-sm font-medium">
                  Gemini API Keys
                </Label>
                <span className="text-xs text-muted-foreground">
                  (General Mode)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Add one or more Google AI Studio API keys. Keys are rotated
                automatically for faster responses.
              </p>
              {geminiKeys.map((key, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={key}
                    onChange={(e) => {
                      const updated = [...geminiKeys];
                      updated[i] = e.target.value;
                      setGeminiKeys(updated);
                    }}
                    placeholder="AIza..."
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGeminiKey(i)}
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newGeminiKey}
                  onChange={(e) => setNewGeminiKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGeminiKey()}
                  placeholder="Add new Gemini API key..."
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addGeminiKey}
                  className="h-9 w-9 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Groq Keys */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <Label className="text-sm font-medium">Groq API Keys</Label>
                <span className="text-xs text-muted-foreground">
                  (Hacking Mode)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Add one or more Groq API keys for ultra-fast inference with
                higher token limits.
              </p>
              {groqKeys.map((key, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={key}
                    onChange={(e) => {
                      const updated = [...groqKeys];
                      updated[i] = e.target.value;
                      setGroqKeys(updated);
                    }}
                    placeholder="gsk_..."
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGroqKey(i)}
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input
                  value={newGroqKey}
                  onChange={(e) => setNewGroqKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGroqKey()}
                  placeholder="Add new Groq API key..."
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={addGroqKey}
                  className="h-9 w-9 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-cyan-400" />
                  <Label className="text-sm font-medium">
                    General Mode System Prompt
                  </Label>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetPrompts}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
              </div>
              <Textarea
                value={systemPromptGeneral}
                onChange={(e) => setSystemPromptGeneral(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <Label className="text-sm font-medium">
                  Hacking Mode System Prompt
                </Label>
              </div>
              <Textarea
                value={systemPromptHacking}
                onChange={(e) => setSystemPromptHacking(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
          >
            <Save className="h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
