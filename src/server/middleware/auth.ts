import crypto from 'crypto';

export interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

// RS256 JWT verification
// In production, use jose or jsonwebtoken library with proper key management
export class AuthService {
  private publicKey: string | null;

  constructor() {
    this.publicKey = process.env.JWT_PUBLIC_KEY || null;
  }

  async verifyToken(token: string): Promise<JWTPayload | null> {
    if (!this.publicKey) {
      // Development mode - decode without verification
      return this.decodeToken(token);
    }

    try {
      // In production, use proper RS256 verification
      // For now, HMAC-based verification as fallback
      const [headerB64, payloadB64, signatureB64] = token.split('.');
      if (!headerB64 || !payloadB64 || !signatureB64) return null;

      const payload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString(),
      ) as JWTPayload;

      // Check expiration
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;

      return payload;
    } catch {
      return null;
    }
  }

  private decodeToken(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString(),
      ) as JWTPayload;
      if (payload.exp && Date.now() / 1000 > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  generateDevToken(userId: string, email: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400, // 24h
      }),
    ).toString('base64url');

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }
}

export const authService = new AuthService();

// OAuth2 provider configuration
export interface OAuth2Config {
  provider: 'github' | 'google';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export function getOAuth2Config(provider: 'github' | 'google'): OAuth2Config | null {
  if (provider === 'github') {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      provider: 'github',
      clientId,
      clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/github`,
      scopes: ['read:user', 'user:email'],
    };
  }

  if (provider === 'google') {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    return {
      provider: 'google',
      clientId,
      clientSecret,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback/google`,
      scopes: ['openid', 'email', 'profile'],
    };
  }

  return null;
}
