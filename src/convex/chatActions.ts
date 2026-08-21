import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Collect all available API keys from environment variables.
 * Supports GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
 * Also supports comma-separated format in a single var.
 */
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary && primary.includes(",")) {
    // Comma-separated format
    primary.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
    return keys;
  }
  if (primary) keys.push(primary);
  // Check numbered variants: GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

function getGroqKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GROQ_API_KEY;
  if (primary && primary.includes(",")) {
    primary.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
    return keys;
  }
  if (primary) keys.push(primary);
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

/**
 * Try each key in order. If one fails with 429/403, try the next.
 */
async function tryWithKeys<T>(
  keys: string[],
  fn: (key: string) => Promise<T>,
  label: string,
): Promise<T> {
  if (keys.length === 0) {
    throw new Error(
      `${label} API key not configured. Please add ${label}_API_KEY in your Convex environment variables.`,
    );
  }

  console.log(`[Quantum AI] Trying ${keys.length} ${label} key(s)...`);
  let lastError: Error | null = null;

  for (let i = 0; i < keys.length; i++) {
    try {
      const result = await fn(keys[i]);
      console.log(`[Quantum AI] ${label} key #${i + 1} succeeded`);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(
        `[Quantum AI] ${label} key #${i + 1} failed:`,
        lastError.message,
      );
      const msg = lastError.message;
      if (
        msg.includes("429") ||
        msg.includes("403") ||
        msg.includes("Rate limit") ||
        msg.includes("rate_limit")
      ) {
        console.log(`[Quantum AI] Retrying with next ${label} key...`);
        continue; // try next key
      }
      throw lastError; // non-retryable error
    }
  }

  throw lastError ?? new Error(`${label}: All API keys exhausted.`);
}

/**
 * Chat through Gemini API with key rotation.
 */
export const chatGemini = action({
  args: {
    message: v.string(),
    systemPrompt: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (_ctx, args) => {
    const keys = getGeminiKeys();
    console.log(`[Quantum AI] Gemini action called with ${keys.length} key(s), message length: ${args.message.length}`);

    return tryWithKeys(
      keys,
      async (apiKey) => {
        const contents = [
          ...args.history.map((h) => ({
            role: h.role,
            parts: [{ text: h.content }],
          })),
          { role: "user" as const, parts: [{ text: args.message }] },
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: args.systemPrompt }],
              },
              contents,
              generationConfig: {
                maxOutputTokens: 4096,
                temperature: 0.7,
              },
            }),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Quantum AI] Gemini API error ${res.status}:`, errText);
          throw new Error(`Gemini API error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (!text) {
          console.warn("[Quantum AI] Gemini returned empty text, full response:", JSON.stringify(data).slice(0, 500));
          throw new Error("Gemini returned an empty response — this may be a safety filter or configuration issue.");
        }

        return text;
      },
      "Gemini",
    );
  },
});

/**
 * Chat through Groq API with key rotation.
 */
export const chatGroq = action({
  args: {
    message: v.string(),
    systemPrompt: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (_ctx, args) => {
    const keys = getGroqKeys();
    console.log(`[Quantum AI] Groq action called with ${keys.length} key(s), message length: ${args.message.length}`);

    return tryWithKeys(
      keys,
      async (apiKey) => {
        // Truncate history to stay within free-tier limits (8000 TPM)
        const recentHistory = args.history.slice(-12).map((h) => ({
          role: h.role,
          content: h.content.slice(0, 1500),
        }));

        const res = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-20b",
              messages: [
                { role: "system", content: args.systemPrompt },
                ...recentHistory,
                { role: "user", content: args.message },
              ],
              max_completion_tokens: 4096,
              temperature: 0.7,
            }),
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          console.error(`[Quantum AI] Groq API error ${res.status}:`, errText);
          throw new Error(`Groq API error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";

        if (!text) {
          console.warn("[Quantum AI] Groq returned empty text, full response:", JSON.stringify(data).slice(0, 500));
          throw new Error("Groq returned an empty response.");
        }

        return text;
      },
      "Groq",
    );
  },
});
