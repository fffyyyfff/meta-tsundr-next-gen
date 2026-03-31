import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getOAuth2Config } from '@/server/middleware/auth';
import { authService } from '@/server/middleware/auth';
import { authClient } from '@/server/grpc-client';
import { prisma } from '@/lib/prisma';

function parseAction(params: string[]): { action: string; provider: string } | null {
  if (params.length === 2) {
    return { action: params[0], provider: params[1] };
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ action: string[] }> },
) {
  const { action: segments } = await params;
  const parsed = parseAction(segments);

  if (!parsed) {
    return NextResponse.json({ error: 'Invalid auth route' }, { status: 400 });
  }

  const { action, provider } = parsed;

  if (provider !== 'github') {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  if (action === 'login') {
    return handleLogin(request);
  }

  if (action === 'callback') {
    return handleCallback(request);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

function handleLogin(request: NextRequest): NextResponse {
  const config = getOAuth2Config('github');
  if (!config) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured' },
      { status: 500 },
    );
  }

  const state = crypto.randomBytes(32).toString('hex');

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', config.redirectUri);
  authUrl.searchParams.set('scope', config.scopes.join(' '));
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}

async function handleCallback(request: NextRequest): Promise<NextResponse> {
  const config = getOAuth2Config('github');
  if (!config) {
    return NextResponse.json(
      { error: 'GitHub OAuth is not configured' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.json(
      { error: 'Invalid OAuth callback: state mismatch or missing code' },
      { status: 400 },
    );
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    error?: string;
  };

  if (!tokenData.access_token) {
    return NextResponse.json(
      { error: 'Failed to exchange code for token' },
      { status: 400 },
    );
  }

  // Fetch GitHub user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const githubUser = (await userResponse.json()) as {
    id: number;
    login: string;
    email: string | null;
    name: string | null;
  };

  // Fetch primary email if not public
  let email = githubUser.email;
  if (!email) {
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const emails = (await emailsResponse.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primaryEmail = emails.find((e) => e.primary && e.verified);
    email = primaryEmail?.email ?? emails[0]?.email ?? null;
  }

  if (!email) {
    return NextResponse.json(
      { error: 'Could not retrieve email from GitHub' },
      { status: 400 },
    );
  }

  // Register/login via gRPC AuthService (Go backend)
  // Falls back to local Prisma if gRPC backend is unavailable
  let userId: string;
  let userName: string | null;
  let userEmail: string;

  try {
    const grpcResult = await authClient.register(
      email,
      // OAuth users don't use password login; generate a cryptographically random
      // placeholder so the account cannot be accessed via password authentication.
      crypto.randomBytes(32).toString('base64url'),
      githubUser.name ?? githubUser.login,
    );
    userId = grpcResult.user?.id ?? '';
    userName = grpcResult.user?.name ?? githubUser.name;
    userEmail = grpcResult.user?.email ?? email;
  } catch {
    // gRPC backend unavailable — fallback to local Prisma upsert
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: githubUser.name ?? githubUser.login },
      create: {
        email,
        name: githubUser.name ?? githubUser.login,
      },
    });
    userId = user.id;
    userName = user.name;
    userEmail = user.email;
  }

  if (!userId) {
    return NextResponse.json(
      { error: 'Failed to create or find user' },
      { status: 500 },
    );
  }

  // Generate JWT (local — Next.js remains the JWT issuer)
  const token = authService.generateDevToken(userId, userEmail);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = NextResponse.redirect(appUrl);

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
    path: '/',
  });

  response.cookies.set(
    'user_info',
    JSON.stringify({ id: userId, email: userEmail, name: userName }),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    },
  );

  response.cookies.delete('oauth_state');

  return response;
}
