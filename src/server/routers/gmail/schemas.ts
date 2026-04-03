import { z } from "zod";

export const previewItemSchema = z.object({
  title: z.string(),
  price: z.number().nullable(),
  source: z.enum(["amazon", "rakuten"]),
  orderNumber: z.string().nullable(),
  orderDate: z.string().nullable(),
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

export type PreviewItem = z.infer<typeof previewItemSchema>;
