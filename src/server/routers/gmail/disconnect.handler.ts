import { prisma } from "@/shared/lib/prisma";

export async function disconnectHandler({
  ctx,
}: {
  ctx: { userId: string | null };
}) {
  const userId = ctx.userId ?? "dev-user";

  try {
    await prisma.gmailConnection.delete({
      where: { userId },
    });
  } catch {
    // Connection may not exist
  }

  return { success: true };
}
