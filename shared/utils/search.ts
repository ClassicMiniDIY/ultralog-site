import type { SearchEntry } from '../types/site'

// Docs search over the prerendered section index (/api/search-index.json). The index is a few
// hundred sections, so a linear scan is fast enough and needs no library or second index format.

export interface PreparedEntry extends SearchEntry {
  /** Folded copies of the searchable fields, computed once when the index loads. */
  folded: { page: string; heading: string; text: string; headingKey: string }
}

export interface SearchResult {
  entry: PreparedEntry
  score: number
}

export interface Segment {
  text: string
  hit: boolean
}

const WORD_CHAR = /[\p{L}\p{N}]/u

// Final sigma folds to sigma, so a query typed with `ς` matches `Σ` and `σ`.
const foldChar = (c: string) => c.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace('ς', 'σ')

/**
 * Case- and accent-folded: `Lambda Delay` and `lámbda delay` both become `lambda delay`.
 * Folded one code point at a time, so it always agrees with foldWithMap (a whole-string
 * fold differs for final sigma, for one).
 */
export function fold(s: string): string {
  let out = ''
  for (const c of s) out += foldChar(c)
  return out
}

/**
 * fold(s), plus where each folded char came from: `start[j]` and `end[j]` bound the source code
 * point of folded char j, so a match that ends inside an expansion (`ﬁ` -> `fi`) still maps to it.
 */
function foldWithMap(s: string): { folded: string; start: number[]; end: number[] } {
  let folded = ''
  const start: number[] = []
  const end: number[] = []
  let i = 0
  for (const c of s) {
    const f = foldChar(c)
    for (let k = 0; k < f.length; k++) {
      start.push(i)
      end.push(i + c.length)
    }
    folded += f
    i += c.length
  }
  return { folded, start, end }
}

/** Query terms: folded, split on anything that is not a letter or digit, deduplicated. */
export function queryTerms(query: string): string[] {
  return [...new Set(fold(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean))]
}

export function prepare(entries: SearchEntry[]): PreparedEntry[] {
  return entries.map((e) => ({
    ...e,
    folded: {
      page: fold(e.page),
      heading: fold(e.heading ?? ''),
      text: fold(e.text),
      headingKey: queryTerms(e.heading ?? '').join(' '),
    },
  }))
}

const isWordStart = (s: string, i: number) => i === 0 || !WORD_CHAR.test(s[i - 1]!)

// Terms of one or two chars match only at a word start: otherwise `e` in `cmd e` matches nearly
// every section and stops filtering.
const SHORT = 2
const counts = (s: string, i: number, term: string) => term.length > SHORT || isWordStart(s, i)

/** `whole` if some occurrence of `term` starts a word, `part` for a mid-word match, else 0. */
function fieldScore(field: string, term: string, whole: number, part: number): number {
  let i = field.indexOf(term)
  if (i < 0) return 0
  while (i >= 0) {
    if (isWordStart(field, i)) return whole
    i = field.indexOf(term, i + 1)
  }
  return term.length > SHORT ? part : 0
}

/** Body score: one point per occurrence plus one per word-start occurrence, capped at `cap` occurrences. */
function bodyScore(text: string, term: string, cap = 5): number {
  let score = 0
  let n = 0
  for (let i = text.indexOf(term); i >= 0 && n < cap; i = text.indexOf(term, i + term.length)) {
    if (!counts(text, i, term)) continue
    score += isWordStart(text, i) ? 2 : 1
    n++
  }
  return score
}

/**
 * Every term must match somewhere (AND). The heading counts most, then the page title, then the
 * body. A heading that is the query (or starts with it) and the whole query as one phrase in the
 * body add bonuses. Ties keep index (wiki) order.
 */
export function search(entries: PreparedEntry[], query: string, limit = 8): SearchResult[] {
  const terms = queryTerms(query)
  if (!terms.length) return []
  const phrase = terms.length > 1 ? fold(query).trim().replace(/\s+/g, ' ') : ''
  const key = terms.join(' ')
  const results: SearchResult[] = []
  for (const entry of entries) {
    const f = entry.folded
    let score = 0
    for (const t of terms) {
      const s = fieldScore(f.heading, t, 10, 6) + fieldScore(f.page, t, 5, 3) + bodyScore(f.text, t)
      if (!s) {
        score = 0
        break
      }
      score += s
    }
    if (!score) continue
    if (phrase && f.text.includes(phrase)) score += 6
    if (f.headingKey === key) score += 40
    else if (f.headingKey.startsWith(`${key} `)) score += 10
    results.push({ entry, score })
  }
  // Array.prototype.sort is stable, so equal scores stay in index order.
  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

/**
 * A short excerpt of `text` around the first matched term, split into plain and matched
 * segments for rendering with <mark>. Falls back to the start of the text when only the
 * heading or title matched. Rendered as text, never as HTML.
 */
export function snippet(text: string, query: string, length = 160): Segment[] {
  const terms = queryTerms(query)
  const { folded, start: from, end: to } = foldWithMap(text)
  const firstHit = (t: string) => {
    for (let i = folded.indexOf(t); i >= 0; i = folded.indexOf(t, i + 1)) if (counts(folded, i, t)) return i
    return -1
  }
  const first = Math.min(...terms.map(firstHit).filter((i) => i >= 0))
  const anchor = Number.isFinite(first) ? from[first]! : 0

  let start = Math.max(0, anchor - Math.floor(length / 3))
  if (start > 0) {
    const space = text.indexOf(' ', start)
    start = space >= 0 && space < anchor ? space + 1 : start
  }
  let end = Math.min(text.length, start + length)
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end)
    end = space > anchor ? space : end
  }

  // Matched ranges inside the window, in original-text offsets, merged where they overlap.
  const ranges: [number, number][] = []
  for (const t of terms) {
    for (let i = folded.indexOf(t); i >= 0; i = folded.indexOf(t, i + t.length)) {
      if (!counts(folded, i, t)) continue
      const a = from[i]!
      const b = to[i + t.length - 1]!
      if (b > start && a < end) ranges.push([Math.max(a, start), Math.min(b, end)])
    }
  }
  ranges.sort((x, y) => x[0] - y[0])
  const merged: [number, number][] = []
  for (const r of ranges) {
    const last = merged.at(-1)
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1])
    else merged.push([...r])
  }

  const out: Segment[] = []
  const push = (s: string, hit: boolean) => s && out.push({ text: s, hit })
  if (start > 0) push('…', false)
  let at = start
  for (const [a, b] of merged) {
    push(text.slice(at, a), false)
    push(text.slice(a, b), true)
    at = b
  }
  push(text.slice(at, end), false)
  if (end < text.length) push('…', false)
  return out
}
