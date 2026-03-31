import { createConnectTransport } from '@connectrpc/connect-node';

export const GRPC_BACKEND_URL = process.env.GRPC_BACKEND_URL || 'http://localhost:50051';

/**
 * Connect transport with auth interceptor.
 * Injects Authorization header from GRPC_SERVICE_TOKEN env var
 * (service-to-service authentication between Next.js and Go backend).
 */
export const grpcTransport = createConnectTransport({
  baseUrl: GRPC_BACKEND_URL,
  httpVersion: '2',
  interceptors: [
    (next) => async (req) => {
      const token = getServiceToken();
      if (token) {
        req.header.set('Authorization', `Bearer ${token}`);
      }
      return next(req);
    },
  ],
});

/**
 * Get the service token for gRPC backend authentication.
 * Priority: GRPC_SERVICE_TOKEN env var (static service token).
 */
function getServiceToken(): string | null {
  return process.env.GRPC_SERVICE_TOKEN ?? null;
}

/**
 * Shared authenticated RPC helper for Connect JSON transcoding.
 * Injects Authorization header on every request.
 * Use `authenticated: false` to skip auth (login/register endpoints).
 */
export async function grpcRpc<TReq, TRes>(
  service: string,
  method: string,
  request: TReq,
  options?: { token?: string; authenticated?: boolean },
): Promise<TRes> {
  const url = `${GRPC_BACKEND_URL}/${service}/${method}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (options?.authenticated !== false) {
    const token = options?.token ?? getServiceToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`gRPC ${method} failed: ${res.status} ${body}`);
  }

  return res.json() as Promise<TRes>;
}

export { bookClient } from './book-client';
export { authClient } from './auth-client';
export { grpcToTrpcError } from './errors';
export { protoBookToAppBook, appStatusToProtoStatus } from './converters';
export type { AppBook, AppBookStatus } from './converters';
