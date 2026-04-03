import { prisma } from '@/shared/lib/prisma';
import { withCache } from '../../services/cached-queries';

export async function statsHandler({ ctx }: { ctx: { userId: string | null } }) {
  const userId = ctx.userId ?? 'all';
  const cacheKey = `items:stats:${userId}`;

  return withCache(cacheKey, 300, async () => {
    try {
      const where: Record<string, unknown> = { deletedAt: null };
      if (ctx.userId) where.userId = ctx.userId;

      const items = await prisma.item.findMany({ where });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // byCategory: count + total price per category
      const byCategory: Record<string, { count: number; totalPrice: number }> = {};
      // byStatus: count per status
      const byStatus: Record<string, number> = {
        WISHLIST: 0, PURCHASED: 0, IN_USE: 0, COMPLETED: 0, RETURNED: 0,
      };
      // bySource: count per source
      const bySource: Record<string, number> = {};

      let totalSpending = 0;
      let thisMonthSpending = 0;
      let lastMonthSpending = 0;

      // monthly buckets for last 6 months
      const monthlyBuckets: Record<string, number> = {};
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyBuckets[key] = 0;
      }

      // byMonth: monthly spending (all time)
      const byMonth: Record<string, number> = {};

      for (const item of items) {
        // byStatus
        byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;

        // byCategory
        if (!byCategory[item.category]) {
          byCategory[item.category] = { count: 0, totalPrice: 0 };
        }
        byCategory[item.category].count += 1;
        byCategory[item.category].totalPrice += item.price ?? 0;

        // bySource
        const src = item.source ?? 'unknown';
        bySource[src] = (bySource[src] ?? 0) + 1;

        // spending calculations based on purchaseDate or createdAt
        const priceVal = item.price ?? 0;
        const dateRef = item.purchaseDate ?? item.createdAt;

        totalSpending += priceVal;

        if (dateRef >= startOfMonth) {
          thisMonthSpending += priceVal;
        } else if (dateRef >= startOfLastMonth && dateRef < startOfMonth) {
          lastMonthSpending += priceVal;
        }

        // byMonth
        const monthKey = `${dateRef.getFullYear()}-${String(dateRef.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] ?? 0) + priceVal;

        // monthly buckets (last 6 months)
        if (monthKey in monthlyBuckets) {
          monthlyBuckets[monthKey] += priceVal;
        }
      }

      const monthlySpending = Object.entries(monthlyBuckets)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount }));

      return {
        byCategory,
        byStatus,
        byMonth,
        bySource,
        totalSpending,
        thisMonthSpending,
        lastMonthSpending,
        monthlySpending,
      };
    } catch {
      return {
        byCategory: {},
        byStatus: {},
        byMonth: {},
        bySource: {},
        totalSpending: 0,
        thisMonthSpending: 0,
        lastMonthSpending: 0,
        monthlySpending: [],
      };
    }
  });
}
