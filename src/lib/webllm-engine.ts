/**
 * WebLLM Engine — Real AI models running in the browser.
 * Uses WebGPU for hardware acceleration. Works fully offline after first download.
 * Falls back gracefully if WebGPU is not available.
 */

import type { OfflineModelState } from "@/lib/offline-ai";

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

export const DEFAULT_OFFLINE_MODEL = "Qwen2.5-1.5B-Instruct-q4f16_1-MLC";

export function isWebGPUSupported(): boolean {
  try {
    return typeof navigator !== "undefined" && "gpu" in navigator;
  } catch {
    return false;
  }
}

export type WebLLMStatus =
  | "idle"
  | "downloading"
  | "ready"
  | "generating"
  | "error";

export interface WebLLMState {
  status: WebLLMStatus;
  progress: number;
  downloadProgress: string;
  error: string | null;
  modelId: string | null;
  webgpuSupported: boolean;
  canCancel: boolean;
}

type StateListener = (state: WebLLMState) => void;

class WebLLMEngine {
  private engine: any = null;
  private abortController: AbortController | null = null;
  private progressTimer: ReturnType<typeof setTimeout> | null = null;
  private lastProgressTime = 0;
  private state: WebLLMState = {
    status: "idle",
    progress: 0,
    downloadProgress: "",
    error: null,
    modelId: null,
    webgpuSupported: isWebGPUSupported(),
    canCancel: false,
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

  /** Cancel an in-progress download */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.progressTimer) {
      clearTimeout(this.progressTimer);
      this.progressTimer = null;
    }
    this.loadingPromise = null;
    this.updateState({
      status: "idle",
      progress: 0,
      downloadProgress: "",
      error: null,
      canCancel: false,
    });
  }

  async loadModel(modelId: string = DEFAULT_OFFLINE_MODEL): Promise<void> {
    if (!this.state.webgpuSupported) {
      this.updateState({
        status: "error",
        error: "WebGPU is not supported. Use Chrome 113+ or Edge 113+.",
      });
      return;
    }

    if (this.state.status === "ready" && this.state.modelId === modelId) {
      return;
    }

    // Cancel any in-progress download first
    this.cancel();

    this.updateState({
      status: "downloading",
      progress: 0,
      downloadProgress: "Preparing download...",
      error: null,
      modelId,
      canCancel: true,
    });

    this.abortController = new AbortController();
    this.loadingPromise = this._loadModelInner(modelId);

    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
      if (this.progressTimer) {
        clearTimeout(this.progressTimer);
        this.progressTimer = null;
      }
    }
  }

  private async _loadModelInner(modelId: string): Promise<void> {
    const startTime = Date.now();
    this.lastProgressTime = startTime;

    // Stuck detection: if no progress for 30 seconds, show a warning
    const startStuckDetection = () => {
      this.progressTimer = setTimeout(() => {
        if (this.state.status === "downloading" && this.state.progress === 0) {
          this.updateState({
            downloadProgress:
              "Still downloading — large files can take several minutes on mobile. Please wait...",
          });
          // Continue checking
          startStuckDetection();
        }
      }, 30000);
    };
    startStuckDetection();

    try {
      const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

      this.engine = await CreateMLCEngine(
        modelId,
        {
          initProgressCallback: (progress: any) => {
            this.lastProgressTime = Date.now();

            if (typeof progress === "string") {
              const match = progress.match(/\((\d+(?:\.\d+)?)%\)/);
              const pct = match ? parseFloat(match[1]) : this.state.progress;
              this.updateState({
                progress: pct,
                downloadProgress: progress || "Downloading model weights...",
              });
            } else if (progress && typeof progress === "object") {
              const pct = progress.progress
                ? progress.progress * 100
                : this.state.progress;
              const text =
                progress.text ||
                progress.message ||
                progress.status ||
                this.state.downloadProgress;
              this.updateState({
                progress: pct,
                downloadProgress: text || `Downloading... ${Math.round(pct)}%`,
              });
            }
          },
        },
      );

      if (this.progressTimer) {
        clearTimeout(this.progressTimer);
        this.progressTimer = null;
      }

      this.updateState({
        status: "ready",
        progress: 100,
        downloadProgress: "Model loaded successfully!",
        modelId,
        canCancel: false,
      });
    } catch (err: any) {
      if (this.progressTimer) {
        clearTimeout(this.progressTimer);
        this.progressTimer = null;
      }

      // Don't show error if user cancelled
      if (err?.name === "AbortError" || this.abortController?.signal.aborted) {
        return;
      }

      console.error("WebLLM load error:", err);
      const msg = err?.message ?? "Unknown error";
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      let errorMsg = msg;
      if (msg.includes("maxComputeWorkgroupStorageSize")) {
        errorMsg =
          "Your device's GPU can't run AI models (compute limit too low). " +
          "The built-in knowledge base will be used offline instead. " +
          "Use a desktop browser like Chrome for full offline AI.";
      } else if (msg.includes("out of memory") || msg.includes("OOM")) {
        errorMsg =
          "Not enough memory. Close other tabs and try a smaller model (SmolLM2 1.7B).";
      } else if (elapsed > 60 && this.state.progress < 5) {
        errorMsg =
          `Download stalled after ${elapsed}s. Check your internet connection and try again.`;
      } else if (msg.includes("WebGPU") || msg.includes("GPU")) {
        errorMsg =
          "WebGPU is not available. Use Chrome 113+ or Edge 113+.";
      }

      this.updateState({
        status: "error",
        error: `Failed to load model: ${errorMsg}`,
        canCancel: false,
      });
    }
  }

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

  async unload() {
    this.cancel();
    this.engine = null;
    this.updateState({
      status: "idle",
      progress: 0,
      downloadProgress: "",
      modelId: null,
      canCancel: false,
    });
  }
}

export const webllmEngine = new WebLLMEngine();
