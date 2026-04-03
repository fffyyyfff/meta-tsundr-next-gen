import { prisma } from "@/shared/lib/prisma";

export async function getStatusHandler({
  ctx,
}: {
  ctx: { userId: string | null };
}) {
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
}
