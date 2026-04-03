import { NextRequest, NextResponse } from "next/server";
import {
  getAuthUrl,
  getTokensFromCode,
  isConfigured,
} from "@/server/services/gmail-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    if (!isConfigured()) {
      return NextResponse.json(
        { error: "Google OAuth not configured" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(getAuthUrl());
  }

  const tokens = await getTokensFromCode(code);
  const userId = "dev-user";

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@localhost` },
  });

  await prisma.gmailConnection.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
    create: {
      userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || undefined,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    },
  });

  return NextResponse.redirect(new URL("/purchases", req.url));
}
