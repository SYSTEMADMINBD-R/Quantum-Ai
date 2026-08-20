/**
 * Offline AI Service — Runs a real language model directly in the browser.
 * Uses Hugging Face Transformers.js with WebAssembly backend.
 * No internet required after initial model download (~400MB, cached in browser).
 */

import type { Message } from "@/types/quantum";

// Dynamic import to avoid loading Transformers.js until needed (it's large)
let generatorInstance: any = null;
let loadingPromise: Promise<any> | null = null;

export type OfflineModelStatus =
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "error";

export interface OfflineModelState {
  status: OfflineModelStatus;
  progress: number; // 0-100
  error: string | null;
  modelSize: string;
}

let currentStatus: OfflineModelState = {
  status: "idle",
  progress: 0,
  error: null,
  modelSize: "~400MB",
};

type StatusListener = (state: OfflineModelState) => void;
const listeners: Set<StatusListener> = new Set();

export function onOfflineModelStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  for (const listener of listeners) {
    listener({ ...currentStatus });
  }
}

function updateStatus(patch: Partial<OfflineModelState>) {
  currentStatus = { ...currentStatus, ...patch };
  notifyListeners();
}

/**
 * Load the offline model. Downloads from Hugging Face on first use,
 * then cached by the browser for future offline sessions.
 */
async function ensureModel() {
  if (generatorInstance) return generatorInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      updateStatus({ status: "downloading", progress: 0, error: null });

      // Dynamic import — keeps initial bundle small
      const { pipeline, env } = await import("@huggingface/transformers");

      // Allow browser execution (not just Node.js)
      env.allowLocalModels = true;
      env.useBrowserCache = true;

      // Use Xenova's quantized ONNX model — optimized for browser inference
      // Qwen2-0.5B-Instruct: small, fast, chat-capable model
      const modelId = "Xenova/Qwen2-0.5B-Instruct";

      updateStatus({ status: "downloading", progress: 5 });

      const generator = await pipeline("text-generation", modelId, {
        dtype: "q4" as any, // 4-bit quantized for small size
        progress_callback: (data: any) => {
          if (data.status === "progress" && data.progress !== undefined) {
            updateStatus({
              status: "downloading",
              progress: Math.round(data.progress),
            });
          } else if (data.status === "done") {
            updateStatus({ status: "loading", progress: 100 });
          }
        },
      });

      generatorInstance = generator;
      updateStatus({ status: "ready", progress: 100, error: null });
      return generator;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to load offline model";
      updateStatus({ status: "error", error: errorMsg, progress: 0 });
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

/**
 * Generate a response using the offline local model.
 * Simulates streaming by yielding chunks.
 */
export async function* streamOfflineChat(
  systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const generator = await ensureModel();

  // Build a chat prompt from the message history
  const promptParts: string[] = [
    `<|system|>\n${systemPrompt}<|end|>\n`,
  ];

  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "assistant";
    promptParts.push(`<|${role}|>\n${msg.content}<|end|>\n`);
  }

  promptParts.push("<|assistant|>\n");

  const prompt = promptParts.join("");

  // Generate response with streaming-like token delivery
  const result = await generator(prompt, {
    max_new_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
    return_full_text: false,
  });

  const generatedText: string = result[0]?.generated_text ?? "";

  // Simulate streaming by yielding tokens in small chunks
  const tokens = generatedText.split(/(?<=\s)/);
  let accumulated = "";

  for (const token of tokens) {
    accumulated += token;
    yield accumulated;
    // Small delay to simulate streaming feel
    await new Promise((r) => setTimeout(r, 20));
  }
}

/**
 * Non-streaming offline chat for fallback
 */
export async function sendOfflineMessage(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const generator = await ensureModel();

  const promptParts: string[] = [
    `<|system|>\n${systemPrompt}<|end|>\n`,
  ];

  for (const msg of messages) {
    const role = msg.role === "user" ? "user" : "assistant";
    promptParts.push(`<|${role}|>\n${msg.content}<|end|>\n`);
  }

  promptParts.push("<|assistant|>\n");

  const result = await generator(promptParts.join(""), {
    max_new_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
    return_full_text: false,
  });

  return result[0]?.generated_text ?? "";
}

/**
 * Get the current offline model status
 */
export function getOfflineModelStatus(): OfflineModelState {
  return { ...currentStatus };
}

/**
 * Pre-download the model in the background
 */
export function preloadOfflineModel(): void {
  ensureModel().catch((err) => {
    console.warn("Pre-load failed:", err);
  });
}
