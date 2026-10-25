import { Marked, type Tokens } from 'marked'

const SAFE_HREF = /^(https?:|mailto:|\/|#)/i

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * Markdown → HTML for content we did not write on this site (release bodies, wiki sections).
 * Raw HTML in the source is dropped, links are limited to http(s)/mailto/relative, and headings
 * move by `headingShift` levels (clamped to h2-h6).
 */
export function createMarkdown(options: { headingShift?: number } = {}) {
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
        if (!SAFE_HREF.test(href)) return text
        const external = /^https?:/i.test(href)
        const t = title ? ` title="${escapeAttr(title)}"` : ''
        const rel = external ? ' rel="noopener"' : ''
        return `<a href="${escapeAttr(href)}"${t}${rel}>${text}</a>`
      },
      image({ text }: Tokens.Image) {
        // Release notes and wiki images are hosted elsewhere and carry no size; keep the alt text only.
        return text
      },
    },
  })
}
