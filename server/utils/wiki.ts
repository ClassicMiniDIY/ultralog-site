import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
// Relative, not #shared: nuxt.config.ts imports this file, and the config's tsconfig has no #shared alias.
import type { DocNavGroup, DocPage } from '../../shared/types/site'
import { createMarkdown, type Heading } from './markdown'

// The GitHub wiki, cloned into .wiki/ by scripts/sync-wiki.ts before every dev run and build.
// WIKI_DIR points at another checkout (e.g. ../UltraLog.wiki to preview unpushed edits).
export const WIKI_BASE = 'https://github.com/ClassicMiniDIY/UltraLog/wiki'
const HOME = 'Home'

export function wikiDir(): string {
  return resolve(process.env.WIKI_DIR ?? '.wiki')
}

export interface WikiFile {
  /** Wiki page name, as in its URL: `Getting-Started`. */
  name: string
  /** Site slug: `getting-started`; empty for Home, which is /docs itself. */
  slug: string
}

export function docsPath(file: WikiFile): string {
  return file.slug ? `/docs/${file.slug}` : '/docs'
}

/** Every wiki page except the `_Sidebar` / `_Footer` partials. Empty when the wiki is not synced. */
export function listWikiFiles(): WikiFile[] {
  const dir = wikiDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => f.slice(0, -3))
    .sort()
    .map((name) => ({ name, slug: name === HOME ? '' : name.toLowerCase() }))
}

export function readWikiFile(name: string): string | null {
  const path = join(wikiDir(), `${name}.md`)
  return existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : null
}

function findFile(page: string): WikiFile | undefined {
  const key = page.replace(/\.md$/i, '').trim().replace(/\s+/g, '-').toLowerCase()
  return listWikiFiles().find((f) => f.name.toLowerCase() === key)
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

const anchor = (hash: string) => (hash.length > 1 ? `#${encodeURIComponent(safeDecode(hash.slice(1)))}` : '')

const WIKI_URL = /^https:\/\/github\.com\/(?:ClassicMiniDIY|SomethingNew71)\/UltraLog\/wiki\/?([^#?]*)(#.*)?$/i

/**
 * A wiki link as a page on this site, or null to leave it to the normal resolver (external URL,
 * or a wiki page this site does not have). Handles `Page`, `Page#anchor`, `#anchor` and full
 * github.com/…/wiki/Page URLs. The path comes from the file list, never from the link text.
 */
export function docsHref(href: string): string | null {
  if (href.startsWith('#')) return anchor(href) || null
  let page: string
  let hash = ''
  const wiki = WIKI_URL.exec(href)
  if (wiki) {
    page = wiki[1] || HOME
    hash = wiki[2] ?? ''
  } else {
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href) || href.startsWith('/')) return null
    const i = href.indexOf('#')
    page = i >= 0 ? href.slice(0, i) : href
    hash = i >= 0 ? href.slice(i) : ''
  }
  const file = findFile(safeDecode(page))
  return file ? `${docsPath(file)}${anchor(hash)}` : null
}

/** `[[Page]]` and `[[Text|Page]]` are GitHub wiki links; turn them into Markdown links. */
export function rewriteWikiLinks(md: string): string {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a: string, b?: string) => {
    const text = b ? a.trim() : a.trim().replace(/-/g, ' ')
    const page = (b ?? a).trim().replace(/\s+/g, '-')
    return `[${text}](${page})`
  })
}

/** Markdown renderer for wiki content: wiki links become /docs pages, everything else resolves on GitHub. */
export function wikiMarkdown(options: { headingShift?: number; headings?: Heading[] } = {}) {
  return createMarkdown({ baseUrl: `${WIKI_BASE}/`, rewriteHref: docsHref, images: 'img', ...options })
}

function titleOf(md: string, name: string): string {
  return /^# (.+)$/m.exec(md)?.[1]?.trim() ?? name.replace(/-/g, ' ')
}

/** One wiki page, rendered. The `# ` title is lifted out for the page hero. */
export function renderWikiPage(file: WikiFile): DocPage | null {
  const md = readWikiFile(file.name)
  if (md === null) return null
  const headings: Heading[] = []
  const body = rewriteWikiLinks(md.replace(/^# .+\n/m, ''))
  const html = wikiMarkdown({ headings }).parse(body) as string
  return {
    slug: file.slug,
    name: file.name,
    title: titleOf(md, file.name),
    html,
    toc: headings.filter((h) => h.level === 2).map(({ id, text }) => ({ id, text })),
    editUrl: `${WIKI_BASE}/${file.name}/_edit`,
    sourceUrl: `${WIKI_BASE}/${file.name}`,
  }
}

/**
 * The docs navigation from the wiki's `_Sidebar`: `### Group` headings and `[[Page]]` items, up to
 * the `---` rule (below it is a block of external links). Pages missing from the sidebar are
 * listed under "More" so nothing is unreachable.
 */
export function wikiNav(): DocNavGroup[] {
  const files = listWikiFiles()
  const sidebar = readWikiFile('_Sidebar') ?? ''
  const groups: DocNavGroup[] = []
  const placed = new Set<string>()
  for (const line of sidebar.split('\n')) {
    if (/^-{3,}\s*$/.test(line)) break
    const group = /^###\s+(.+)$/.exec(line)
    if (group) {
      groups.push({ title: group[1]!.trim(), items: [] })
      continue
    }
    const item = /^\s*[-*]\s+(?:\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\))/.exec(line)
    if (!item || !groups.length) continue
    const page = item[2] ?? item[1] ?? item[4] ?? ''
    const file = findFile(page)
    if (!file || placed.has(file.name)) continue
    placed.add(file.name)
    const md = readWikiFile(file.name) ?? ''
    groups.at(-1)!.items.push({ path: docsPath(file), title: titleOf(md, file.name) })
  }
  const rest = files.filter((f) => f.slug && !placed.has(f.name))
  if (rest.length) {
    groups.push({
      title: 'More',
      items: rest.map((f) => ({ path: docsPath(f), title: titleOf(readWikiFile(f.name) ?? '', f.name) })),
    })
  }
  return groups.filter((g) => g.items.length)
}
