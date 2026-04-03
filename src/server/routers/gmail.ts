import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { prisma } from "@/shared/lib/prisma";

const previewItemSchema = z.object({
  title: z.string(),
  price: z.number(),
  source: z.enum(["amazon", "rakuten"]),
  orderNumber: z.string(),
  orderDate: z.string(),
  category: z.enum([
    "BOOK",
    "ELECTRONICS",
    "DAILY_GOODS",
    "FOOD",
    "CLOTHING",
    "HOBBY",
    "OTHER",
  ]),
  quantity: z.number(),
  gmailMessageId: z.string(),
});

export const gmailRouter = router({
  getStatus: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId ?? "dev-user";

    try {
      const connection = await prisma.gmailConnection.findUnique({
        where: { userId },
        select: { email: true, lastSyncAt: true },
      });

      if (!connection) {
        return { connected: false, email: null, lastSyncAt: null };
      }

      return {
        connected: true,
        email: connection.email,
        lastSyncAt: connection.lastSyncAt,
      };
    } catch {
      return { connected: false, email: null, lastSyncAt: null };
    }
  }),

  disconnect: publicProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId ?? "dev-user";

    try {
      await prisma.gmailConnection.delete({
        where: { userId },
      });
    } catch {
      // Connection may not exist
    }

    return { success: true };
  }),

  preview: publicProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId ?? "dev-user";

    const connection = await prisma.gmailConnection.findUnique({
      where: { userId },
    });

    if (!connection) {
      return {
        items: [],
        totalFound: 0,
        errors: 1,
        errorMessage: "Gmail未連携です。先にGmailを連携してください。",
      };
    }

    try {
      const { previewPurchases } = await import(
        "../services/gmail-orchestrator"
      );
      const result = await previewPurchases(userId);

      return {
        items: result.items,
        totalFound: result.totalFound,
        errors: result.errors,
        errorMessage: null,
      };
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "プレビュー中にエラーが発生しました";
      return { items: [], totalFound: 0, errors: 1, errorMessage: message };
    }
  }),

  confirm: publicProcedure
    .input(z.object({ items: z.array(previewItemSchema) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId ?? "dev-user";

      try {
        const { confirmPurchases } = await import(
          "../services/gmail-orchestrator"
        );
        const result = await confirmPurchases(userId, input.items);

        return { saved: result.saved, error: null };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "保存中にエラーが発生しました";
        return { saved: 0, error: message };
      }
    }),
});
