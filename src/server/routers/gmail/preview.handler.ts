import { prisma } from "@/shared/lib/prisma";

export async function previewHandler({
  ctx,
}: {
  ctx: { userId: string | null };
}) {
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
      "../../services/gmail-orchestrator"
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
}
