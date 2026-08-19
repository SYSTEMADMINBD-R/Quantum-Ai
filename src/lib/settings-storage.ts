import { type QuantumSettings, DEFAULT_SETTINGS } from "@/types/quantum";

const SETTINGS_KEY = "quantum-ai-settings";

export function loadSettings(): QuantumSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<QuantumSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    console.warn("Failed to load settings from localStorage");
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: QuantumSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    console.warn("Failed to save settings to localStorage");
  }
}

export function updateSettings(
  updates: Partial<QuantumSettings>,
): QuantumSettings {
  const current = loadSettings();
  const updated = { ...current, ...updates };
  saveSettings(updated);
  return updated;
}

export function getActiveApiKey(
  settings: QuantumSettings,
  mode: "general" | "hacking",
): string | null {
  const keys =
    mode === "general" ? settings.geminiApiKeys : settings.groqApiKeys;
  if (keys.length === 0) return null;
  // Round-robin key selection for load balancing
  const index = Date.now() % keys.length;
  return keys[index] ?? keys[0]!;
}

export function hasApiKeys(settings: QuantumSettings): {
  general: boolean;
  hacking: boolean;
  both: boolean;
} {
  const general = settings.geminiApiKeys.length > 0;
  const hacking = settings.groqApiKeys.length > 0;
  return { general, hacking, both: general && hacking };
}
