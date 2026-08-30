/**
 * WebLLM Engine — Real AI models running in the browser.
 * Uses WebGPU for hardware acceleration. Works fully offline after first download.
 * Falls back gracefully if WebGPU is not available.
 */

import type { OfflineModelState } from "@/lib/offline-ai";

// Available models for offline use — q4f16_1 quantization for best Android compatibility
export interface OfflineModelOption {
  id: string;
  name: string;
  description: string;
  size: string;
  params: string;
  recommended?: boolean;
}

export const OFFLINE_MODELS: OfflineModelOption[] = [
  {
    id: "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
    name: "SmolLM2 1.7B",
    description: "Tiny & fast — great for basic Q&A",
    size: "~1.1 GB",
    params: "1.7B",
  },
  {
    id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    name: "Qwen2.5 1.5B",
    description: "Multilingual — supports 100+ languages",
    size: "~1.1 GB",
    params: "1.5B",
    recommended: true,
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    description: "Lightweight — works on most devices",
    size: "~1.0 GB",
    params: "1B",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 3B",
    description: "Best quality — needs a good GPU",
    size: "~2.2 GB",
    params: "3B",
  },
];

// Default model (best balance of quality and compatibility)
export const DEFAULT_OFFLINE_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

// Check if WebGPU is supported in this browser
export function isWebGPUSupported(): boolean {
  try {
    return typeof navigator !== "undefined" && "gpu" in navigator;
  } catch {
    return false;
  }
}

export type WebLLMStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "ready"
  | "generating"
  | "error";

export interface WebLLMState {
  status: WebLLMStatus;
  progress: number; // 0-100
  downloadProgress: string; // e.g. "1.2 GB / 2.4 GB"
  error: string | null;
  modelId: string | null;
  webgpuSupported: boolean;
}

type StateListener = (state: WebLLMState) => void;

class WebLLMEngine {
  private engine: any = null;
  private state: WebLLMState = {
    status: "idle",
    progress: 0,
    downloadProgress: "",
    error: null,
    modelId: null,
    webgpuSupported: isWebGPUSupported(),
  };
  private listeners: Set<StateListener> = new Set();
  private loadingPromise: Promise<void> | null = null;

  getState(): WebLLMState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<WebLLMState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  /**
   * Load a model. First call downloads (may take minutes), subsequent calls use cache.
   */
  async loadModel(modelId: string = DEFAULT_OFFLINE_MODEL): Promise<void> {
    if (!this.state.webgpuSupported) {
      this.updateState({
        status: "error",
        error: "WebGPU is not supported in this browser. Offline AI requires Chrome 113+ or Edge 113+.",
      });
      return;
    }

    if (this.state.status === "ready" && this.state.modelId === modelId) {
      return; // Already loaded
    }

    // Prevent duplicate loads
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.updateState({
      status: "downloading",
      progress: 0,
      downloadProgress: "Starting...",
      error: null,
      modelId,
    });

    this.loadingPromise = this._loadModelInner(modelId);

    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async _loadModelInner(modelId: string): Promise<void> {
    try {
      // Dynamic import to avoid loading WebLLM on browsers without WebGPU
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      this.engine = await CreateMLCEngine(
        modelId,
        {
          initProgressCallback: (progress: any) => {
            if (typeof progress === "string") {
              const match = progress.match(/\((\d+(?:\.\d+)?)%\)/);
              const pct = match ? parseFloat(match[1]) : this.state.progress;
              this.updateState({
                progress: pct,
                downloadProgress: progress,
              });
            } else if (progress && typeof progress === "object") {
              const pct = progress.progress ?? this.state.progress;
              const text =
                progress.text ?? progress.message ?? this.state.downloadProgress;
              this.updateState({
                progress: pct * 100,
                downloadProgress: text,
              });
            }
          },
        },
      );

      this.updateState({
        status: "ready",
        progress: 100,
        downloadProgress: "Model loaded",
        modelId,
      });
    } catch (err: any) {
      console.error("WebLLM load error:", err);
      const msg = err?.message ?? "Unknown error";

      // Provide helpful error messages for common issues
      let errorMsg = msg;
      if (msg.includes("maxComputeWorkgroupStorageSize")) {
        errorMsg =
          "Your device's GPU is too limited for AI models. " +
          "The built-in knowledge base will be used for offline responses. " +
          "Try a desktop browser like Chrome for full offline AI.";
      } else if (msg.includes("out of memory") || msg.includes("OOM")) {
        errorMsg =
          "Not enough memory to load the AI model. " +
          "Close other tabs and try a smaller model (SmolLM2 1.7B).";
      } else if (msg.includes("WebGPU")) {
        errorMsg =
          "WebGPU is not available. Use Chrome 113+ or Edge 113+ for offline AI models.";
      }

      this.updateState({
        status: "error",
        error: `Failed to load model: ${errorMsg}`,
      });
    }
  }

  /**
   * Stream a chat completion — returns an async generator of text chunks.
   */
  async *streamChat(
    messages: { role: string; content: string }[],
    systemPrompt: string,
  ): AsyncGenerator<string> {
    if (!this.engine || this.state.status !== "ready") {
      throw new Error("Model not loaded");
    }

    this.updateState({ status: "generating" });

    try {
      const fullMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const chunks = await this.engine.chat.completions.create({
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
        stream: true,
        stream_options: { include_usage: true },
      });

      let reply = "";
      for await (const chunk of chunks) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          reply += delta;
          yield delta;
        }
      }
    } catch (err: any) {
      console.error("WebLLM generation error:", err);
      throw new Error(`Generation failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      this.updateState({ status: "ready" });
    }
  }

  /**
   * Non-streaming chat — returns the full response.
   */
  async chat(
    messages: { role: string; content: string }[],
    systemPrompt: string,
  ): Promise<string> {
    if (!this.engine || this.state.status !== "ready") {
      throw new Error("Model not loaded");
    }

    this.updateState({ status: "generating" });

    try {
      const fullMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      const reply = await this.engine.chat.completions.create({
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      return reply.choices?.[0]?.message?.content ?? "";
    } catch (err: any) {
      throw new Error(`Generation failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      this.updateState({ status: "ready" });
    }
  }

  /** Unload model to free memory */
  async unload() {
    if (this.engine) {
      this.engine = null;
    }
    this.updateState({
      status: "idle",
      progress: 0,
      downloadProgress: "",
      modelId: null,
    });
  }
}

// Singleton instance
export const webllmEngine = new WebLLMEngine();
