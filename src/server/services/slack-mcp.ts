const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  accessory?: { type: string; image_url: string; alt_text: string };
  elements?: Array<{ type: string; text: string; emoji?: boolean }>;
  fields?: Array<{ type: string; text: string }>;
}

interface SlackMessage {
  text: string;
  blocks?: Array<SlackBlock | Record<string, unknown>>;
}

export async function sendNotification(
  channel: string,
  message: SlackMessage
): Promise<boolean> {
  const webhookUrl = SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel,
        ...message,
      }),
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function isSlackConfigured(): boolean {
  return !!SLACK_WEBHOOK_URL;
}
