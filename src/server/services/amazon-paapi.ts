// Amazon Product Advertising API 5.0 Service
// Requires: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG
// Falls back gracefully when credentials are not configured

import crypto from 'crypto';

export interface AmazonProductItem {
  title: string;
  creator: string;
  externalId: string; // ASIN
  imageUrl: string | null;
  price: number;
  productUrl: string;
  description: string;
}

function getConfig() {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PARTNER_TAG;

  if (!accessKey || !secretKey || !partnerTag) return null;
  if (accessKey.startsWith('your_')) return null;

  return { accessKey, secretKey, partnerTag };
}

function sign(key: Buffer, msg: string): Buffer {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = sign(Buffer.from('AWS4' + key), dateStamp);
  const kRegion = sign(kDate, region);
  const kService = sign(kRegion, service);
  return sign(kService, 'aws4_request');
}

export async function searchByKeyword(
  keyword: string,
  maxResults = 10,
): Promise<AmazonProductItem[]> {
  const config = getConfig();
  if (!config) return []; // Not configured — caller should fallback to Rakuten

  const host = 'webservices.amazon.co.jp';
  const region = 'us-west-2'; // PA-API uses us-west-2 for all regions
  const service = 'ProductAdvertisingAPI';
  const endpoint = `https://${host}/paapi5/searchitems`;

  const payload = JSON.stringify({
    Keywords: keyword,
    SearchIndex: 'All',
    ItemCount: Math.min(maxResults, 10),
    PartnerTag: config.partnerTag,
    PartnerType: 'Associates',
    Marketplace: 'www.amazon.co.jp',
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.ByLineInfo',
      'Images.Primary.Large',
      'Offers.Listings.Price',
    ],
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    'content-encoding': 'amz-1.0',
    'content-type': 'application/json; charset=utf-8',
    host,
    'x-amz-date': amzDate,
    'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
  };

  // Canonical request
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k]}\n`)
    .join('');
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  const canonicalRequest = [
    'POST',
    '/paapi5/searchitems',
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  // Signature
  const signingKey = getSignatureKey(config.secretKey, dateStamp, region, service);
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: authHeader,
      },
      body: payload,
    });

    if (!response.ok) return []; // API error — fallback to Rakuten

    const data = await response.json();
    const items = data?.SearchResult?.Items;
    if (!Array.isArray(items)) return [];

    return items.map((item: Record<string, unknown>): AmazonProductItem => {
      const info = item.ItemInfo as Record<string, unknown> | undefined;
      const title = (info?.Title as Record<string, string>)?.DisplayValue ?? '';
      const byLine = info?.ByLineInfo as Record<string, unknown> | undefined;
      const brand = (byLine?.Brand as Record<string, string>)?.DisplayValue;
      const manufacturer = (byLine?.Manufacturer as Record<string, string>)?.DisplayValue;
      const creator = brand || manufacturer || '';

      const images = item.Images as Record<string, unknown> | undefined;
      const primaryImage = images?.Primary as Record<string, unknown> | undefined;
      const largeImage = primaryImage?.Large as Record<string, string> | undefined;
      const imageUrl = largeImage?.URL ?? null;

      const offers = item.Offers as Record<string, unknown> | undefined;
      const listings = (offers?.Listings as Array<Record<string, unknown>>) ?? [];
      const priceInfo = listings[0]?.Price as Record<string, unknown> | undefined;
      const price = (priceInfo?.Amount as number) ?? 0;

      return {
        title,
        creator,
        externalId: (item.ASIN as string) ?? '',
        imageUrl,
        price: Math.round(price),
        productUrl: (item.DetailPageURL as string) ?? '',
        description: '',
      };
    });
  } catch {
    return []; // Network error — fallback to Rakuten
  }
}

export async function getByAsin(asin: string): Promise<AmazonProductItem | null> {
  const config = getConfig();
  if (!config) return null;

  // Similar implementation with GetItems operation
  // For now, return null — can be implemented when needed
  return null;
}
