import { searchSeries } from '../../services/rakuten-series';

export async function seriesSearchHandler({ input }: { input: { title: string } }) {
  return searchSeries(input.title);
}
