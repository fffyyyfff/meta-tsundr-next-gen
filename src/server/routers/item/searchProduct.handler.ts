import type { z } from 'zod';
import type { searchProductInput } from './schemas';

type SearchProductInput = z.infer<typeof searchProductInput>;

type ProductResult = {
  title: string;
  creator: string;
  externalId: string;
  imageUrl: string | null;
  price: number;
  productUrl: string;
  description: string;
  source: 'amazon' | 'rakuten';
};

export async function searchProductHandler({ input }: { input: SearchProductInput }): Promise<ProductResult[]> {
  // Amazon を試行
  if (input.source === 'amazon' || input.source === 'auto') {
    try {
      const { searchByKeyword: amazonSearch } = await import('../../services/amazon-paapi');
      const amazonResults = await amazonSearch(input.keyword, 10);
      if (amazonResults.length > 0) {
        return amazonResults.map((r): ProductResult => ({
          title: r.title,
          creator: r.creator,
          externalId: r.externalId,
          imageUrl: r.imageUrl,
          price: r.price,
          productUrl: r.productUrl,
          description: r.description,
          source: 'amazon',
        }));
      }
    } catch {
      // Amazon API unavailable
    }

    // Amazon を明示指定した場合はフォールバックしない
    if (input.source === 'amazon') {
      return [];
    }
  }

  // 楽天（auto のフォールバック or 楽天直接指定）
  if (input.source === 'rakuten' || input.source === 'auto') {
    const { searchByKeyword: rakutenSearch } = await import('../../services/rakuten-ichiba');
    const results = await rakutenSearch(input.keyword, 10);
    return results.map((r): ProductResult => ({
      title: r.title,
      creator: r.creator,
      externalId: r.externalId,
      imageUrl: r.imageUrl,
      price: r.price,
      productUrl: r.productUrl,
      description: r.description,
      source: 'rakuten',
    }));
  }

  return [];
}
