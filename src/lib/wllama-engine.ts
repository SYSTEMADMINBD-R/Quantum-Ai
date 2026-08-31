/**
 * Wllama Engine — Real AI models running in the browser using CPU.
 * Uses WebAssembly (no WebGPU needed) — works on ANY phone including budget Android.
 * Models are cached in IndexedDB — download once, work forever offline.
 */



export interface OfflineModelOption {
  id: string;
  name: string;
  description: string;
  size: string;
  params: string;
  repo: string;
  file: string;
  recommended?: boolean;
}

// Models — small GGUF files that work on CPU in the browser
export const OFFLINE_MODELS: OfflineModelOption[] = [
  {
    id: "qwen3-1.7b-q4_k_m",
    name: "Qwen3 1.7B",
    description: "Multilingual — supports 100+ languages including Bengali",
    size: "~1.1 GB",
    params: "1.7B",
    repo: "bartowski/Qwen_Qwen3-1.7B-GGUF",
    file: "Qwen3-1.7B-Q4_K_M.gguf",
    recommended: true,
  },
  {
    id: "smollm2-1.7b-q4_k_s",
    name: "SmolLM2 1.7B",
    description: "Tiny & fast — great for basic Q&A",
    size: "~1.0 GB",
    params: "1.7B",
    repo: "bartowski/SmolLM2-1.7B-Instruct-GGUF",
    file: "SmolLM2-1.7B-Instruct-Q4_K_S.gguf",
  },
  {
    id: "llama-3.2-1b-q4_k_s",
    name: "Llama 3.2 1B",
    description: "Lightest — works on any phone with 4GB+ RAM",
    size: "~0.8 GB",
    params: "1B",
    repo: "bartowski/Llama-3.2-1B-Instruct-GGUF",
    file: "Llama-3.2-1B-Instruct-Q4_K_S.gguf",
  },
  {
    id: "qwen3-4b-q4_k_m",
    name: "Qwen3 4B",
    description: "Best quality — needs 6GB+ RAM",
    size: "~2.5 GB",
    params: "4B",
    repo: "bartowski/Qwen_Qwen3-4B-GGUF",
    file: "Qwen3-4B-Q4_K_M.gguf",
  },
];

export const DEFAULT_OFFLINE_MODEL = "qwen3-1.7b-q4_k_m";

export function isWllamaSupported(): boolean {
  try {
    // WebAssembly is the only hard requirement.
    // SharedArrayBuffer enables multi-threading but wllama auto-falls back to
    // single-thread mode when it's unavailable (no COOP/COEP headers on Vercel).
    return typeof WebAssembly !== "undefined";
  } catch {
    return false;
  }
}

export type WllamaStatus =
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface WllamaState {
  status: WllamaStatus;
  progress: number;
  downloadProgress: string;
  error: string | null;
  modelId: string | null;
  supported: boolean;
  canCancel: boolean;
}

type StateListener = (state: WllamaState) => void;

class WllamaEngine {
  private wllama: any = null;
  private abortController: AbortController | null = null;
  private state: WllamaState = {
    status: "idle",
    progress: 0,
    downloadProgress: "",
    error: null,
    modelId: null,
    supported: isWllamaSupported(),
    canCancel: false,
  };
  private listeners: Set<StateListener> = new Set();
  private loadingPromise: Promise<void> | null = null;

  getState(): WllamaState {
    return { ...this.state };
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<WllamaState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  /** Cancel an in-progress download */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
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
    if (!this.state.supported) {
      this.updateState({
        status: "error",
        error:
          "Your browser does not support WebAssembly. Use Chrome 57+ or any modern browser.",
      });
      return;
    }

    if (this.state.status === "ready" && this.state.modelId === modelId) {
      return;
    }

    // Cancel any in-progress load first
    this.cancel();

    const model = OFFLINE_MODELS.find((m) => m.id === modelId);
    if (!model) {
      this.updateState({
        status: "error",
        error: `Model "${modelId}" not found.`,
      });
      return;
    }

    this.updateState({
      status: "downloading",
      progress: 0,
      downloadProgress: `Downloading ${model.name} (${model.size})...`,
      error: null,
      modelId,
      canCancel: true,
    });

    this.abortController = new AbortController();
    this.loadingPromise = this._loadModelInner(model);

    try {
      await this.loadingPromise;
    } finally {
      this.loadingPromise = null;
    }
  }

  private async _loadModelInner(
    model: OfflineModelOption,
  ): Promise<void> {
    try {
      // Dynamically import wllama from the ESM build
      const { Wllama } = await import("@wllama/wllama/esm/index.js");

      // Provide local WASM binary path
      const pathConfig = { default: "/wllama.wasm" };

      // Clean up previous instance
      if (this.wllama) {
        try {
          await this.wllama.exit();
        } catch {
          // Ignore cleanup errors
        }
        this.wllama = null;
      }

      this.wllama = new Wllama(pathConfig, {
        logger: {
          debug: () => {},
          log: () => {},
          warn: console.warn,
          error: console.error,
          assert: console.assert,
          clear: () => {},
          count: () => {},
          countReset: () => {},
          dir: () => {},
          dirxml: () => {},
          group: () => {},
          groupCollapsed: () => {},
          groupEnd: () => {},
          info: () => {},
          table: () => {},
          time: () => {},
          timeEnd: () => {},
          timeLog: () => {},
          timeStamp: () => {},
          trace: () => {},
          profile: () => {},
          profileEnd: () => {},
        } as any,
        allowOffline: true,
        parallelDownloads: 3,
      });

      this.updateState({
        status: "downloading",
        progress: 5,
        downloadProgress: `Preparing ${model.name} download...`,
      });

      // Load model from HuggingFace — downloads and caches in IndexedDB
      await this.wllama.loadModelFromHF(
        {
          repo: model.repo,
          file: model.file,
        },
        {
          // @ts-ignore — progressCallback is supported but types may vary
          progressCallback: ({ loaded, total }: { loaded: number; total: number }) => {
            if (total > 0) {
              const pct = Math.round((loaded / total) * 100);
              const loadedMB = (loaded / 1024 / 1024).toFixed(0);
              const totalMB = (total / 1024 / 1024).toFixed(0);
              this.updateState({
                progress: pct,
                downloadProgress: `Downloading model... ${loadedMB}/${totalMB} MB (${pct}%)`,
              });
            }
          },
        },
      );

      // Check if cancelled during download
      if (this.abortController?.signal.aborted) {
        try {
          await this.wllama.exit();
        } catch {}
        this.wllama = null;
        return;
      }

      this.updateState({
        status: "ready",
        progress: 100,
        downloadProgress: `${model.name} loaded and ready!`,
        modelId: model.id,
        canCancel: false,
      });
    } catch (err: any) {
      // Don't show error if user cancelled
      if (this.abortController?.signal.aborted) {
        return;
      }

      console.error("Wllama load error:", err);
      const msg = err?.message ?? "Unknown error";

      let errorMsg = msg;
      if (msg.includes("out of memory") || msg.includes("OOM")) {
        errorMsg =
          "Not enough memory. Try a smaller model (Llama 3.2 1B) or close other browser tabs.";
      } else if (msg.includes("WebAssembly")) {
        errorMsg =
          "WebAssembly is not supported in your browser. Try Chrome, Firefox, or Edge.";
      } else if (msg.includes("fetch") || msg.includes("network")) {
        errorMsg =
          "Network error downloading model. Check your internet connection and try again.";
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
    if (!this.wllama || this.state.status !== "ready") {
      throw new Error("Model not loaded");
    }

    this.updateState({ status: "generating" });

    try {
      const fullMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      // Use streaming if supported
      const stream = await this.wllama.createChatCompletion({
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      });

      let reply = "";
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          reply += delta;
          yield delta;
        }
      }
    } catch (err: any) {
      console.error("Wllama generation error:", err);
      throw new Error(`Generation failed: ${err?.message ?? "Unknown error"}`);
    } finally {
      this.updateState({ status: "ready" });
    }
  }

  async chat(
    messages: { role: string; content: string }[],
    systemPrompt: string,
  ): Promise<string> {
    if (!this.wllama || this.state.status !== "ready") {
      throw new Error("Model not loaded");
    }

    this.updateState({ status: "generating" });

    try {
      const fullMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const reply = await this.wllama.createChatCompletion({
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false,
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
    if (this.wllama) {
      try {
        await this.wllama.exit();
      } catch {}
      this.wllama = null;
    }
    this.updateState({
      status: "idle",
      progress: 0,
      downloadProgress: "",
      modelId: null,
      canCancel: false,
    });
  }
}

export const wllamaEngine = new WllamaEngine();
