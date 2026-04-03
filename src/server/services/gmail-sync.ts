import { google } from "googleapis";

interface PurchaseEmail {
  messageId: string;
  from: string;
  subject: string;
  date: string;
  bodyHtml: string;
}

export async function fetchPurchaseEmails(
  accessToken: string,
  lastSyncAt?: Date
): Promise<PurchaseEmail[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  const after = lastSyncAt
    ? Math.floor(lastSyncAt.getTime() / 1000).toString()
    : "";
  const q =
    "(from:auto-confirm@amazon.co.jp OR from:order@rakuten.co.jp)" +
    (after ? ` after:${after}` : "");

  const res = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: 50,
  });

  if (!res.data.messages) return [];

  const emails: PurchaseEmail[] = [];
  for (const msg of res.data.messages.slice(0, 20)) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id!,
      format: "full",
    });
    const headers = detail.data.payload?.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    let body = "";
    const parts = detail.data.payload?.parts || [];
    const htmlPart = parts.find((p) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      body = Buffer.from(htmlPart.body.data, "base64url").toString();
    } else if (detail.data.payload?.body?.data) {
      body = Buffer.from(
        detail.data.payload.body.data,
        "base64url"
      ).toString();
    }

    emails.push({ messageId: msg.id!, from, subject, date, bodyHtml: body });
  }
  return emails;
}
