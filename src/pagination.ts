import type { ListOpts } from './types';

export type Page<T> = {
  items: T[];
  total: number;
};

export type PageFetcher<T> = (offset: number, limit: number) => Promise<Page<T>>;

/**
 * A list endpoint that's both directly callable for one page and
 * exposes `.all()` to async-iterate every page transparently.
 *
 * @example
 * const firstPage = await luna.trophyTitles({ limit: 50 });
 * for await (const title of luna.trophyTitles.all()) {
 *   console.log(title.name);
 * }
 */
export type Listable<T> = {
  /** Fetch a single page. */
  (opts?: ListOpts): Promise<T[]>;
  /** Async-iterate every page until exhausted. */
  all(): AsyncIterable<T>;
};

export function listable<T>(
  list: (opts?: ListOpts) => Promise<T[]>,
  iter: () => AsyncIterable<T>,
): Listable<T> {
  return Object.assign(list, { all: iter });
}

export async function* paginate<T>(
  fetcher: PageFetcher<T>,
  pageSize = 100,
): AsyncIterable<T> {
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;
  while (offset < total) {
    const page = await fetcher(offset, pageSize);
    total = page.total;
    if (page.items.length === 0) break;
    for (const item of page.items) yield item;
    offset += page.items.length;
  }
}
