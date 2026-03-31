import { createConnectTransport } from '@connectrpc/connect-node';

// TODO: Import generated service clients after running `npm run proto:gen`
// import { BookService } from '@/generated/proto/book_connect';
// import { AuthService } from '@/generated/proto/auth_connect';
// import { createClient } from '@connectrpc/connect';

const GRPC_BACKEND_URL = process.env.GRPC_BACKEND_URL || 'http://localhost:50051';

/**
 * Connect (gRPC-compatible) transport for server-side communication
 * with the Go backend.
 */
export const grpcTransport = createConnectTransport({
  baseUrl: GRPC_BACKEND_URL,
  httpVersion: '2',
});

// TODO: Uncomment after proto generation
// export const bookServiceClient = createClient(BookService, grpcTransport);
// export const authServiceClient = createClient(AuthService, grpcTransport);

export { GRPC_BACKEND_URL };
