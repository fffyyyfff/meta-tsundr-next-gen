import { createConnectTransport } from '@connectrpc/connect-node';

export const GRPC_BACKEND_URL = process.env.GRPC_BACKEND_URL || 'http://localhost:50051';

/**
 * Connect (gRPC-compatible) transport for server-side communication
 * with the Go backend over HTTP/2.
 */
export const grpcTransport = createConnectTransport({
  baseUrl: GRPC_BACKEND_URL,
  httpVersion: '2',
});

export { bookClient } from './book-client';
export { authClient } from './auth-client';
export { grpcToTrpcError } from './errors';
export { protoBookToAppBook, appStatusToProtoStatus } from './converters';
export type { AppBook, AppBookStatus } from './converters';
