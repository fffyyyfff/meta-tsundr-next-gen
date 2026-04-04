import { prisma } from "@/shared/lib/prisma";
import { searchByKeyword } from "../../services/rakuten-ichiba";
import { invalidateCache } from "../../services/cached-queries";
import { TRPCError } from "@trpc/server";

interface EnrichImageInput {
  id: string;
}

export async function enrichImageHandler({
  input,
}: {
  input: EnrichImageInput;
}) {
  const item = await prisma.item.findUnique({
    where: { id: input.id },
    select: { id: true, title: true, imageUrl: true },
  });

  if (!item) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
  }

  if (item.imageUrl) {
    return { updated: false, imageUrl: item.imageUrl };
  }

  const results = await searchByKeyword(item.title, 1);

  if (results.length === 0 || !results[0].imageUrl) {
    return { updated: false, imageUrl: null };
  }

  const imageUrl = results[0].imageUrl;

  await prisma.item.update({
    where: { id: input.id },
    data: { imageUrl },
  });

  await invalidateCache("items:*");

  return { updated: true, imageUrl };
}
