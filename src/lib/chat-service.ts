import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { AIMode, Message } from "@/types/quantum";
import { streamOfflineChat } from "@/lib/offline-ai";

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
 * Returns a status object with counts (no key values exposed).
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
 * Handles various return formats the SDK might produce.
 */
async function callAction(
  client: ConvexHttpClient,
  actionFn: typeof api.chatActions.chatGemini,
  args: { message: string; systemPrompt: string; history: Array<{ role: "user" | "assistant"; content: string }> },
): Promise<string> {
  const raw = await client.action(actionFn, args);

  // ConvexHttpClient.action() should return the action's return value directly.
  // But handle edge cases where it might be wrapped.
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null) {
    // Could be { text: "..." } or similar wrapper
    const obj = raw as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.content === "string") return obj.content;
    // Last resort: JSON.stringify so we see what it actually is
    console.warn("[Quantum AI] Unexpected action return type:", raw);
    return JSON.stringify(raw);
  }
  if (raw === null || raw === undefined) {
    throw new Error("Action returned empty response — API keys may not be configured in Convex env vars.");
  }
  return String(raw);
}

// Main streaming chat function — routes through Convex proxy actions
export async function streamChat(
  options: ChatServiceOptions,
  callbacks: StreamCallbacks,
): Promise<string> {
  const { mode, systemPrompt, conversationHistory, isOnline } = options;
  let fullText = "";

  // If offline, use local offline model
  if (!isOnline) {
    try {
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

  try {
    const client = getConvexClient();
    const historyForApi = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // The last message is the current user message; everything before is history
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
