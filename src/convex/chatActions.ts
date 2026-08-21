import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Collect all available API keys from environment variables.
 * Supports GEMINI_API_KEY, GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
 */
function getGeminiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary) keys.push(primary);
  // Check numbered variants: GEMINI_API_KEY_1, GEMINI_API_KEY_2, ...
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  // Also check comma-separated format in a single var
  if (primary && primary.includes(",")) {
    keys.length = 0;
    primary.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
  }
  return keys;
}

function getGroqKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GROQ_API_KEY;
  if (primary) keys.push(primary);
  for (let i = 1; i <= 20; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  if (primary && primary.includes(",")) {
    keys.length = 0;
    primary.split(",").forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) keys.push(trimmed);
    });
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
    throw new Error(`${label} API key not configured.`);
  }

  let lastError: Error | null = null;

  for (const key of keys) {
    try {
      return await fn(key);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Only retry on rate limit or auth errors
      const msg = lastError.message;
      if (
        msg.includes("429") ||
        msg.includes("403") ||
        msg.includes("Rate limit") ||
        msg.includes("rate_limit")
      ) {
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
  handler: async (ctx, args) => {
    const keys = getGeminiKeys();

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
          const err = await res.text();
          throw new Error(`Gemini API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return (
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          "No response generated."
        );
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
  handler: async (ctx, args) => {
    const keys = getGroqKeys();

    return tryWithKeys(
      keys,
      async (apiKey) => {
        // Truncate history to stay within free-tier limits
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
          const err = await res.text();
          throw new Error(`Groq API error (${res.status}): ${err}`);
        }

        const data = await res.json();
        return (
          data.choices?.[0]?.message?.content ?? "No response generated."
        );
      },
      "Groq",
    );
  },
});
