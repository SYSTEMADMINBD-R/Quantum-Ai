import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the current user's settings. Returns null if not signed in or no settings yet.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!settings) return null;

    return {
      geminiApiKeys: settings.geminiApiKeys,
      groqApiKeys: settings.groqApiKeys,
      defaultMode: settings.defaultMode,
      systemPrompts: settings.systemPrompts,
    };
  },
});

/**
 * Save (upsert) the current user's settings.
 */
export const save = mutation({
  args: {
    geminiApiKeys: v.array(v.string()),
    groqApiKeys: v.array(v.string()),
    defaultMode: v.union(v.literal("general"), v.literal("hacking")),
    systemPrompts: v.object({
      general: v.string(),
      hacking: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        geminiApiKeys: args.geminiApiKeys,
        groqApiKeys: args.groqApiKeys,
        defaultMode: args.defaultMode,
        systemPrompts: args.systemPrompts,
      });
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        geminiApiKeys: args.geminiApiKeys,
        groqApiKeys: args.groqApiKeys,
        defaultMode: args.defaultMode,
        systemPrompts: args.systemPrompts,
      });
    }
  },
});
