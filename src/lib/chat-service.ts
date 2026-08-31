import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { AIMode, Message } from "@/types/quantum";
import { streamOfflineChat } from "@/lib/offline-ai";
import { wllamaEngine } from "@/lib/wllama-engine";

interface ChatServiceOptions {
  apiKey: string | null;
  mode: AIMode;
  systemPrompt: string;
  conversationHistory: Message[];
  isOnline: boolean;
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

function getConvexClient(): ConvexHttpClient {
  const convexUrl = import.meta.env.VITE_CONVEX_URL as string;
  if (!convexUrl) throw new Error("VITE_CONVEX_URL is not configured");
  return new ConvexHttpClient(convexUrl);
}

/**
 * Diagnostic — check how many API keys are configured in Convex env vars.
 */
export async function checkApiKeys(): Promise<{
  gemini: { count: number; keyPreview: string[] };
  groq: { count: number; keyPreview: string[] };
  status: { geminiReady: boolean; groqReady: boolean; message: string };
}> {
  const client = getConvexClient();
  const result = await client.action(api.diagnostics.checkApiKeys, {});
  return result as { gemini: { count: number; keyPreview: string[] }; groq: { count: number; keyPreview: string[] }; status: { geminiReady: boolean; groqReady: boolean; message: string } };
}

/**
 * Call a Convex action and extract the string result.
 */
async function callAction(
  client: ConvexHttpClient,
  actionFn: typeof api.chatActions.chatGemini,
  args: { message: string; systemPrompt: string; history: Array<{ role: "user" | "assistant"; content: string }> },
): Promise<string> {
  const raw = await client.action(actionFn, args);

  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
    console.warn("[Quantum AI] Unexpected action return type:", raw);
    return JSON.stringify(raw);
  }
  if (raw === null || raw === undefined) {
    throw new Error("Action returned empty response — API keys may not be configured in Convex env vars.");
  }
  return String(raw);
}

/**
 * Try to stream a response using Wllama (real LLM in the browser via CPU/WASM).
 * Returns true if wllama was used successfully, false otherwise.
 */
async function tryWllamaStream(
  systemPrompt: string,
  conversationHistory: Message[],
  callbacks: StreamCallbacks,
): Promise<boolean> {
  const state = wllamaEngine.getState();
  if (state.status !== "ready") return false;

  // On CPU without multi-threading, generation can be very slow.
  // Show a helpful message so the user knows something is happening.
  callbacks.onChunk("Thinking...");

  try {
    // Only send the last 4 messages to keep context small for the 1.7B model
    const recentHistory = conversationHistory.slice(-4);
    const historyForModel = recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let fullText = "";
    let chunkCount = 0;
    for await (const chunk of wllamaEngine.streamChat(historyForModel, systemPrompt)) {
      fullText = chunk;
      chunkCount++;
      callbacks.onChunk(fullText);
    }

    console.log(`[Quantum AI] Wllama generated ${chunkCount} chunks, ${fullText.length} chars`);

    if (fullText.trim().length > 0) {
      callbacks.onDone(fullText);
      return true;
    }
    console.warn("[Quantum AI] Wllama returned empty response");
    return false;
  } catch (err) {
    console.warn("[Quantum AI] Wllama streaming failed, will try fallback:", err);
    return false;
  }
}

/**
 * Try to get a response using Wllama (non-streaming fallback).
 */
async function tryWllamaChat(
  systemPrompt: string,
  conversationHistory: Message[],
): Promise<string | null> {
  const state = wllamaEngine.getState();
  if (state.status !== "ready") return null;

  try {
    const historyForModel = conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await wllamaEngine.chat(historyForModel, systemPrompt);
    return reply.trim().length > 0 ? reply : null;
  } catch (err) {
    console.warn("[Quantum AI] Wllama chat failed:", err);
    return null;
  }
}

/**
 * Stream offline AI response — tries wllama first, then knowledge base.
 */
async function streamOfflineResponse(
  systemPrompt: string,
  conversationHistory: Message[],
  callbacks: StreamCallbacks,
): Promise<string> {
  const wllamaReady = wllamaEngine.getState().status === "ready";

  // 1. Try wllama (real LLM via WASM/CPU) if model is loaded
  if (wllamaReady) {
    console.log("[Quantum AI] Trying wllama for offline response...");
    const usedWllama = await tryWllamaStream(systemPrompt, conversationHistory, callbacks);
    if (usedWllama) return "";
  }

  // 2. Fall back to knowledge base
  console.log("[Quantum AI] Using knowledge base fallback");
  try {
    let fullText = "";
    const generator = streamOfflineChat(systemPrompt, conversationHistory);
    for await (const chunk of generator) {
      fullText = chunk;
      callbacks.onChunk(fullText);
    }
    callbacks.onDone(fullText);
    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Offline model error");
    callbacks.onError(err);
    throw err;
  }
}

// Main streaming chat function — routes through Convex proxy actions
export async function streamChat(
  options: ChatServiceOptions,
  callbacks: StreamCallbacks,
): Promise<string> {
  const { mode, systemPrompt, conversationHistory, isOnline } = options;
  let fullText = "";

  // If offline, use local offline model (wllama → knowledge base)
  if (!isOnline) {
    return streamOfflineResponse(systemPrompt, conversationHistory, callbacks);
  }

  try {
    const client = getConvexClient();
    const historyForApi = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const currentMessage = conversationHistory[conversationHistory.length - 1]?.content ?? "";
    const historyMessages = historyForApi.slice(0, -1);

    const actionFn = mode === "general"
      ? api.chatActions.chatGemini
      : api.chatActions.chatGroq;

    fullText = await callAction(client, actionFn, {
      message: currentMessage,
      systemPrompt,
      history: historyMessages,
    });

    if (!fullText || fullText.trim().length === 0) {
      throw new Error("Empty response from API — check that your API keys are configured in the Convex environment variables.");
    }

    // Simulate streaming by revealing text progressively
    const words = fullText.split(" ");
    let accumulated = "";
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? "" : " ") + words[i];
      callbacks.onChunk(accumulated);
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    callbacks.onDone(fullText);
    return fullText;
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown streaming error");
    const isNetworkError =
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("network") ||
      err.message.includes("TypeError") ||
      err.name === "TypeError" ||
      err.name === "AbortError";

    // If it's a network error, fall back to offline AI (wllama → knowledge base)
    if (isNetworkError) {
      console.warn("[Quantum AI] Online API failed (network error), falling back to offline AI");
      try {
        return await streamOfflineResponse(systemPrompt, conversationHistory, callbacks);
      } catch (offlineError) {
        console.error("[Quantum AI] Offline fallback also failed:", offlineError);
      }
    }

    console.error("[Quantum AI] Stream error:", err);
    callbacks.onError(err);
    throw err;
  }
}

// Non-streaming fallback
export async function sendMessage(
  options: ChatServiceOptions,
): Promise<string> {
  const { mode, systemPrompt, conversationHistory, isOnline } = options;

  if (!isOnline) {
    // Try wllama first
    const wllamaReply = await tryWllamaChat(systemPrompt, conversationHistory);
    if (wllamaReply) return wllamaReply;

    // Fall back to knowledge base
    const { sendOfflineMessage } = await import("@/lib/offline-ai");
    return sendOfflineMessage(systemPrompt, conversationHistory);
  }

  try {
    const client = getConvexClient();
    const historyForApi = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const currentMessage = conversationHistory[conversationHistory.length - 1]?.content ?? "";
    const historyMessages = historyForApi.slice(0, -1);

    const actionFn = mode === "general"
      ? api.chatActions.chatGemini
      : api.chatActions.chatGroq;

    return await callAction(client, actionFn, {
      message: currentMessage,
      systemPrompt,
      history: historyMessages,
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  }
}
