// Rakuten Ichiba (General Product) API Service

export interface RakutenIchibaItem {
  title: string;
  creator: string;
  externalId: string;
  imageUrl: string | null;
  price: number;
  productUrl: string;
  description: string;
}

interface RakutenIchibaAPIItem {
  Item: {
    itemName?: string;
    shopName?: string;
    itemCode?: string;
    mediumImageUrls?: Array<{ imageUrl?: string }>;
    smallImageUrls?: Array<{ imageUrl?: string }>;
    itemPrice?: number;
    itemUrl?: string;
    itemCaption?: string;
  };
}

interface RakutenIchibaAPIResponse {
  Items?: RakutenIchibaAPIItem[];
}

function getAppId(): string | null {
  return process.env.RAKUTEN_APP_ID ?? null;
}

export async function searchByKeyword(
  keyword: string,
  hits = 10,
): Promise<RakutenIchibaItem[]> {
  const appId = getAppId();
  if (!appId) return [];

  try {
    const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601?format=json&keyword=${encodeURIComponent(keyword)}&hits=${hits}&applicationId=${encodeURIComponent(appId)}`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = (await response.json()) as RakutenIchibaAPIResponse;
    if (!data.Items?.length) return [];

    return data.Items.map((raw) => {
      const item = raw.Item;
      return {
        title: item.itemName ?? '',
        creator: item.shopName ?? '',
        externalId: item.itemCode ?? '',
        imageUrl: item.mediumImageUrls?.[0]?.imageUrl || item.smallImageUrls?.[0]?.imageUrl || null,
        price: item.itemPrice ?? 0,
        productUrl: item.itemUrl ?? '',
        description: (item.itemCaption ?? '').slice(0, 200),
      };
    });
  } catch {
    return [];
  }
}
