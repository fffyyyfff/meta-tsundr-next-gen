import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '@/generated/proto/tsundoku/auth/v1/types';
import { grpcRpc } from './index';
import { grpcToTrpcError } from './errors';

const SERVICE = 'tsundoku.auth.v1.AuthService';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult extends AuthTokens {
  user?: { id: string; email: string; name: string };
}

/**
 * gRPC auth service client.
 * Auth endpoints (login/register/refresh) are unauthenticated —
 * they do NOT send the service Authorization header.
 */
export const authClient = {
  async login(email: string, password: string): Promise<AuthResult> {
    try {
      const res = await grpcRpc<LoginRequest, LoginResponse>(
        SERVICE, 'Login', { email, password }, { authenticated: false },
      );
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
      const res = await grpcRpc<RegisterRequest, RegisterResponse>(
        SERVICE, 'Register', { email, password, name }, { authenticated: false },
      );
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
      const res = await grpcRpc<RefreshTokenRequest, RefreshTokenResponse>(
        SERVICE, 'RefreshToken', { refreshToken }, { authenticated: false },
      );
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
