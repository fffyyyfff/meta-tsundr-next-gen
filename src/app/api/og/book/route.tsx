import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const STATUS_LABEL: Record<string, string> = {
  UNREAD: '積読',
  READING: '読書中',
  FINISHED: '読了',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let title = 'Unknown Book';
  let author = '';
  let rating = 0;
  let imageUrl = '';
  let status = '';

  try {
    const res = await fetch(
      `${baseUrl}/api/trpc/book.getById?input=${encodeURIComponent(JSON.stringify({ json: { id } }))}`,
    );
    if (res.ok) {
      const data = (await res.json()) as {
        result?: {
          data?: {
            json?: {
              title?: string;
              author?: string;
              rating?: number;
              imageUrl?: string;
              status?: string;
            };
          };
        };
      };
      const book = data.result?.data?.json;
      if (book) {
        title = book.title || 'Unknown Book';
        author = book.author || '';
        rating = book.rating || 0;
        imageUrl = book.imageUrl || '';
        status = book.status || '';
      }
    }
  } catch {
    // Use defaults
  }

  const statusLabel = STATUS_LABEL[status] || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5f8a 50%, #1a4a72 100%)',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Book cover */}
        <div style={{ display: 'flex', flexShrink: 0, marginRight: 50 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              width={200}
              height={300}
              style={{
                borderRadius: 12,
                objectFit: 'cover',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              }}
            />
          ) : (
            <div
              style={{
                width: 200,
                height: 300,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
              }}
            >
              📚
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          {statusLabel && (
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 20,
                padding: '6px 16px',
                fontSize: 18,
                color: 'rgba(255,255,255,0.8)',
                marginBottom: 16,
                alignSelf: 'flex-start',
              }}
            >
              {statusLabel}
            </div>
          )}

          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              marginBottom: 12,
            }}
          >
            {title.length > 40 ? title.slice(0, 40) + '...' : title}
          </div>

          {author && (
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 20,
              }}
            >
              {author}
            </div>
          )}

          {/* Stars */}
          {rating > 0 && (
            <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 28,
                    color: i < rating ? '#fbbf24' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {/* Logo */}
          <div
            style={{
              marginTop: 'auto',
              fontSize: 18,
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            📖 Meta-tsundr
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
