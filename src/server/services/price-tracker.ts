import { prisma } from "@/shared/lib/prisma";
import { createLogger } from "@/shared/lib/logger";

const log = createLogger("price-tracker");

interface PriceDrop {
  itemId: string;
  title: string;
  oldPrice: number;
  newPrice: number;
  diff: number;
}

interface PriceCheckResult {
  checked: number;
  priceDrops: PriceDrop[];
}

export async function checkPriceChanges(
  userId: string
): Promise<PriceCheckResult> {
  const wishlistItems = await prisma.item.findMany({
    where: {
      userId,
      status: "WISHLIST",
      price: { not: null },
      deletedAt: null,
    },
    select: { id: true, title: true, price: true, source: true },
  });

  log.info("Checking prices", { userId, itemCount: wishlistItems.length });

  const priceDrops: PriceDrop[] = [];
  let checked = 0;

  for (const item of wishlistItems) {
    if (!item.price || !item.title) continue;

    try {
      const { searchByKeyword } = await import("./rakuten-ichiba");
      const results = await searchByKeyword(item.title, 1);

      if (results.length === 0) continue;
      checked++;

      const currentPrice = results[0].price;
      const oldPrice = item.price;

      if (currentPrice < oldPrice) {
        const diff = oldPrice - currentPrice;
        priceDrops.push({
          itemId: item.id,
          title: item.title,
          oldPrice,
          newPrice: currentPrice,
          diff,
        });

        log.info("Price drop detected", {
          title: item.title,
          oldPrice,
          newPrice: currentPrice,
          diff,
        });

        await prisma.notification.create({
          data: {
            userId,
            event: "price.drop",
            title: `値下げ: ${item.title}`,
            message: `¥${oldPrice.toLocaleString()} → ¥${currentPrice.toLocaleString()} (−¥${diff.toLocaleString()})`,
          },
        });

        await prisma.item.update({
          where: { id: item.id },
          data: { price: currentPrice },
        });
      }
    } catch {
      log.warn("Price check failed for item", { itemId: item.id, title: item.title });
    }
  }

  log.info("Price check completed", { checked, drops: priceDrops.length });

  return { checked, priceDrops };
}
