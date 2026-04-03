import { TRPCError } from '@trpc/server';
import { bookClient } from '../../grpc-client';
import { BookStatus as ProtoBookStatus } from '@/generated/proto/tsundoku/book/v1/types';
import { bookRecommendAgent } from '../../agents/book-recommend-agent';
import { bookReviewAgent } from '../../agents/book-review-agent';
import { readingPlanAgent } from '../../agents/reading-plan-agent';

export async function getAiRecommendationHandler({
  ctx,
}: {
  ctx: { userId: string | null; token: string | null };
}) {
  const res = await bookClient.getBooks(
    {
      status: ProtoBookStatus.FINISHED,
      limit: 30,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    ctx.token ?? undefined,
  );

  if (res.books.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '推薦には読了済みの書籍が必要です',
    });
  }

  const bookList = res.books.map((b) => `- 「${b.title}」${b.author}`).join('\n');

  const result = await bookRecommendAgent.execute(
    `以下はユーザーの読書履歴です。この傾向を分析して、次に読むべき本を3〜5冊推薦してください。\n\n${bookList}`,
  );

  if (!result.success) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: result.error ?? 'AI推薦の生成に失敗しました',
    });
  }

  return { recommendation: result.result, tokenUsage: result.tokenUsage };
}

export async function generateReviewHandler({
  input,
  ctx,
}: {
  input: { bookId: string };
  ctx: { userId: string | null; token: string | null };
}) {
  const book = await bookClient.getBook(input.bookId, ctx.token ?? undefined);

  const prompt = [
    `書籍情報:`,
    `- タイトル: ${book.title}`,
    `- 著者: ${book.author}`,
    book.notes ? `\nユーザーのメモ:\n${book.notes}` : '',
    `\nこの書籍の書評を生成してください。`,
  ]
    .filter(Boolean)
    .join('\n');

  const result = await bookReviewAgent.execute(prompt);

  if (!result.success) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: result.error ?? '書評の生成に失敗しました',
    });
  }

  return { review: result.result, tokenUsage: result.tokenUsage };
}

export async function createReadingPlanHandler({
  ctx,
}: {
  ctx: { userId: string | null; token: string | null };
}) {
  const res = await bookClient.getBooks(
    {
      status: ProtoBookStatus.UNREAD,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'asc',
    },
    ctx.token ?? undefined,
  );

  if (res.books.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '読書プランには未読の書籍が必要です',
    });
  }

  const bookList = res.books.map((b) => `- 「${b.title}」${b.author}`).join('\n');

  const result = await readingPlanAgent.execute(
    `以下はユーザーの積読リストです。これらの書籍を使って1週間の読書スケジュールを作成してください。\n\n${bookList}`,
  );

  if (!result.success) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: result.error ?? '読書プランの生成に失敗しました',
    });
  }

  return { plan: result.result, tokenUsage: result.tokenUsage };
}
