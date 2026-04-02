import { z } from 'zod';

export const ItemCategoryEnum = z.enum([
  'BOOK',
  'ELECTRONICS',
  'DAILY_GOODS',
  'FOOD',
  'CLOTHING',
  'HOBBY',
  'OTHER',
]);

export const ItemStatusEnum = z.enum([
  'WISHLIST',
  'PURCHASED',
  'IN_USE',
  'COMPLETED',
  'RETURNED',
]);

export const itemCreateInput = z.object({
  title: z.string().min(1).max(500),
  category: ItemCategoryEnum,
  creator: z.string().max(300).optional(),
  externalId: z.string().max(100).optional(),
  status: ItemStatusEnum.default('PURCHASED'),
  imageUrl: z.string().optional(),
  price: z.number().int().min(0).optional(),
  purchaseDate: z.coerce.date().optional(),
  source: z.string().max(50).optional(),
  productUrl: z.string().optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const itemListInput = z.object({
  category: ItemCategoryEnum.optional(),
  status: ItemStatusEnum.optional(),
  source: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'title', 'price', 'updatedAt', 'purchaseDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const itemUpdateInput = z.object({
  id: z.string(),
  category: ItemCategoryEnum.optional(),
  title: z.string().min(1).max(500).optional(),
  creator: z.string().max(300).optional(),
  externalId: z.string().max(100).optional(),
  status: ItemStatusEnum.optional(),
  imageUrl: z.string().optional(),
  price: z.number().int().min(0).nullable().optional(),
  purchaseDate: z.coerce.date().nullable().optional(),
  source: z.string().max(50).optional(),
  productUrl: z.string().optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const itemChangeStatusInput = z.object({
  id: z.string(),
  status: ItemStatusEnum,
});
