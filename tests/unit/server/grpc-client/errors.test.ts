import { describe, test, expect } from 'vitest';
import { ConnectError, Code } from '@connectrpc/connect';
import { grpcToTrpcError } from '@/server/grpc-client/errors';

describe('grpcToTrpcError', () => {
  test('maps ConnectError NOT_FOUND to TRPCError NOT_FOUND', () => {
    const err = new ConnectError('not found', Code.NotFound);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('NOT_FOUND');
    expect(trpcErr.message).toContain('not found');
  });

  test('maps ConnectError UNAUTHENTICATED to TRPCError UNAUTHORIZED', () => {
    const err = new ConnectError('unauthenticated', Code.Unauthenticated);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('UNAUTHORIZED');
  });

  test('maps ConnectError INVALID_ARGUMENT to TRPCError BAD_REQUEST', () => {
    const err = new ConnectError('bad input', Code.InvalidArgument);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('BAD_REQUEST');
  });

  test('maps ConnectError PERMISSION_DENIED to TRPCError FORBIDDEN', () => {
    const err = new ConnectError('forbidden', Code.PermissionDenied);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('FORBIDDEN');
  });

  test('maps ConnectError INTERNAL to INTERNAL_SERVER_ERROR', () => {
    const err = new ConnectError('internal', Code.Internal);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('maps unknown ConnectError code to INTERNAL_SERVER_ERROR', () => {
    const err = new ConnectError('cancelled', Code.Canceled);
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('maps plain Error to INTERNAL_SERVER_ERROR', () => {
    const err = new Error('network failure');
    const trpcErr = grpcToTrpcError(err);
    expect(trpcErr.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcErr.message).toBe('network failure');
  });

  test('maps non-Error to INTERNAL_SERVER_ERROR', () => {
    const trpcErr = grpcToTrpcError('string error');
    expect(trpcErr.code).toBe('INTERNAL_SERVER_ERROR');
    expect(trpcErr.message).toBe('Unknown gRPC error');
  });
});
