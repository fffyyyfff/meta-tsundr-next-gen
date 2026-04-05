interface BookData {
  title: string;
  author?: string | null;
  rating?: number | null;
  imageUrl?: string | null;
  finishedAt?: Date | string | null;
}

interface SyncData {
  count: number;
  source: string;
}

interface WeeklyStats {
  booksRead: number;
  totalReadingTime: string;
  currentlyReading: number;
}

export function bookCompletedMessage(book: BookData) {
  const stars = book.rating
    ? "\u2605".repeat(book.rating) + "\u2606".repeat(5 - book.rating)
    : "\u672A\u8A55\u4FA1";

  const finishedDate = book.finishedAt
    ? new Date(book.finishedAt).toLocaleDateString("ja-JP")
    : new Date().toLocaleDateString("ja-JP");

  const blocks: Array<Record<string, unknown>> = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "\uD83D\uDCDA \u8AAD\u4E86\u3057\u307E\u3057\u305F\uFF01",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${book.title}*${book.author ? `\n${book.author}` : ""}`,
      },
      ...(book.imageUrl
        ? {
            accessory: {
              type: "image",
              image_url: book.imageUrl,
              alt_text: book.title,
            },
          }
        : {}),
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*\u8A55\u4FA1:* ${stars}` },
        { type: "mrkdwn", text: `*\u8AAD\u4E86\u65E5:* ${finishedDate}` },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: "\uD83D\uDCD6 _Meta-tsundr_" },
      ],
    },
  ];

  return {
    text: `\uD83D\uDCDA \u300C${book.title}\u300D\u3092\u8AAD\u4E86\u3057\u307E\u3057\u305F\uFF01 ${stars}`,
    blocks,
  };
}

export function purchaseSyncMessage(data: SyncData) {
  return {
    text: `\uD83D\uDED2 ${data.source}\u304B\u3089${data.count}\u4EF6\u306E\u8CFC\u5165\u3092\u540C\u671F\u3057\u307E\u3057\u305F`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\uD83D\uDED2 *${data.source}* \u304B\u3089 *${data.count}\u4EF6* \u306E\u8CFC\u5165\u3092\u540C\u671F\u3057\u307E\u3057\u305F`,
        },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: "\uD83D\uDCD6 _Meta-tsundr_" },
        ],
      },
    ],
  };
}

export function weeklyReportMessage(stats: WeeklyStats) {
  return {
    text: `\uD83D\uDCCA \u9031\u6B21\u8AAD\u66F8\u30EC\u30DD\u30FC\u30C8: ${stats.booksRead}\u518A\u8AAD\u4E86`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "\uD83D\uDCCA \u9031\u6B21\u8AAD\u66F8\u30EC\u30DD\u30FC\u30C8",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*\u4ECA\u9031\u306E\u8AAD\u4E86:* ${stats.booksRead}\u518A`,
          },
          {
            type: "mrkdwn",
            text: `*\u8AAD\u66F8\u6642\u9593:* ${stats.totalReadingTime}`,
          },
          {
            type: "mrkdwn",
            text: `*\u8AAD\u66F8\u4E2D:* ${stats.currentlyReading}\u518A`,
          },
        ],
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: "\uD83D\uDCD6 _Meta-tsundr_" },
        ],
      },
    ],
  };
}
