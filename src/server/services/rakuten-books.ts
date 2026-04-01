export interface RakutenBookItem {
  title: string;
  author: string;
  isbn: string;
  imageUrl: string | null;
  publisher: string;
  description: string;
  salesDate: string;
  availability: string;
}

interface RakutenAPIItem {
  Item: {
    title?: string;
    author?: string;
    isbn?: string;
    largeImageUrl?: string;
    mediumImageUrl?: string;
    itemCaption?: string;
    publisherName?: string;
    salesDate?: string;
    availability?: string;
  };
}

interface RakutenAPIResponse {
  Items?: RakutenAPIItem[];
}

function getAppId(): string | null {
  return process.env.RAKUTEN_APP_ID ?? null;
}

function parseItem(raw: RakutenAPIItem): RakutenBookItem {
  const item = raw.Item;
  return {
    title: item.title ?? '',
    author: item.author ?? '',
    isbn: item.isbn ?? '',
    imageUrl: item.largeImageUrl || item.mediumImageUrl || null,
    publisher: item.publisherName ?? '',
    description: item.itemCaption ?? '',
    salesDate: item.salesDate ?? '',
    availability: item.availability ?? '',
  };
}

export async function searchByIsbn(isbn: string): Promise<RakutenBookItem | null> {
  const appId = getAppId();
  if (!appId) return null;

  try {
    const url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&isbn=${encodeURIComponent(isbn)}&applicationId=${encodeURIComponent(appId)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = (await response.json()) as RakutenAPIResponse;
    const first = data.Items?.[0];
    if (!first) return null;

    return parseItem(first);
  } catch {
    return null;
  }
}

export async function searchByTitle(
  title: string,
  hits = 10,
  options?: { availability?: string; sort?: string },
): Promise<RakutenBookItem[]> {
  const appId = getAppId();
  if (!appId) return [];

  try {
    const sort = options?.sort ?? '-releaseDate';
    let url = `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&title=${encodeURIComponent(title)}&hits=${hits}&sort=${encodeURIComponent(sort)}&applicationId=${encodeURIComponent(appId)}`;
    if (options?.availability) {
      url += `&availability=${encodeURIComponent(options.availability)}`;
    }
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as RakutenAPIResponse;
    return (data.Items ?? []).map(parseItem);
  } catch {
    return [];
  }
}
