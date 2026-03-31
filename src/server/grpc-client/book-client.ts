import type {
  ListBooksRequest,
  ListBooksResponse,
  GetBookRequest,
  GetBookResponse,
  CreateBookRequest,
  CreateBookResponse,
  UpdateBookRequest,
  UpdateBookResponse,
  DeleteBookRequest,
  DeleteBookResponse,
  UpdateBookStatusRequest,
  UpdateBookStatusResponse,
} from '@/generated/proto/tsundoku/book/v1/types';
import { GRPC_BACKEND_URL } from './index';
import { grpcToTrpcError } from './errors';
import { protoBookToAppBook, appStatusToProtoStatus, type AppBook, type AppBookStatus } from './converters';

/**
 * Typed gRPC book service client.
 * Wraps raw Connect calls, converts proto types to app types,
 * and maps gRPC errors to TRPCErrors.
 *
 * Once buf-generated service descriptors are available,
 * replace fetch calls with `createClient(BookService, grpcTransport)`.
 */

async function rpc<TReq, TRes>(method: string, request: TReq): Promise<TRes> {
  const url = `${GRPC_BACKEND_URL}/tsundoku.book.v1.BookService/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gRPC ${method} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<TRes>;
}

export const bookClient = {
  async getBooks(
    request: ListBooksRequest,
  ): Promise<{ books: AppBook[]; nextCursor: string }> {
    try {
      const res = await rpc<ListBooksRequest, ListBooksResponse>('ListBooks', request);
      return {
        books: (res.books ?? []).map(protoBookToAppBook),
        nextCursor: res.nextCursor ?? '',
      };
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async getBook(id: string): Promise<AppBook> {
    try {
      const res = await rpc<GetBookRequest, GetBookResponse>('GetBook', { id });
      if (!res.book) {
        throw new Error('Book not found in response');
      }
      return protoBookToAppBook(res.book);
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async createBook(
    request: Omit<CreateBookRequest, 'status'> & { status?: AppBookStatus },
  ): Promise<AppBook> {
    try {
      const protoReq: CreateBookRequest = {
        ...request,
        status: request.status ? appStatusToProtoStatus(request.status) : undefined,
      };
      const res = await rpc<CreateBookRequest, CreateBookResponse>('CreateBook', protoReq);
      if (!res.book) {
        throw new Error('Book not found in response');
      }
      return protoBookToAppBook(res.book);
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async updateBook(
    request: Omit<UpdateBookRequest, 'status'> & { status?: AppBookStatus },
  ): Promise<AppBook> {
    try {
      const protoReq: UpdateBookRequest = {
        ...request,
        status: request.status ? appStatusToProtoStatus(request.status) : undefined,
      };
      const res = await rpc<UpdateBookRequest, UpdateBookResponse>('UpdateBook', protoReq);
      if (!res.book) {
        throw new Error('Book not found in response');
      }
      return protoBookToAppBook(res.book);
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async deleteBook(id: string): Promise<boolean> {
    try {
      const res = await rpc<DeleteBookRequest, DeleteBookResponse>('DeleteBook', { id });
      return res.success;
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async updateBookStatus(id: string, status: AppBookStatus): Promise<AppBook> {
    try {
      const res = await rpc<UpdateBookStatusRequest, UpdateBookStatusResponse>(
        'UpdateBookStatus',
        { id, status: appStatusToProtoStatus(status) },
      );
      if (!res.book) {
        throw new Error('Book not found in response');
      }
      return protoBookToAppBook(res.book);
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },
};
