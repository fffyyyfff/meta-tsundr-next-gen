import type { PreviewItem } from "./schemas";

export async function confirmHandler({
  input,
  ctx,
}: {
  input: { items: PreviewItem[] };
  ctx: { userId: string | null };
}) {
  const userId = ctx.userId ?? "dev-user";

  try {
    const { confirmPurchases } = await import(
      "../../services/gmail-orchestrator"
    );
    const result = await confirmPurchases(userId, input.items);

    return { saved: result.saved, error: null };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "保存中にエラーが発生しました";
    return { saved: 0, error: message };
  }
}
