import { searchByIsbn as rakutenSearchByIsbn } from './rakuten-books';

interface OpenLibraryBook {
  title?: string;
  authors?: Array<{ name: string }>;
  cover?: { small?: string; medium?: string; large?: string };
}

export interface IsbnLookupResult {
  title: string;
  author: string;
  imageUrl: string | null;
}

export async function lookupByIsbn(isbn: string): Promise<IsbnLookupResult | null> {
  // Try Rakuten Books API first (better for Japanese books)
  const rakutenResult = await rakutenSearchByIsbn(isbn);
  if (rakutenResult) {
    return {
      title: rakutenResult.title,
      author: rakutenResult.author,
      imageUrl: rakutenResult.imageUrl,
    };
  }

  // Fallback to Open Library API
  return lookupByIsbnOpenLibrary(isbn);
}

async function lookupByIsbnOpenLibrary(isbn: string): Promise<IsbnLookupResult | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${encodeURIComponent(isbn)}&format=json&jscmd=data`;
    const response = await fetch(url);

    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, OpenLibraryBook>;
    const entry = data[`ISBN:${isbn}`];

    if (!entry?.title) return null;

    return {
      title: entry.title,
      author: entry.authors?.[0]?.name ?? '',
      imageUrl: entry.cover?.medium ?? entry.cover?.small ?? null,
    };
  } catch {
    return null;
  }
}
