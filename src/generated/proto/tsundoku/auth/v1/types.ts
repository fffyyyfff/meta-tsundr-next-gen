/**
 * Hand-written proto types for tsundoku.auth.v1 package.
 * Replace with buf-generated code once `npm run proto:gen` works.
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user?: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}
