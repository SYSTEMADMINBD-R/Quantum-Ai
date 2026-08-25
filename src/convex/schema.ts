import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Quantum AI user settings (API keys, prompts) synced across devices
    userSettings: defineTable({
      userId: v.id("users"),
      geminiApiKeys: v.array(v.string()),
      groqApiKeys: v.array(v.string()),
      defaultMode: v.union(v.literal("general"), v.literal("hacking")),
      systemPrompts: v.object({
        general: v.string(),
        hacking: v.string(),
      }),
    }).index("by_user", ["userId"]),

    // Cloud-synced conversations for signed-in users
    conversations: defineTable({
      userId: v.id("users"),
      conversationId: v.string(), // client-side ID
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
    })
      .index("by_user", ["userId"])
      .index("by_user_and_convId", ["userId", "conversationId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
