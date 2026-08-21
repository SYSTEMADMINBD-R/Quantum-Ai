/**
 * Offline AI Service - Runs a real language model in the browser.
 * Uses Hugging Face Transformers.js with WebAssembly backend.
 * No internet required after initial model download (cached in browser).
 */

import type { Message } from "@/types/quantum";

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
  progress: number;
  error: string | null;
  modelSize: string;
}

let currentStatus: OfflineModelState = {
  status: "idle",
  progress: 0,
  error: null,
  modelSize: "~25MB",
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

async function ensureModel() {
  if (generatorInstance) return generatorInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      updateStatus({ status: "downloading", progress: 0, error: null });
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = true;
      env.useBrowserCache = true;

      const modelId = "Xenova/Qwen1.5-0.5B-Chat";
      updateStatus({ status: "downloading", progress: 5 });

      const generator = await pipeline("text-generation", modelId, {
        progress_callback: (data: any) => {
          if (data.status === 'progress' && data.progress !== undefined) {
            updateStatus({ status: 'downloading', progress: Math.round(data.progress) });
          } else if (data.status === 'done') {
            updateStatus({ status: "loading", progress: 100 });
          }
        },
      });

      generatorInstance = generator;
      updateStatus({ status: "ready", progress: 100, error: null });
      return generator;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load offline model";
      updateStatus({ status: "error", error: errorMsg, progress: 0 });
      loadingPromise = null;
      throw err;
    }
  })();
  return loadingPromise;
}

function buildPrompt(systemPrompt: string, messages: Message[]): string {
  const parts: string[] = [];
  parts.push('<|im_start|>/system\n' + systemPrompt + '<|im_end|>\n');
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'user' : 'assistant';
    parts.push('<|im_start|>/' + role + '\n' + msg.content + '<|im_end|>\n');
  }
  parts.push('<|im_start|>/assistant\n');
  return parts.join('');
}

export async function* streamOfflineChat(
  systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const generator = await ensureModel();
  const prompt = buildPrompt(systemPrompt, messages);
  const result = await generator(prompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
    return_full_text: false,
  });
  const generatedText: string = result[0]?.generated_text ?? "";
  const tokens = generatedText.split(/(?<=\s)/);
  let accumulated = "";
  for (const token of tokens) {
    accumulated += token;
    yield accumulated;
    await new Promise((r) => setTimeout(r, 20));
  }
}

export async function sendOfflineMessage(
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const generator = await ensureModel();
  const prompt = buildPrompt(systemPrompt, messages);
  const result = await generator(prompt, {
    max_new_tokens: 512,
    temperature: 0.7,
    top_p: 0.9,
    do_sample: true,
    return_full_text: false,
  });
  return result[0]?.generated_text ?? "";
}

export function getOfflineModelStatus(): OfflineModelState {
  return { ...currentStatus };
}

export function preloadOfflineModel(): void {
  ensureModel().catch((err) => {
    console.warn('Pre-load failed:', err);
  });
}
