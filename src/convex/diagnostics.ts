import { action } from "./_generated/server";

/**
 * Diagnostic action — shows how many API keys are configured in env vars.
 * Does NOT expose the actual key values (security — only shows length/presence).
 */
export const checkApiKeys = action({
  args: {},
  handler: async () => {
    const results: Record<string, unknown> = {};

    // Check Gemini keys
    const geminiKeys: string[] = [];
    const gPrimary = process.env.GEMINI_API_KEY;
    if (gPrimary && gPrimary.includes(",")) {
      gPrimary.split(",").forEach((k) => {
        if (k.trim()) geminiKeys.push(k.trim());
      });
    } else if (gPrimary) {
      geminiKeys.push(gPrimary);
    }
    for (let i = 1; i <= 20; i++) {
      const k = process.env[`GEMINI_API_KEY_${i}`];
      if (k) geminiKeys.push(k);
    }
    results.gemini = {
      count: geminiKeys.length,
      keyPreview: geminiKeys.map((k) => `...${k.slice(-4)} (${k.length} chars)`),
    };

    // Check Groq keys
    const groqKeys: string[] = [];
    const qPrimary = process.env.GROQ_API_KEY;
    if (qPrimary && qPrimary.includes(",")) {
      qPrimary.split(",").forEach((k) => {
        if (k.trim()) groqKeys.push(k.trim());
      });
    } else if (qPrimary) {
      groqKeys.push(qPrimary);
    }
    for (let i = 1; i <= 20; i++) {
      const k = process.env[`GROQ_API_KEY_${i}`];
      if (k) groqKeys.push(k);
    }
    results.groq = {
      count: groqKeys.length,
      keyPreview: groqKeys.map((k) => `...${k.slice(-4)} (${k.length} chars)`),
    };

    // Overall status
    results.status = {
      geminiReady: geminiKeys.length > 0,
      groqReady: groqKeys.length > 0,
      message:
        geminiKeys.length > 0 && groqKeys.length > 0
          ? "✅ Both Gemini and Groq keys are configured."
          : geminiKeys.length > 0
            ? "⚠️ Gemini keys found, but Groq keys are missing."
            : groqKeys.length > 0
              ? "⚠️ Groq keys found, but Gemini keys are missing."
              : "❌ No API keys found. Add GEMINI_API_KEY and GROQ_API_KEY in your Convex environment variables.",
    };

    return results;
  },
});
