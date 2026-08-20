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

// Main streaming chat function — routes through Convex proxy actions
export async function streamChat(
  options: ChatServiceOptions,
  callbacks: StreamCallbacks,
): Promise<string> {
  const { apiKey, mode, systemPrompt, conversationHistory, isOnline } = options;
  let fullText = "";

  // If offline or no API key, use local offline model
  if (!isOnline || !apiKey) {
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


    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

    const historyForApi = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call the Convex action via HTTP
    const actionName =
      mode === "general" ? "chatActions:chatGemini" : "chatActions:chatGroq";

    const res = await fetch(`${convexUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: actionName,
        args: {
          message: conversationHistory[conversationHistory.length - 1]?.content ?? "",
          systemPrompt,
          history: historyForApi.slice(0, -1), // Exclude the last message (it's the current one)
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(
        `API error (${res.status}): ${err.slice(0, 300)}`,
      );
    }

    const data = await res.json();
    fullText = data?.result ?? "No response generated.";

    // Simulate streaming by revealing text progressively
    const words = fullText.split(" ");
    let accumulated = "";
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? "" : " ") + words[i];
      callbacks.onChunk(accumulated);
      // Small delay to simulate streaming feel
      if (i % 3 === 0) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }

    callbacks.onDone(fullText);
    return fullText;
  } catch (error) {
    const err =
      error instanceof Error ? error : new Error("Unknown streaming error");
    callbacks.onError(err);
    throw err;
  }
}

// Non-streaming fallback
export async function sendMessage(
  options: ChatServiceOptions,
): Promise<string> {
  const { apiKey, mode, systemPrompt, conversationHistory, isOnline } = options;

  // If offline or no API key, use local model
  if (!isOnline || !apiKey) {
    const { sendOfflineMessage } = await import("@/lib/offline-ai");
    return sendOfflineMessage(systemPrompt, conversationHistory);
  }

  try {
    const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

    const historyForApi = conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const actionName =
      mode === "general" ? "chatActions:chatGemini" : "chatActions:chatGroq";

    const res = await fetch(`${convexUrl}/api/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: actionName,
        args: {
          message: conversationHistory[conversationHistory.length - 1]?.content ?? "",
          systemPrompt,
          history: historyForApi.slice(0, -1),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error (${res.status}): ${err.slice(0, 300)}`);
    }

    const data = await res.json();
    return data?.result ?? "No response generated.";
  } catch (error) {
    throw error instanceof Error ? error : new Error("Unknown error");
  }
}
