import { Marked, type Tokens } from 'marked'

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Absolute http(s)/mailto URL for `href` resolved against `baseUrl`, or null if it is anything else. */
export function resolveHref(href: string, baseUrl: string): string | null {
  try {
    const url = new URL(href, baseUrl)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens (github-slugger). */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
    .replace(/ /g, '-')
}

export interface Heading {
  level: number
  id: string
  text: string
}

export interface MarkdownOptions {
  /** Where the source lives on GitHub; relative links resolve against it. */
  baseUrl: string
  /** Levels to move headings by (clamped to h2-h6). */
  headingShift?: number
  /**
   * Maps a source href to a page on this site (`/docs/user-guide#exporting`), or null to resolve it
   * against `baseUrl`. Only return paths the build prerenders, or the crawler fails the build.
   */
  rewriteHref?: (href: string) => string | null
  /** `alt` (default) renders an image as its alt text; `img` keeps https images, lazy-loaded. */
  images?: 'alt' | 'img'
  /** Give headings GitHub-style ids and record them (for a table of contents). */
  headings?: Heading[]
}

/**
 * Markdown → HTML for content this site did not write (release bodies, wiki pages), safe for
 * `v-html`: raw HTML is dropped, image alt text is escaped, and every link either maps to a page
 * on this site through `rewriteHref` or resolves against `baseUrl` and is kept only if it is
 * http(s) or mailto. Resolving also keeps unknown relative links away from the prerender crawler.
 */
export function createMarkdown(options: MarkdownOptions) {
  const shift = options.headingShift ?? 0
  const headings = options.headings
  const seen = new Map<string, number>()

  return new Marked({
    gfm: true,
    hooks: {
      preprocess(md) {
        seen.clear()
        headings?.splice(0)
        return md
      },
    },
    renderer: {
      html() {
        return ''
      },
      heading({ tokens, depth }: Tokens.Heading) {
        const level = Math.min(6, Math.max(2, depth + shift))
        const inner = this.parser.parseInline(tokens)
        if (!headings) return `<h${level}>${inner}</h${level}>\n`
        const text = this.parser.parseInline(tokens, this.parser.textRenderer)
        const base = slugify(text) || 'section'
        const n = seen.get(base) ?? 0
        seen.set(base, n + 1)
        const id = n ? `${base}-${n}` : base
        headings.push({ level, id, text })
        return `<h${level} id="${escapeHtml(id)}">${inner}</h${level}>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens)
        const url = options.rewriteHref?.(href) ?? resolveHref(href, options.baseUrl)
        if (!url) return text
        const t = title ? ` title="${escapeHtml(title)}"` : ''
        const rel = /^https?:/i.test(url) ? ' rel="noopener"' : ''
        return `<a href="${escapeHtml(url)}"${t}${rel}>${text}</a>`
      },
      image({ href, text }: Tokens.Image) {
        // `text` is raw source, so it is always escaped.
        const alt = escapeHtml(text)
        if (options.images !== 'img') return alt
        const url = resolveHref(href, options.baseUrl)
        if (!url?.startsWith('https:')) return alt
        return `<img src="${escapeHtml(url)}" alt="${alt}" loading="lazy" decoding="async">`
      },
    },
  })
}
