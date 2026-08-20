import type { AIMode, Message } from "@/types/quantum";

interface ChatServiceOptions {
  apiKey: string;
  mode: AIMode;
  systemPrompt: string;
  conversationHistory: Message[];
}

interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

// Gemini API (Google AI) - supports multiple API keys
async function* streamGemini(
  apiKey: string,
  systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const contents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const model = "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (e) {
    throw new Error(
      `Network error connecting to Gemini API. Check your internet connection. (${e instanceof Error ? e.message : "unknown"})`,
    );
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Gemini API error (${response.status}): ${error.slice(0, 300)}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Gemini API");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          // Handle both array and single candidate formats
          const candidates = data?.candidates;
          if (candidates && candidates.length > 0) {
            const text = candidates[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }
}

// Groq API (OpenAI-compatible) - supports multiple API keys
// Free tier has ~8K TPM limit, so we truncate long histories
const GROQ_MAX_HISTORY = 12;

function truncateForGroq(messages: Message[]): Message[] {
  if (messages.length <= GROQ_MAX_HISTORY) return messages;
  // Always keep the most recent messages, prioritizing recent context
  return messages.slice(-GROQ_MAX_HISTORY);
}

async function* streamGroq(
  apiKey: string,
  systemPrompt: string,
  messages: Message[],
): AsyncGenerator<string, void, unknown> {
  const truncated = truncateForGroq(messages);
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...truncated.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content.length > 1500 ? msg.content.slice(-1500) : msg.content,
    })),
  ];

  const url = "https://api.groq.com/openai/v1/chat/completions";

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: chatMessages,
        temperature: 0.7,
        max_completion_tokens: 4096,
        stream: true,
      }),
    });
  } catch (e) {
    throw new Error(
      `Network error connecting to Groq API. Check your internet connection. (${e instanceof Error ? e.message : "unknown"})`,
    );
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Groq API error (${response.status}): ${error.slice(0, 300)}`,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from Groq API");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data?.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {
          // Skip malformed SSE lines
        }
      }
    }
  }
}

// Main streaming chat function
export async function streamChat(
  options: ChatServiceOptions,
  callbacks: StreamCallbacks,
): Promise<string> {
  const { apiKey, mode, systemPrompt, conversationHistory } = options;
  let fullText = "";

  try {
    const generator =
      mode === "general"
        ? streamGemini(apiKey, systemPrompt, conversationHistory)
        : streamGroq(apiKey, systemPrompt, conversationHistory);

    for await (const chunk of generator) {
      fullText += chunk;
      callbacks.onChunk(fullText);
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
  const { apiKey, mode, systemPrompt, conversationHistory } = options;

  if (mode === "general") {
    // Use Gemini non-streaming
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    const contents = conversationHistory.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 8192,
          },
        }),
      });
    } catch (e) {
      throw new Error(
        `Network error connecting to Gemini API. Check your internet connection. (${e instanceof Error ? e.message : "unknown"})`,
      );
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${error.slice(0, 300)}`,
      );
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } else {
    // Use Groq non-streaming
    const url = "https://api.groq.com/openai/v1/chat/completions";
    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            { role: "system", content: systemPrompt },
            ...truncateForGroq(conversationHistory).map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content.length > 1500 ? msg.content.slice(-1500) : msg.content,
            })),
          ],
          temperature: 0.7,
          max_completion_tokens: 4096,
        }),
      });
    } catch (e) {
      throw new Error(
        `Network error connecting to Groq API. Check your internet connection. (${e instanceof Error ? e.message : "unknown"})`,
      );
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Groq API error (${response.status}): ${error.slice(0, 300)}`,
      );
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content ?? "";
  }
}
