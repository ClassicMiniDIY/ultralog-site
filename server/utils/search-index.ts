import type { SearchEntry } from '../../shared/types/site'
import { docsPath, listWikiFiles, renderWikiPage, type WikiFile } from './wiki'

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

// Tags that end a run of text. Every other tag is inline and joins its neighbours, so
// `<code>cargo build</code>)` stays `cargo build)` and `<strong>un</strong>usual` stays one word.
const BLOCK = /<\/?(?:p|div|li|ul|ol|h[1-6]|pre|blockquote|table|thead|tbody|tr|td|th|br|hr|dt|dd)\b[^>]*>/gi

/** Rendered HTML to plain text: tags dropped, image alt text kept, entities decoded, whitespace collapsed. */
export function htmlToText(html: string): string {
  return html
    .replace(/<img\b[^>]*?\balt="([^"]*)"[^>]*>/gi, ' $1 ')
    .replace(BLOCK, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/\s+/g, ' ')
    .trim()
}

// Headings as renderWikiPage writes them (server/utils/markdown.ts): `<h2 id="...">...</h2>`.
const HEADING = /<h([23]) id="([^"]*)">([\s\S]*?)<\/h\1>/g

/**
 * One page split into sections at its h2 and h3 headings, using the ids the page itself renders,
 * so every result anchor lands on a real heading. h4 and below stay in their parent's text.
 */
export function pageSections(file: WikiFile): SearchEntry[] {
  const page = renderWikiPage(file)
  if (!page) return []
  const base = docsPath(file)
  const matches = [...page.html.matchAll(HEADING)]
  const out: SearchEntry[] = []
  const intro = htmlToText(page.html.slice(0, matches[0]?.index ?? page.html.length))
  if (intro || !matches.length) out.push({ path: base, page: page.title, heading: null, text: intro })
  matches.forEach((m, i) => {
    const bodyStart = m.index + m[0].length
    const bodyEnd = matches[i + 1]?.index ?? page.html.length
    const id = htmlToText(m[2]!)
    out.push({
      path: `${base}#${encodeURIComponent(id)}`,
      page: page.title,
      heading: htmlToText(m[3]!),
      text: htmlToText(page.html.slice(bodyStart, bodyEnd)),
    })
  })
  return out
}

/** Every docs section, Home first, then the other pages in file order. */
export function buildSearchIndex(): SearchEntry[] {
  const files = listWikiFiles().sort((a, b) => Number(!!a.slug) - Number(!!b.slug))
  return files.flatMap(pageSections)
}
