import { z } from 'zod';

export const BookStatusEnum = z.enum(['WISHLIST', 'UNREAD', 'READING', 'FINISHED']);

export const bookCreateInput = z.object({
  title: z.string().min(1).max(500),
  author: z.string().min(1).max(300),
  isbn: z.string().max(13).optional(),
  status: BookStatusEnum.default('UNREAD'),
  imageUrl: z.url().optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const bookListInput = z.object({
  status: BookStatusEnum.optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'title', 'author', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const bookUpdateInput = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  author: z.string().min(1).max(300).optional(),
  isbn: z.string().max(13).optional(),
  status: BookStatusEnum.optional(),
  imageUrl: z.url().optional(),
  notes: z.string().max(5000).optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export const bookChangeStatusInput = z.object({
  id: z.string(),
  status: BookStatusEnum,
});

export const bookGetByIdInput = z.object({ id: z.string() });

export const bookDeleteInput = z.object({ id: z.string() });

export const bookRestoreInput = z.object({ id: z.string() });

export const bookLookupIsbnInput = z.object({ isbn: z.string().min(10).max(13) });

export const bookGenerateReviewInput = z.object({ bookId: z.string() });

export const bookSearchExternalInput = z.object({
  title: z.string().min(1).max(200),
  availability: z.string().optional(),
  sort: z.string().optional(),
});

export const seriesSearchInput = z.object({
  title: z.string().min(1).max(200),
});

export const seriesBulkAddInput = z.object({
  series: z.string().min(1).max(500),
  author: z.string().min(1).max(300),
  volumes: z.array(
    z.object({
      number: z.number().int().min(0),
      title: z.string().min(1).max(500),
      isbn: z.string().max(13),
      imageUrl: z.string().nullable(),
    }),
  ),
  status: BookStatusEnum,
});
