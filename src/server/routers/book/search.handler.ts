import { z } from 'zod';
import { lookupByIsbn } from '../../services/isbn-lookup';
import { searchByTitle } from '../../services/rakuten-books';
import type { bookLookupIsbnInput, bookSearchExternalInput } from './schemas';

type LookupIsbnInput = z.infer<typeof bookLookupIsbnInput>;
type SearchExternalInput = z.infer<typeof bookSearchExternalInput>;

export async function lookupIsbnHandler({ input }: { input: LookupIsbnInput }) {
  const result = await lookupByIsbn(input.isbn);
  if (!result) return null;
  return {
    title: result.title,
    author: result.author,
    coverUrl: result.imageUrl,
  };
}

export async function searchExternalHandler({ input }: { input: SearchExternalInput }) {
  const results = await searchByTitle(input.title, 10, {
    availability: input.availability,
    sort: input.sort,
  });
  return results.map((r) => ({
    title: r.title,
    author: r.author,
    isbn: r.isbn,
    imageUrl: r.imageUrl,
    publisher: r.publisher,
    description: r.description,
    salesDate: r.salesDate,
    availability: r.availability,
  }));
}
