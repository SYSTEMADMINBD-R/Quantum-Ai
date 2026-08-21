/**
 * Offline AI Service — Zero-download local chat intelligence.
 * Uses pattern matching + knowledge base for instant offline responses.
 * No model download needed — works immediately when offline.
 */

import type { Message } from "@/types/quantum";

export type OfflineModelStatus = "idle" | "ready" | "error";

export interface OfflineModelState {
  status: OfflineModelStatus;
  progress: number;
  error: string | null;
  modelSize: string;
}

let currentStatus: OfflineModelState = {
  status: "ready",
  progress: 100,
  error: null,
  modelSize: "built-in",
};

type StatusListener = (state: OfflineModelState) => void;
const listeners: Set<StatusListener> = new Set();

export function onOfflineModelStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  listener({ ...currentStatus });
  return () => listeners.delete(listener);
}

export function getOfflineModelStatus(): OfflineModelState {
  return { ...currentStatus };
}

export function preloadOfflineModel(): void {
  // No-op: the offline engine is built-in, no download needed
}

// Simple keyword-based response engine
const KNOWLEDGE: Array<{ patterns: RegExp[]; response: string }> = [
  {
    patterns: [/who (made|created|built|developed) (you|this|quantum)/i, /who are you/i],
    response: "I am Quantum AI, made and developed by RAGIB. I work both online and offline!",
  },
  {
    patterns: [/what is your name/i, /what are you called/i],
    response: "My name is Quantum AI. I'm an AI assistant created by RAGIB that works online and offline.",
  },
  {
    patterns: [/hello|hi |hey|greetings|good (morning|afternoon|evening)/i],
    response: "Hello! I'm Quantum AI. How can I help you today?",
  },
  {
    patterns: [/how are you|how do you do/i],
    response: "I'm doing great, thanks for asking! I'm Quantum AI, running locally on your device right now. How can I help?",
  },
  {
    patterns: [/what can you do|what are your capabilities/i],
    response: "I'm Quantum AI in offline mode. I can answer general questions, help with coding, discuss technology, math, science, and more. For advanced responses, connect to the internet for my cloud AI modes (General via Gemini or Hacking via Groq).",
  },
  {
    patterns: [/offline|no internet|without (wifi|internet|connection)/i],
    response: "You're currently using my offline mode. I'm running a built-in knowledge engine directly in your browser — no internet needed. For more powerful responses, connect online and use General or Hacking mode.",
  },
  {
    patterns: [/help me|can you help/i],
    response: "Of course! In offline mode, I can help with general knowledge, math, coding basics, writing, and answering questions. What specifically would you like help with?",
  },
  {
    patterns: [/thank|thanks|thx/i],
    response: "You're welcome! Happy to help anytime.",
  },
  {
    patterns: [/bye|goodbye|see you|good night/i],
    response: "Goodbye! Remember, I'm always here — online or offline. Have a great day!",
  },
  {
    patterns: [/what time|what date|what day/i],
    response: "I can tell you the time and date even when offline! Check your device clock for the current time.",
  },
  {
    patterns: [/javascript|typescript|python|java|coding|programming|code/i],
    response: "I can help with programming! In offline mode, I can discuss concepts, explain syntax, and help debug logic. For code generation and complex tasks, try connecting online and use General or Hacking mode for my full capabilities.",
  },
  {
    patterns: [/explain|what is|what are|define/i],
    response: "I'd be happy to explain! However, in offline mode my knowledge is more limited. I can cover common topics. For detailed, up-to-date answers, connect to the internet and use General mode (powered by Gemini).",
  },
  {
    patterns: [/math|calculate|equation|formula/i],
    response: "I can help with math! In offline mode, I'm best with basic to intermediate math — arithmetic, algebra, geometry, and common formulas. For advanced math, connect online for my full AI capabilities.",
  },
  {
    patterns: [/quantum computing|quantum physics|quantum mechanics/i],
    response: "Quantum computing uses quantum mechanical phenomena like superposition and entanglement to process information. Unlike classical bits (0 or 1), quantum bits (qubits) can exist in multiple states simultaneously, enabling massive parallelism for certain computations.",
  },
  {
    patterns: [/artificial intelligence|machine learning|neural network|deep learning/i],
    response: "AI and machine learning are vast fields. Key concepts include: supervised learning (classification, regression), unsupervised learning (clustering, dimensionality reduction), and reinforcement learning. Neural networks form the backbone of deep learning, with architectures like transformers powering modern LLMs.",
  },
  {
    patterns: [/what is.*qwen|qwen.*model/i],
    response: "Qwen is a family of large language models developed by Alibaba Cloud. The Qwen1.5 and Qwen2 series range from 0.5B to 72B parameters. I'm Quantum AI, which is separate from Qwen — I'm built by RAGIB.",
  },
  {
    patterns: [/gemini|google ai|google gemini/i],
    response: "Gemini is Google's family of multimodal AI models. In Quantum AI, General mode uses Gemini for cloud-powered responses. You're currently in offline mode — connect to use Gemini.",
  },
  {
    patterns: [/groq|groq api/i],
    response: "Groq is an AI infrastructure company known for extremely fast inference using their LPU (Language Processing Unit). In Quantum AI, Hacking mode uses Groq for fast, expert cybersecurity responses.",
  },
];

// Fallback responses when no pattern matches
const FALLBACKS = [
  "That's an interesting question! In offline mode, my responses are more limited. For a comprehensive answer, try connecting to the internet and using General mode.",
  "I appreciate your question! While I'm running in offline mode with built-in knowledge, I'd give a much more detailed response online. Would you like me to try answering, or would you prefer to connect and use my full AI capabilities?",
  "Great question! In offline mode, I have a general knowledge base but can't do real-time research or access the latest information. Connect to the internet for my full capabilities powered by Gemini or Groq.",
  "I'm Quantum AI in offline mode. I can handle general knowledge questions, but for complex or specific topics, my online modes (General and Hacking) provide much more detailed and accurate responses.",
];

function findResponse(input: string): string {
  const trimmed = input.trim();

  // Check knowledge base
  for (const entry of KNOWLEDGE) {
    for (const pattern of entry.patterns) {
      if (pattern.test(trimmed)) {
        return entry.response;
      }
    }
  }

  // Use a random fallback
  const idx = Math.floor(Math.random() * FALLBACKS.length);
  return FALLBACKS[idx];
}

/**
 * Generate a response using the built-in offline knowledge engine.
 * Streams response word-by-word for a natural feel.
 */
export async function* streamOfflineChat(
  systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const input = lastUserMsg?.content ?? "";
  const response = findResponse(input);

  // Simulate streaming
  const words = response.split(/(?<=\s)/);
  let accumulated = "";

  for (const word of words) {
    accumulated += word;
    yield accumulated;
    await new Promise((r) => setTimeout(r, 30));
  }
}

/**
 * Non-streaming offline chat
 */
export async function sendOfflineMessage(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const input = lastUserMsg?.content ?? "";
  return findResponse(input);
}
