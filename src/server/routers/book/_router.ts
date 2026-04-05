import { router, publicProcedure } from '../../trpc';
import {
  bookListInput,
  bookCreateInput,
  bookUpdateInput,
  bookChangeStatusInput,
  bookGetByIdInput,
  bookDeleteInput,
  bookRestoreInput,
  bookLookupIsbnInput,
  bookGenerateReviewInput,
  bookSearchExternalInput,
} from './schemas';
import { listHandler } from './list.handler';
import { getByIdHandler } from './getById.handler';
import { createHandler } from './create.handler';
import { updateHandler } from './update.handler';
import { deleteHandler } from './delete.handler';
import { restoreHandler } from './restore.handler';
import { changeStatusHandler } from './changeStatus.handler';
import { statsHandler } from './stats.handler';
import { readingAnalyticsHandler } from './readingAnalytics.handler';
import { lookupIsbnHandler, searchExternalHandler } from './search.handler';
import {
  getAiRecommendationHandler,
  generateReviewHandler,
  createReadingPlanHandler,
} from './ai.handler';
import { notionSyncHandler } from './notionSync.handler';
import { notionCreateNoteHandler, notionCreateNoteInput } from './notionCreateNote.handler';

export const bookRouter = router({
  list: publicProcedure
    .input(bookListInput)
    .query(({ input, ctx }) => listHandler({ input, ctx })),

  getById: publicProcedure
    .input(bookGetByIdInput)
    .query(({ input, ctx }) => getByIdHandler({ input, ctx })),

  create: publicProcedure
    .input(bookCreateInput)
    .mutation(({ input, ctx }) => createHandler({ input, ctx })),

  update: publicProcedure
    .input(bookUpdateInput)
    .mutation(({ input, ctx }) => updateHandler({ input, ctx })),

  delete: publicProcedure
    .input(bookDeleteInput)
    .mutation(({ input, ctx }) => deleteHandler({ input, ctx })),

  restore: publicProcedure
    .input(bookRestoreInput)
    .mutation(({ input, ctx }) => restoreHandler({ input, ctx })),

  changeStatus: publicProcedure
    .input(bookChangeStatusInput)
    .mutation(({ input, ctx }) => changeStatusHandler({ input, ctx })),

  stats: publicProcedure.query(({ ctx }) => statsHandler({ ctx })),

  readingAnalytics: publicProcedure.query(({ ctx }) => readingAnalyticsHandler({ ctx })),

  lookupIsbn: publicProcedure
    .input(bookLookupIsbnInput)
    .query(({ input }) => lookupIsbnHandler({ input })),

  getAiRecommendation: publicProcedure.mutation(({ ctx }) =>
    getAiRecommendationHandler({ ctx }),
  ),

  generateReview: publicProcedure
    .input(bookGenerateReviewInput)
    .mutation(({ input, ctx }) => generateReviewHandler({ input, ctx })),

  createReadingPlan: publicProcedure.mutation(({ ctx }) =>
    createReadingPlanHandler({ ctx }),
  ),

  searchExternal: publicProcedure
    .input(bookSearchExternalInput)
    .query(({ input }) => searchExternalHandler({ input })),

  syncToNotion: publicProcedure.mutation(({ ctx }) =>
    notionSyncHandler({ ctx }),
  ),

  createNotionNote: publicProcedure
    .input(notionCreateNoteInput)
    .mutation(({ input }) => notionCreateNoteHandler({ input })),
});
