import { ConnectError, Code } from '@connectrpc/connect';
import { TRPCError } from '@trpc/server';

type TRPCErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'BAD_REQUEST'
  | 'FORBIDDEN'
  | 'INTERNAL_SERVER_ERROR'
  | 'TIMEOUT'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS';

const GRPC_TO_TRPC_CODE: Record<number, TRPCErrorCode> = {
  [Code.NotFound]: 'NOT_FOUND',
  [Code.Unauthenticated]: 'UNAUTHORIZED',
  [Code.InvalidArgument]: 'BAD_REQUEST',
  [Code.PermissionDenied]: 'FORBIDDEN',
  [Code.Internal]: 'INTERNAL_SERVER_ERROR',
  [Code.DeadlineExceeded]: 'TIMEOUT',
  [Code.AlreadyExists]: 'CONFLICT',
  [Code.ResourceExhausted]: 'TOO_MANY_REQUESTS',
  [Code.Unavailable]: 'INTERNAL_SERVER_ERROR',
  [Code.FailedPrecondition]: 'BAD_REQUEST',
  [Code.Unimplemented]: 'INTERNAL_SERVER_ERROR',
};

/**
 * Convert a gRPC/Connect error to a TRPCError.
 * Falls back to INTERNAL_SERVER_ERROR for unmapped codes.
 */
export function grpcToTrpcError(err: unknown): TRPCError {
  if (err instanceof ConnectError) {
    const code = GRPC_TO_TRPC_CODE[err.code] ?? 'INTERNAL_SERVER_ERROR';
    return new TRPCError({
      code,
      message: err.message,
      cause: err,
    });
  }

  if (err instanceof Error) {
    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message,
      cause: err,
    });
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Unknown gRPC error',
  });
}
