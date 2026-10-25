import type { SearchEntry } from '#shared/types/site'
import { prepare, type PreparedEntry } from '#shared/utils/search'

// One fetch per visit, shared by every search box. Reset on failure so the next focus retries.
let pending: Promise<PreparedEntry[]> | null = null

/** The docs search index, fetched on first use (the search box calls this on focus). */
export function loadSearchIndex(): Promise<PreparedEntry[]> {
  pending ??= $fetch<SearchEntry[]>('/api/search-index.json')
    .then(prepare)
    .catch((err: unknown) => {
      pending = null
      throw err
    })
  return pending
}
