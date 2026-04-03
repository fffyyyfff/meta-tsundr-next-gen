import { router, publicProcedure } from "../../trpc";
import { getStatusHandler } from "./getStatus.handler";
import { previewHandler } from "./preview.handler";
import { confirmHandler } from "./confirm.handler";
import { disconnectHandler } from "./disconnect.handler";
import { previewItemSchema } from "./schemas";
import { z } from "zod";

export const gmailRouter = router({
  getStatus: publicProcedure.query(({ ctx }) => getStatusHandler({ ctx })),
  preview: publicProcedure.mutation(({ ctx }) => previewHandler({ ctx })),
  confirm: publicProcedure
    .input(z.object({ items: z.array(previewItemSchema) }))
    .mutation(({ input, ctx }) => confirmHandler({ input, ctx })),
  disconnect: publicProcedure.mutation(({ ctx }) =>
    disconnectHandler({ ctx })
  ),
});
