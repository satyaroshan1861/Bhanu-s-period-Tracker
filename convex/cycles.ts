import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const addCycle = mutation({
  args: {
    startDate: v.string(),
    symptoms: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    flow: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.insert("cycles", {
      userId,
      startDate: args.startDate,
      symptoms: args.symptoms,
      notes: args.notes,
      flow: args.flow,
    });
  },
});

export const updateCycle = mutation({
  args: {
    id: v.id("cycles"),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    return await ctx.db.patch(args.id, {
      endDate: args.endDate,
    });
  },
});

export const getMyCycles = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    return await ctx.db
      .query("cycles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getPredictions = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const cycles = await ctx.db
      .query("cycles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    if (cycles.length < 2) return null;

    // Calculate average cycle length
    let totalDays = 0;
    for (let i = 0; i < cycles.length - 1; i++) {
      const current = new Date(cycles[i].startDate);
      const next = new Date(cycles[i + 1].startDate);
      totalDays += Math.abs((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));
    }
    const avgCycleLength = Math.round(totalDays / (cycles.length - 1));

    // Predict next 3 periods
    const lastPeriod = new Date(cycles[0].startDate);
    const predictions = [];
    for (let i = 1; i <= 3; i++) {
      const predictedDate = new Date(lastPeriod);
      predictedDate.setDate(predictedDate.getDate() + (avgCycleLength * i));
      predictions.push({
        date: predictedDate.toISOString().split('T')[0],
        cycleNumber: i,
      });
    }

    return {
      averageCycleLength: avgCycleLength,
      predictions,
    };
  },
});

export const getSymptomStats = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    const cycles = await ctx.db
      .query("cycles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const stats: Record<string, number> = {};
    let totalCycles = 0;

    cycles.forEach(cycle => {
      if (cycle.symptoms) {
        totalCycles++;
        cycle.symptoms.forEach(symptom => {
          stats[symptom] = (stats[symptom] || 0) + 1;
        });
      }
    });

    return Object.entries(stats).map(([symptom, count]) => ({
      symptom,
      count,
      percentage: Math.round((count / totalCycles) * 100),
    }));
  },
});
