import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/generated/proto/tsundoku/auth/v1/types';
import { GRPC_BACKEND_URL } from './index';
import { grpcToTrpcError } from './errors';

async function rpc<TReq, TRes>(method: string, request: TReq): Promise<TRes> {
  const url = `${GRPC_BACKEND_URL}/tsundoku.auth.v1.AuthService/${method}`;
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

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user?: { id: string; email: string; name: string };
}

export const authClient = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await rpc<LoginRequest, LoginResponse>('Login', { email, password });
      return {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
        user: res.user,
      };
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async register(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      const res = await rpc<RegisterRequest, RegisterResponse>('Register', {
        email,
        password,
        name,
      });
      return {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
        user: res.user,
      };
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const res = await rpc<RefreshTokenRequest, RefreshTokenResponse>('RefreshToken', {
        refreshToken,
      });
      return {
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        expiresIn: res.expiresIn,
      };
    } catch (err) {
      throw grpcToTrpcError(err);
    }
  },
};
