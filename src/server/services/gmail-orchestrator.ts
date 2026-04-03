import { prisma } from "../../lib/prisma";
import { refreshAccessToken } from "./gmail-auth";
import { fetchPurchaseEmails } from "./gmail-sync";
import { parseOrderEmail } from "./email-parser";
import { ItemCategory } from "../../generated/prisma/client";

interface SyncResult {
  newItems: number;
  skipped: number;
  errors: number;
}

function detectSource(from: string): "amazon" | "rakuten" {
  if (from.includes("amazon")) return "amazon";
  return "rakuten";
}

function inferCategory(title: string): ItemCategory {
  const lower = title.toLowerCase();
  if (
    lower.includes("本") ||
    lower.includes("book") ||
    lower.includes("コミック") ||
    lower.includes("manga")
  ) {
    return "BOOK";
  }
  if (
    lower.includes("食") ||
    lower.includes("food") ||
    lower.includes("お菓子") ||
    lower.includes("飲料")
  ) {
    return "FOOD";
  }
  if (
    lower.includes("服") ||
    lower.includes("シャツ") ||
    lower.includes("パンツ") ||
    lower.includes("clothing")
  ) {
    return "CLOTHING";
  }
  if (
    lower.includes("電") ||
    lower.includes("ケーブル") ||
    lower.includes("バッテリー") ||
    lower.includes("electronics")
  ) {
    return "ELECTRONICS";
  }
  return "OTHER";
}

export async function syncPurchases(userId: string): Promise<SyncResult> {
  const connection = await prisma.gmailConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("Gmail connection not found for user");
  }

  let accessToken = connection.accessToken;

  // Refresh token if expired or about to expire (within 5 minutes)
  if (connection.expiresAt && connection.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)) {
    if (!connection.refreshToken) {
      throw new Error("Access token expired and no refresh token available");
    }
    const credentials = await refreshAccessToken(connection.refreshToken);
    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }
    accessToken = credentials.access_token;

    await prisma.gmailConnection.update({
      where: { userId },
      data: {
        accessToken,
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    });
  }

  const emails = await fetchPurchaseEmails(
    accessToken,
    connection.lastSyncAt ?? undefined
  );

  let newItems = 0;
  let skipped = 0;
  let errors = 0;

  for (const email of emails) {
    try {
      const source = detectSource(email.from);
      const parsed = await parseOrderEmail(email.bodyHtml, source);

      if (!parsed) {
        errors++;
        continue;
      }

      for (const orderItem of parsed.items) {
        // Check for duplicates via externalId (orderNumber)
        const existing = await prisma.item.findFirst({
          where: {
            userId,
            externalId: parsed.orderNumber,
            title: orderItem.title,
            deletedAt: null,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const purchaseDate = parsed.orderDate
          ? new Date(parsed.orderDate)
          : undefined;

        await prisma.item.create({
          data: {
            userId,
            category: inferCategory(orderItem.title),
            title: orderItem.title,
            price: orderItem.price,
            externalId: parsed.orderNumber,
            source,
            status: "PURCHASED",
            purchaseDate: purchaseDate && !isNaN(purchaseDate.getTime())
              ? purchaseDate
              : undefined,
            metadata: {
              gmailMessageId: email.messageId,
              quantity: orderItem.quantity,
              orderNumber: parsed.orderNumber,
            },
          },
        });

        newItems++;
      }
    } catch {
      errors++;
    }
  }

  // Update lastSyncAt
  await prisma.gmailConnection.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return { newItems, skipped, errors };
}
