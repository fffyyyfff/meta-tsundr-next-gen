import { prisma } from "@/shared/lib/prisma";
import { refreshAccessToken } from "./gmail-auth";
import { fetchPurchaseEmails } from "./gmail-sync";
import { parseOrderEmail } from "./email-parser";
import { ItemCategory } from "../../generated/prisma/client";

export interface PreviewItem {
  title: string;
  price: number;
  source: "amazon" | "rakuten";
  orderNumber: string;
  orderDate: string;
  category: ItemCategory;
  quantity: number;
  gmailMessageId: string;
}

interface PreviewResult {
  items: PreviewItem[];
  totalFound: number;
  errors: number;
}

interface ConfirmResult {
  saved: number;
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

async function ensureAccessToken(userId: string): Promise<string> {
  const connection = await prisma.gmailConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("Gmail connection not found for user");
  }

  let accessToken = connection.accessToken;

  if (
    connection.expiresAt &&
    connection.expiresAt <= new Date(Date.now() + 5 * 60 * 1000)
  ) {
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

  return accessToken;
}

export async function previewPurchases(
  userId: string
): Promise<PreviewResult> {
  const connection = await prisma.gmailConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    throw new Error("Gmail connection not found for user");
  }

  const accessToken = await ensureAccessToken(userId);

  const syncSince =
    connection.lastSyncAt ??
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const emails = await fetchPurchaseEmails(accessToken, syncSince);

  const items: PreviewItem[] = [];
  let errors = 0;

  for (const email of emails) {
    try {
      const source = detectSource(email.from);

      if (email.bodyHtml.length < 20) {
        errors++;
        continue;
      }

      const parsed = await parseOrderEmail(email.bodyHtml, source);

      if (!parsed) {
        errors++;
        continue;
      }

      for (const orderItem of parsed.items) {
        // Check for existing duplicates
        const existing = await prisma.item.findFirst({
          where: {
            userId,
            externalId: parsed.orderNumber,
            title: orderItem.title,
            deletedAt: null,
          },
        });

        if (existing) continue;

        items.push({
          title: orderItem.title,
          price: orderItem.price,
          source,
          orderNumber: parsed.orderNumber,
          orderDate: parsed.orderDate,
          category: inferCategory(orderItem.title),
          quantity: orderItem.quantity,
          gmailMessageId: email.messageId,
        });
      }
    } catch {
      errors++;
    }
  }

  return { items, totalFound: emails.length, errors };
}

export async function confirmPurchases(
  userId: string,
  items: PreviewItem[]
): Promise<ConfirmResult> {
  let saved = 0;

  for (const item of items) {
    const purchaseDate = item.orderDate
      ? new Date(item.orderDate)
      : undefined;

    await prisma.item.create({
      data: {
        userId,
        category: item.category,
        title: item.title,
        price: item.price,
        externalId: item.orderNumber,
        source: item.source,
        status: "PURCHASED",
        purchaseDate:
          purchaseDate && !isNaN(purchaseDate.getTime())
            ? purchaseDate
            : undefined,
        metadata: {
          gmailMessageId: item.gmailMessageId,
          quantity: item.quantity,
          orderNumber: item.orderNumber,
        },
      },
    });

    saved++;
  }

  // Update lastSyncAt
  await prisma.gmailConnection.update({
    where: { userId },
    data: { lastSyncAt: new Date() },
  });

  return { saved };
}
