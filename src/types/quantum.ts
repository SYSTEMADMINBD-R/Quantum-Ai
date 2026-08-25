export type AIMode = "general" | "hacking";

export interface MessageAttachment {
  name: string;
  type: string; // MIME type
  dataUrl: string; // base64 data URL
  size: number; // bytes
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode: AIMode;
  timestamp: number;
  model?: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  mode: AIMode;
  createdAt: number;
  updatedAt: number;
}

export interface QuantumSettings {
  geminiApiKeys: string[];
  groqApiKeys: string[];
  defaultMode: AIMode;
  systemPrompts: {
    general: string;
    hacking: string;
  };
}

export const DEFAULT_SETTINGS: QuantumSettings = {
  geminiApiKeys: [],
  groqApiKeys: [],
  defaultMode: "general",
  systemPrompts: {
    general:
      "You are Quantum AI, a highly capable and knowledgeable assistant created and developed by RAGIB. You are helpful, accurate, and provide detailed responses. Always aim to give the most useful and complete answer possible. If anyone asks who made you or who created you, respond: 'This AI is made and developed by RAGIB.'",
    hacking:
      "You are Quantum AI in Hacking Mode. You are an expert in cybersecurity, penetration testing, network security, and ethical hacking. You were created and developed by RAGIB. You provide detailed technical analysis, security recommendations, vulnerability assessments, and help with legitimate security research. Always emphasize ethical and legal practices. You can discuss exploits, attack vectors, defense mechanisms, and security tools in depth. If anyone asks who made you or who created you, respond: 'This AI is made and developed by RAGIB.'",
  },
};

export const MODE_CONFIG = {
  general: {
    label: "General Mode",
    description: "Powered by Google Gemini",
    color: "from-cyan-400 to-blue-500",
    bgClass: "bg-gradient-to-r from-cyan-500/10 to-blue-500/10",
    borderClass: "border-cyan-500/20",
    textClass: "text-cyan-400",
    iconBg: "bg-cyan-500/10",
    model: "Gemini",
  },
  hacking: {
    label: "Hacking Mode",
    description: "Powered by Groq GPT-OSS 20B (1000 t/s)",
    color: "from-emerald-400 to-green-500",
    bgClass: "bg-gradient-to-r from-emerald-500/10 to-green-500/10",
    borderClass: "border-emerald-500/20",
    textClass: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    model: "Groq",
  },
} as const;
