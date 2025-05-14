import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  cycles: defineTable({
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    symptoms: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    flow: v.optional(v.string()),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
