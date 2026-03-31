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
import { grpcRpc } from './index';
import { grpcToTrpcError } from './errors';
import { protoBookToAppBook, appStatusToProtoStatus, type AppBook, type AppBookStatus } from './converters';

const SERVICE = 'tsundoku.book.v1.BookService';

/**
 * Typed gRPC book service client.
 * All requests are authenticated via the shared grpcRpc helper
 * which injects Authorization: Bearer <token>.
 *
 * Optionally pass a per-request token (e.g. the user's JWT)
 * to forward end-user identity to the Go backend.
 */
export const bookClient = {
  async getBooks(
    request: ListBooksRequest,
    token?: string,
  ): Promise<{ books: AppBook[]; nextCursor: string }> {
    try {
      const res = await grpcRpc<ListBooksRequest, ListBooksResponse>(
        SERVICE, 'ListBooks', request, { token },
      );
      return {
        books: (res.books ?? []).map(protoBookToAppBook),
        nextCursor: res.nextCursor ?? '',
      };
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async getBook(id: string, token?: string): Promise<AppBook> {
    try {
      const res = await grpcRpc<GetBookRequest, GetBookResponse>(
        SERVICE, 'GetBook', { id }, { token },
      );
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
    token?: string,
  ): Promise<AppBook> {
    try {
      const protoReq: CreateBookRequest = {
        ...request,
        status: request.status ? appStatusToProtoStatus(request.status) : undefined,
      };
      const res = await grpcRpc<CreateBookRequest, CreateBookResponse>(
        SERVICE, 'CreateBook', protoReq, { token },
      );
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
    token?: string,
  ): Promise<AppBook> {
    try {
      const protoReq: UpdateBookRequest = {
        ...request,
        status: request.status ? appStatusToProtoStatus(request.status) : undefined,
      };
      const res = await grpcRpc<UpdateBookRequest, UpdateBookResponse>(
        SERVICE, 'UpdateBook', protoReq, { token },
      );
      if (!res.book) {
        throw new Error('Book not found in response');
      }
      return protoBookToAppBook(res.book);
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async deleteBook(id: string, token?: string): Promise<boolean> {
    try {
      const res = await grpcRpc<DeleteBookRequest, DeleteBookResponse>(
        SERVICE, 'DeleteBook', { id }, { token },
      );
      return res.success;
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async updateBookStatus(id: string, status: AppBookStatus, token?: string): Promise<AppBook> {
    try {
      const res = await grpcRpc<UpdateBookStatusRequest, UpdateBookStatusResponse>(
        SERVICE, 'UpdateBookStatus',
        { id, status: appStatusToProtoStatus(status) },
        { token },
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
