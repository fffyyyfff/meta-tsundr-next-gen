import { z } from 'zod';
import { router, publicProcedure } from '../../trpc';
import {
  itemListInput,
  getByIdInput,
  itemCreateInput,
  itemUpdateInput,
  deleteInput,
  restoreInput,
  itemChangeStatusInput,
  searchProductInput,
} from './schemas';
import { listHandler } from './list.handler';
import { getByIdHandler } from './getById.handler';
import { createHandler } from './create.handler';
import { updateHandler } from './update.handler';
import { deleteHandler } from './delete.handler';
import { restoreHandler } from './restore.handler';
import { changeStatusHandler } from './changeStatus.handler';
import { statsHandler } from './stats.handler';
import { searchProductHandler } from './searchProduct.handler';
import { enrichImageHandler } from './enrichImage.handler';
import { enrichAllImagesHandler } from './enrichAllImages.handler';
import { scanReceiptHandler } from './scanReceipt.handler';

const enrichImageInput = z.object({ id: z.string() });
const scanReceiptInput = z.object({
  image: z.string(),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  mode: z.enum(['ai', 'ocr']).default('ai'),
});

export const itemRouter = router({
  list: publicProcedure
    .input(itemListInput)
    .query(({ input, ctx }) => listHandler({ input, ctx })),

  getById: publicProcedure
    .input(getByIdInput)
    .query(({ input }) => getByIdHandler({ input })),

  create: publicProcedure
    .input(itemCreateInput)
    .mutation(({ input, ctx }) => createHandler({ input, ctx })),

  update: publicProcedure
    .input(itemUpdateInput)
    .mutation(({ input }) => updateHandler({ input })),

  delete: publicProcedure
    .input(deleteInput)
    .mutation(({ input }) => deleteHandler({ input })),

  restore: publicProcedure
    .input(restoreInput)
    .mutation(({ input }) => restoreHandler({ input })),

  changeStatus: publicProcedure
    .input(itemChangeStatusInput)
    .mutation(({ input }) => changeStatusHandler({ input })),

  stats: publicProcedure
    .query(({ ctx }) => statsHandler({ ctx })),

  searchProduct: publicProcedure
    .input(searchProductInput)
    .query(({ input }) => searchProductHandler({ input })),

  enrichImage: publicProcedure
    .input(enrichImageInput)
    .mutation(({ input }) => enrichImageHandler({ input })),

  enrichAllImages: publicProcedure
    .mutation(({ ctx }) => enrichAllImagesHandler({ ctx })),

  scanReceipt: publicProcedure
    .input(scanReceiptInput)
    .mutation(({ input }) => scanReceiptHandler({ input })),
});
