import { NextResponse } from "next/server";
import { Sentry } from "@/shared/lib/sentry";

export async function GET() {
  const error = new Error("Sentry test error");
  Sentry.captureException(error);
  return NextResponse.json(
    { error: "Test error sent to Sentry", timestamp: new Date().toISOString() },
    { status: 500 }
  );
}
