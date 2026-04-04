import { prisma } from "@/shared/lib/prisma";
import { searchByKeyword } from "../../services/rakuten-ichiba";
import { invalidateCache } from "../../services/cached-queries";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichAllImagesHandler({
  ctx,
}: {
  ctx: { userId?: string | null };
}) {
  const userId = ctx.userId ?? "dev-user";

  const items = await prisma.item.findMany({
    where: {
      userId,
      imageUrl: null,
      deletedAt: null,
    },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const results = await searchByKeyword(item.title, 1);

      if (results.length === 0 || !results[0].imageUrl) {
        skipped++;
        await sleep(1000);
        continue;
      }

      await prisma.item.update({
        where: { id: item.id },
        data: { imageUrl: results[0].imageUrl },
      });

      updated++;
    } catch {
      failed++;
    }

    // Rate limit: 1 second between API calls
    await sleep(1000);
  }

  // Invalidate list cache so images appear immediately
  if (updated > 0) {
    await invalidateCache("items:*");
  }

  return { updated, failed, skipped };
}
