import { describe, expect, it } from 'vitest'
import { createMarkdown, resolveHref } from '../server/utils/markdown'

const BASE = 'https://github.com/ClassicMiniDIY/UltraLog/wiki/'
const md = createMarkdown({ baseUrl: BASE })
const render = (src: string) => md.parse(src) as string
const inline = (src: string) => md.parseInline(src) as string

// Output goes into v-html, so no input may produce a live tag or attribute.
const LIVE = /<(?!\/?(?:p|a|strong|em|code|pre|ul|ol|li|h[2-6]|table|thead|tbody|tr|th|td|hr|br|del|blockquote)\b)[a-z]/i

describe('createMarkdown is safe for v-html', () => {
  const payloads = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '![<img src=x onerror=alert(1)>](x.png)',
    '![<script>alert(1)</script>](x)',
    '[![<img src=x onerror=alert(1)>](a.png)](https://example.com)',
    '| a |\n|---|\n| ![<img src=x onerror=alert(1)>](a.png) |',
    '[x](javascript:alert(1))',
    '[x](&#106;avascript:alert(1))',
    '[x](<javascript:alert(1)>)',
    '[x][r]\n\n[r]: javascript:alert(1)',
    '[x](data:text/html,<script>alert(1)</script>)',
    '`<img src=x onerror=alert(1)>`',
    '<!-- comment --> text',
  ]
  for (const p of payloads) {
    it(`neutralizes ${JSON.stringify(p)}`, () => {
      for (const html of [render(p), inline(p)]) {
        expect(html).not.toMatch(LIVE)
        expect(html).not.toMatch(/href="(?:javascript|data):/i)
      }
    })
  }

  it('escapes image alt text instead of dropping it', () => {
    expect(inline('![RPM <b>chart</b>](a.png)')).toBe('RPM &lt;b&gt;chart&lt;/b&gt;')
  })

  it('escapes link titles', () => {
    expect(inline('[x](https://a.test "a\\"b<c")')).toContain('title="a&quot;b&lt;c"')
  })
})

describe('links resolve against the source on GitHub', () => {
  it('turns wiki-relative links into wiki URLs', () => {
    expect(inline('[Computed Channels](User-Guide#computed-channels)')).toBe(
      `<a href="${BASE}User-Guide#computed-channels" rel="noopener">Computed Channels</a>`,
    )
  })

  it('never leaves a site-relative href for the prerender crawler', () => {
    expect(inline('[PR 5](/ClassicMiniDIY/UltraLog/pull/5)')).toContain('href="https://github.com/ClassicMiniDIY/UltraLog/pull/5"')
  })

  it('allows only http, https and mailto', () => {
    expect(resolveHref('mailto:a@b.test', BASE)).toBe('mailto:a@b.test')
    expect(resolveHref('ftp://a.test/x', BASE)).toBeNull()
    expect(resolveHref('javascript:alert(1)', BASE)).toBeNull()
  })
})

describe('headings', () => {
  it('shifts and clamps levels', () => {
    const shifted = createMarkdown({ baseUrl: BASE, headingShift: -1 })
    expect(shifted.parse('### Overview')).toContain('<h2>Overview</h2>')
    expect(shifted.parse('# Top')).toContain('<h2>Top</h2>')
  })
})
