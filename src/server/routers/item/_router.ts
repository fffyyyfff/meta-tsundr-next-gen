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
});
