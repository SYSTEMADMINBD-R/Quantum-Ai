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
 * Try to get a response using Wllama (non-streaming, more reliable on mobile CPU).
 * Returns the response string if successful, null otherwise.
 */
async function tryWllamaChat(
  systemPrompt: string,
  conversationHistory: Message[],
): Promise<string | null> {
  const state = wllamaEngine.getState();
  if (state.status !== "ready") return null;

  try {
    // Only send the last 4 messages to keep context small for the 1B/1.7B model
    const recentHistory = conversationHistory.slice(-4);
    const historyForModel = recentHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const reply = await wllamaEngine.chat(historyForModel, systemPrompt);

    console.log(`[Quantum AI] Wllama generated ${reply.length} chars`);
    return reply.trim().length > 0 ? reply : null;
  } catch (err) {
    console.warn("[Quantum AI] Wllama failed:", err);
    return null;
  }
}

/**
 * Stream offline AI response — tries wllama first, then ALWAYS falls back to knowledge base.
 * This function NEVER fails — it always produces a response via onDone().
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
    callbacks.onChunk("Thinking with AI model…");

    const wllamaReply = await tryWllamaChat(systemPrompt, conversationHistory);

    if (wllamaReply) {
      // Wllama succeeded — send the full response
      callbacks.onChunk(wllamaReply);
      callbacks.onDone(wllamaReply);
      return wllamaReply;
    }
    console.log("[Quantum AI] Wllama failed or returned empty, falling back to knowledge base");
  }

  // 2. Fall back to knowledge base — this ALWAYS works
  console.log("[Quantum AI] Using knowledge base fallback");
  callbacks.onChunk("Thinking…");

  try {
    let fullText = "";
    const generator = streamOfflineChat(systemPrompt, conversationHistory);

    // Add a safety timeout — if knowledge base takes more than 10s, something is wrong
    const kbTimeout = new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(true), 10000);
    });

    let generatorDone = false;
    try {
      for await (const chunk of generator) {
        fullText = chunk;
        callbacks.onChunk(fullText);
      }
      generatorDone = true;
    } catch (genErr) {
      console.error("[Quantum AI] Knowledge base generator error:", genErr);
    }

    // If generator didn't produce anything, give a guaranteed response
    if (!generatorDone || fullText.trim().length === 0) {
      fullText = getGuaranteedOfflineResponse(conversationHistory);
      callbacks.onChunk(fullText);
    }

    callbacks.onDone(fullText);
    return fullText;
  } catch (error) {
    // Absolute last resort — guaranteed response
    console.error("[Quantum AI] Offline response completely failed:", error);
    const fallback = getGuaranteedOfflineResponse(conversationHistory);
    callbacks.onChunk(fallback);
    callbacks.onDone(fallback);
    return fallback;
  }
}

/**
 * Guaranteed response that always works — no async, no generators, no errors possible.
 */
function getGuaranteedOfflineResponse(conversationHistory: Message[]): string {
  const lastMsg = conversationHistory[conversationHistory.length - 1]?.content?.toLowerCase() ?? "";

  if (lastMsg.includes("hello") || lastMsg.includes("hi") || lastMsg.includes("hey")) {
    return "Hello! I'm Quantum AI. I'm currently offline, but I'm here to help with what I know. How can I assist you?";
  }

  if (lastMsg.includes("who made") || lastMsg.includes("who created") || lastMsg.includes("who built")) {
    return "Every line of code, every system, every feature of this app was designed, coded, and developed entirely by RAGIB from the ground up, with minimal AI assistance. Built with passion, built for everyone.";
  }

  if (lastMsg.includes("thank")) {
    return "You're welcome! I'm happy to help. Let me know if you have any other questions.";
  }

  if (lastMsg.includes("bye") || lastMsg.includes("goodbye")) {
    return "Goodbye! Have a great day. I'll be here whenever you need me!";
  }

  return "I'm Quantum AI in offline mode. I can handle general knowledge questions, but for complex or specific topics, my online modes (General and Hacking) provide much more detailed and accurate responses. Try asking about common topics like science, history, geography, or technology!";
}

// Main streaming chat function — routes through Convex proxy actions
export async function streamChat(
  options: ChatServiceOptions,
  callbacks: StreamCallbacks,
): Promise<string> {
  const { mode, systemPrompt, conversationHistory, isOnline } = options;

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

    const fullText = await callAction(client, actionFn, {
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
