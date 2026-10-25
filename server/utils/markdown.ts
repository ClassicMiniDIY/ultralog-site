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

/**
 * Markdown → HTML for content this site did not write (release bodies, wiki sections), safe for
 * `v-html`: raw HTML is dropped, images become their escaped alt text, and every link is resolved
 * against `baseUrl` (where the source lives on GitHub) and kept only if it is http(s) or mailto.
 * Resolving also keeps site-relative links out of the prerender crawler. Headings move by
 * `headingShift` levels (clamped to h2-h6).
 */
export function createMarkdown(options: { baseUrl: string; headingShift?: number }) {
  const shift = options.headingShift ?? 0
  return new Marked({
    gfm: true,
    renderer: {
      html() {
        return ''
      },
      heading({ tokens, depth }: Tokens.Heading) {
        const level = Math.min(6, Math.max(2, depth + shift))
        return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const text = this.parser.parseInline(tokens)
        const url = resolveHref(href, options.baseUrl)
        if (!url) return text
        const t = title ? ` title="${escapeHtml(title)}"` : ''
        return `<a href="${escapeHtml(url)}"${t} rel="noopener">${text}</a>`
      },
      image({ text }: Tokens.Image) {
        // Hosted elsewhere and unsized; keep the alt text. `text` is raw source, so escape it.
        return escapeHtml(text)
      },
    },
  })
}
