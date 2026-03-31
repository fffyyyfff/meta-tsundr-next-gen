import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { usageTracker } from '../services/usage-tracker';

const periodSchema = z.enum(['day', 'week', 'month']);

export const usageRouter = router({
  getUsageSummary: publicProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ input }) => {
      return usageTracker.getUsageSummary(input.period);
    }),

  getUsageHistory: publicProcedure
    .input(z.object({ period: periodSchema }))
    .query(async ({ input }) => {
      return usageTracker.getUsageHistory(input.period);
    }),

  getCurrentCost: publicProcedure.query(() => {
    return { costUsd: usageTracker.getCurrentCost() };
  }),
});
