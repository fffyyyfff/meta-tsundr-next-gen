/**
 * Hand-written proto types for tsundoku.book.v1 package.
 * Replace with buf-generated code once `npm run proto:gen` works.
 */

// --- Enums ---

export const BookStatus = {
  UNSPECIFIED: 0,
  UNREAD: 1,
  READING: 2,
  FINISHED: 3,
} as const;

export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus];

// --- Timestamp (google.protobuf.Timestamp compatible) ---

export interface Timestamp {
  seconds: bigint;
  nanos: number;
}

// --- Messages ---

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  imageUrl: string;
  notes: string;
  rating: number;
  startedAt?: Timestamp;
  finishedAt?: Timestamp;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  deletedAt?: Timestamp;
}

// --- Request / Response ---

export interface ListBooksRequest {
  status?: BookStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  cursor?: string;
}

export interface ListBooksResponse {
  books: Book[];
  nextCursor: string;
}

export interface GetBookRequest {
  id: string;
}

export interface GetBookResponse {
  book?: Book;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  status?: BookStatus;
  imageUrl?: string;
  notes?: string;
  rating?: number;
}

export interface CreateBookResponse {
  book?: Book;
}

export interface UpdateBookRequest {
  id: string;
  title?: string;
  author?: string;
  isbn?: string;
  status?: BookStatus;
  imageUrl?: string;
  notes?: string;
  rating?: number;
}

export interface UpdateBookResponse {
  book?: Book;
}

export interface DeleteBookRequest {
  id: string;
}

export interface DeleteBookResponse {
  success: boolean;
}

export interface UpdateBookStatusRequest {
  id: string;
  status: BookStatus;
}

export interface UpdateBookStatusResponse {
  book?: Book;
}
