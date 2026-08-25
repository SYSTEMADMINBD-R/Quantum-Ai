import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all conversations for the current user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

/**
 * Save or update a conversation (upsert by conversationId).
 */
export const save = mutation({
  args: {
    conversationId: v.string(),
    title: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        mode: v.union(v.literal("general"), v.literal("hacking")),
        timestamp: v.number(),
        model: v.optional(v.string()),
      }),
    ),
    mode: v.union(v.literal("general"), v.literal("hacking")),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if conversation already exists
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_and_convId", (q) =>
        q.eq("userId", userId).eq("conversationId", args.conversationId),
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        messages: args.messages,
        mode: args.mode,
        updatedAt: args.updatedAt,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("conversations", {
        userId,
        conversationId: args.conversationId,
        title: args.title,
        messages: args.messages,
        mode: args.mode,
        createdAt: args.createdAt,
        updatedAt: args.updatedAt,
      });
    }
  },
});

/**
 * Bulk save conversations (for initial sync from local to cloud).
 */
export const bulkSave = mutation({
  args: {
    conversations: v.array(
      v.object({
        conversationId: v.string(),
        title: v.string(),
        messages: v.array(
          v.object({
            id: v.string(),
            role: v.union(v.literal("user"), v.literal("assistant")),
            content: v.string(),
            mode: v.union(v.literal("general"), v.literal("hacking")),
            timestamp: v.number(),
            model: v.optional(v.string()),
          }),
        ),
        mode: v.union(v.literal("general"), v.literal("hacking")),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    for (const conv of args.conversations) {
      const existing = await ctx.db
        .query("conversations")
        .withIndex("by_user_and_convId", (q) =>
          q.eq("userId", userId).eq("conversationId", conv.conversationId),
        )
        .first();

      if (existing) {
        // Only update if newer
        if (conv.updatedAt > existing.updatedAt) {
          await ctx.db.patch(existing._id, {
            title: conv.title,
            messages: conv.messages,
            mode: conv.mode,
            updatedAt: conv.updatedAt,
          });
        }
      } else {
        await ctx.db.insert("conversations", {
          userId,
          conversationId: conv.conversationId,
          title: conv.title,
          messages: conv.messages,
          mode: conv.mode,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        });
      }
    }
  },
});

/**
 * Delete a conversation from the cloud.
 */
export const remove = mutation({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_user_and_convId", (q) =>
        q.eq("userId", userId).eq("conversationId", args.conversationId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/**
 * Delete all conversations for the current user.
 */
export const removeAll = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const conv of conversations) {
      await ctx.db.delete(conv._id);
    }
  },
});
