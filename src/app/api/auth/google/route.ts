import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl, getTokensFromCode, isConfigured } from '@/server/services/gmail-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // Step 1: No code → redirect to Google OAuth
  if (!code) {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' },
        { status: 500 },
      );
    }
    return NextResponse.redirect(getAuthUrl());
  }

  // Step 2: Callback with code → exchange for tokens
  try {
    const tokens = await getTokensFromCode(code);

    if (!tokens.access_token) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }

    const userId = 'dev-user';

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@localhost` },
    });

    // Save Gmail connection
    await prisma.gmailConnection.upsert({
      where: { userId },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? undefined,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    // Redirect back to purchases page
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/purchases`);
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.json(
      { error: 'OAuth callback failed' },
      { status: 500 },
    );
  }
}
