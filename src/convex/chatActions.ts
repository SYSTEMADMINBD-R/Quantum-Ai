import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Stream chat through Gemini API (server-side, keys stay secret).
 * Returns the full response text. The client calls this for each message.
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Gemini API key not configured. Add GEMINI_API_KEY in your Convex dashboard → Settings → Environment Variables.",
      );
    }

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
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated.";
    return text;
  },
});

/**
 * Stream chat through Groq API (server-side, keys stay secret).
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
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Groq API key not configured. Add GROQ_API_KEY in your Convex dashboard → Settings → Environment Variables.",
      );
    }

    // Truncate to stay within free-tier TPM limits
    const recentHistory = args.history.slice(-12).map((h) => ({
      role: h.role,
      content: h.content.slice(0, 1500),
    }));

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text =
      data.choices?.[0]?.message?.content ?? "No response generated.";
    return text;
  },
});
