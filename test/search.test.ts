import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildSearchIndex, htmlToText } from '../server/utils/search-index'
import { fold, prepare, queryTerms, search, snippet } from '../shared/utils/search'
import type { SearchEntry } from '../shared/types/site'

// Read lazily by wikiDir(), so setting it here (before any describe body runs) is enough.
process.env.WIKI_DIR = fileURLToPath(new URL('./fixtures/wiki', import.meta.url))

const ENTRIES: SearchEntry[] = [
  { path: '/docs', page: 'UltraLog', heading: null, text: 'A fast log viewer for ECU logs.' },
  { path: '/docs/user-guide#exporting', page: 'User Guide', heading: 'Exporting', text: 'Export the chart as PNG or PDF.' },
  { path: '/docs/user-guide#histogram', page: 'User Guide', heading: 'Histogram', text: 'Bin RPM against MAP and export the table.' },
  { path: '/docs/tuning#lambda-delay', page: 'Tuning Tables', heading: 'Lambda delay', text: 'Measures the wideband delay after a pulse-width step.' },
  { path: '/docs/tuning#lambda-delay-compensation', page: 'Tuning Tables', heading: 'Lambda-delay compensation', text: 'Each tip-in uses the Lambda Delay table cell, and the lambda delay median when confident.' },
  { path: '/docs/faq#lambda', page: 'FAQ', heading: 'Why lámbda?', text: 'Lambda is AFR divided by stoichiometric AFR.' },
]
const INDEX = prepare(ENTRIES)
const paths = (q: string) => search(INDEX, q).map((r) => r.entry.path)

describe('fold and queryTerms', () => {
  it('folds case and accents', () => {
    expect(fold('Lámbda ÉCU')).toBe('lambda ecu')
  })
  it('splits on punctuation and dedupes', () => {
    expect(queryTerms('  pulse-width, PULSE  ')).toEqual(['pulse', 'width'])
    expect(queryTerms('— ?')).toEqual([])
  })
})

describe('search', () => {
  it('returns nothing for an empty query', () => {
    expect(search(INDEX, '   ')).toEqual([])
  })
  it('requires every term (AND)', () => {
    expect(paths('export pdf')).toEqual(['/docs/user-guide#exporting'])
    expect(paths('export zzz')).toEqual([])
  })
  it('ranks a heading match above a body-only match', () => {
    expect(paths('export')).toEqual(['/docs/user-guide#exporting', '/docs/user-guide#histogram'])
  })
  it('matches accent-insensitively in both directions', () => {
    expect(paths('lambda')).toContain('/docs/faq#lambda')
    expect(paths('lámbda')).toContain('/docs/tuning#lambda-delay')
  })
  it('matches inside words, but ranks word starts higher', () => {
    const r = search(INDEX, 'band')
    expect(r.map((x) => x.entry.path)).toEqual(['/docs/tuning#lambda-delay'])
  })
  it('ranks a heading equal to the query first', () => {
    expect(paths('lambda delay').slice(0, 2)).toEqual(['/docs/tuning#lambda-delay', '/docs/tuning#lambda-delay-compensation'])
  })
  it('respects the limit', () => {
    expect(search(INDEX, 'e', 2)).toHaveLength(2)
  })
})

describe('short terms', () => {
  it('match only at a word start', () => {
    const idx = prepare([
      { path: '/a', page: 'A', heading: 'Keys', text: 'Press cmd e to export.' },
      { path: '/b', page: 'B', heading: 'Other', text: 'Press cmd then wait here.' },
    ])
    expect(search(idx, 'cmd e').map((r) => r.entry.path)).toEqual(['/a'])
  })
})

describe('snippet', () => {
  const text = 'Lambda is AFR divided by stoichiometric AFR.'
  const join = (q: string, t = text) => snippet(t, q).map((s) => (s.hit ? `[${s.text}]` : s.text)).join('')

  it('marks every term occurrence', () => {
    expect(join('afr')).toBe('Lambda is [AFR] divided by stoichiometric [AFR].')
  })
  it('maps folded matches back to the original text', () => {
    expect(join('lamb', 'Why lámbda?')).toBe('Why [lámb]da?')
  })
  it('marks a match that ends inside an expanding character', () => {
    expect(join('fil', 'the ﬁle')).toBe('the [ﬁl]e')
    expect(join('f', 'the ﬁle')).toBe('the [ﬁ]le')
  })
  it('agrees with search on final sigma', () => {
    expect(search(prepare([{ path: '/s', page: 'S', heading: null, text: 'ΟΔΟΣ test' }]), 'οδος')).toHaveLength(1)
    expect(join('οδος', 'ΟΔΟΣ test')).toBe('[ΟΔΟΣ] test')
  })
  it('falls back to the start when the text has no match', () => {
    expect(join('nothing')).toBe(text)
  })
  it('windows long text around the first match, on word boundaries', () => {
    const long = `${'alpha '.repeat(60)}target ${'omega '.repeat(60)}`.trim()
    const out = join('target', long)
    expect(out.startsWith('…alpha')).toBe(true)
    expect(out).toContain('[target]')
    expect(out.endsWith('omega…')).toBe(true)
    expect(out.length).toBeLessThan(200)
  })
})

describe('htmlToText', () => {
  it('joins inline markup and splits at blocks', () => {
    expect(htmlToText('<p>Run <code>cargo build</code>).</p><p><strong>un</strong>usual</p><ul><li>a</li><li>b</li></ul>')).toBe(
      'Run cargo build). unusual a b',
    )
  })
  it('keeps image alt text', () => {
    expect(htmlToText('<p>See <img src="x.png" alt="the chart" loading="lazy">.</p>')).toBe('See the chart .')
  })
  it('drops tags, decodes entities and collapses whitespace', () => {
    expect(htmlToText('<p>A &amp; B &lt;tag&gt;\n  <code>x&#39;s</code> &#x2014; &nbsp;end</p>')).toBe("A & B <tag> x's — end")
  })
  it('keeps unknown entities as written', () => {
    expect(htmlToText('&bogus; &#0;')).toBe('&bogus; &#0;')
  })
})

describe('buildSearchIndex', () => {
  const index = buildSearchIndex()

  it('lists Home first and splits pages at h2/h3 with the page ids', () => {
    expect(index[0]!.path).toBe('/docs')
    for (const e of index) expect(e.path).toMatch(/^\/docs(\/[a-z-]+)?(#[\w%-]+)?$/)
    const withAnchor = index.filter((e) => e.path.includes('#'))
    expect(withAnchor.length).toBeGreaterThan(0)
    expect(withAnchor.every((e) => e.heading)).toBe(true)
  })
  it('holds plain text only, with image alt text kept', () => {
    for (const e of index) expect(e.text).not.toMatch(/<(?:\/|img|a |p>|code|strong|em>|h\d)/i)
    // The fixture's alt text is literally `logo <b>`: kept as text, rendered with {{ }} (escaped).
    expect(index.some((e) => e.text.includes('logo <b>'))).toBe(true)
  })
})
