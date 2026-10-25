/** Decimal megabytes with one decimal, as the DownloadCard reference shows ("18.4 MB"). */
export function formatSize(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

/** ISO date (YYYY-MM-DD) in UTC, so the prerendered value does not depend on the build machine. */
export function formatDate(iso: string): string {
  return iso.slice(0, 10)
}

export function shortSha(sha: string): string {
  return `${sha.slice(0, 12)}…`
}
