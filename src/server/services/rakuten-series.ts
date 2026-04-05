import { searchByTitle, type RakutenBookItem } from './rakuten-books';

interface SeriesVolume {
  number: number;
  title: string;
  isbn: string;
  imageUrl: string | null;
  salesDate: string;
}

interface SeriesResult {
  seriesName: string;
  author: string;
  publisher: string;
  totalVolumes: number;
  volumes: SeriesVolume[];
}

function extractVolumeNumber(title: string): number | null {
  const patterns = [
    /第(\d+)巻/,
    /(\d+)巻/,
    /（(\d+)）$/,
    /\((\d+)\)$/,
    /\s(\d+)$/,
    /(\d+)$/,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function stripVolumeNumber(title: string): string {
  return title
    .replace(/\s*第\d+巻/, '')
    .replace(/\s*\d+巻/, '')
    .replace(/\s*（\d+）$/, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/\s+\d+$/, '')
    .replace(/\s*\d+$/, '')
    .trim();
}

export async function searchSeries(title: string): Promise<SeriesResult[]> {
  const results: RakutenBookItem[] = await searchByTitle(title, 30);

  const seriesMap = new Map<
    string,
    {
      author: string;
      publisher: string;
      volumes: SeriesVolume[];
    }
  >();

  for (const book of results) {
    const volNum = extractVolumeNumber(book.title);
    const seriesKey = volNum !== null ? stripVolumeNumber(book.title) : book.title;
    const key = `${seriesKey}|||${book.author}`;

    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        author: book.author,
        publisher: book.publisher,
        volumes: [],
      });
    }

    const entry = seriesMap.get(key)!;
    entry.volumes.push({
      number: volNum ?? 1,
      title: book.title,
      isbn: book.isbn,
      imageUrl: book.imageUrl,
      salesDate: book.salesDate,
    });
  }

  const seriesResults: SeriesResult[] = [];
  for (const [key, data] of seriesMap) {
    const seriesName = key.split('|||')[0];
    data.volumes.sort((a, b) => a.number - b.number);

    // Deduplicate by volume number
    const seen = new Set<number>();
    const uniqueVolumes = data.volumes.filter((v) => {
      if (seen.has(v.number)) return false;
      seen.add(v.number);
      return true;
    });

    if (uniqueVolumes.length >= 2) {
      seriesResults.push({
        seriesName,
        author: data.author,
        publisher: data.publisher,
        totalVolumes: uniqueVolumes.length,
        volumes: uniqueVolumes,
      });
    }
  }

  seriesResults.sort((a, b) => b.totalVolumes - a.totalVolumes);

  return seriesResults;
}
