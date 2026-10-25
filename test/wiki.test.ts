import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { docsHref, listWikiFiles, renderWikiPage, rewriteWikiLinks, wikiNav } from '../server/utils/wiki'

// Read lazily by wikiDir(), so setting it here (before any describe body runs) is enough.
process.env.WIKI_DIR = fileURLToPath(new URL('./fixtures/wiki', import.meta.url))

describe('listWikiFiles', () => {
  it('maps Home to /docs and skips partials', () => {
    expect(listWikiFiles()).toEqual([
      { name: 'Getting-Started', slug: 'getting-started' },
      { name: 'Home', slug: '' },
      { name: 'User-Guide', slug: 'user-guide' },
    ])
  })
})

describe('docsHref', () => {
  it.each([
    ['User-Guide#exporting', '/docs/user-guide#exporting'],
    ['user guide', '/docs/user-guide'],
    ['Home', '/docs'],
    ['https://github.com/ClassicMiniDIY/UltraLog/wiki/Getting-Started', '/docs/getting-started'],
    ['https://github.com/SomethingNew71/UltraLog/wiki', '/docs'],
    ['#install', '#install'],
    ['#"onmouseover=x', '#%22onmouseover%3Dx'],
    ['Not-A-Page', null],
    ['https://example.test/User-Guide', null],
    ['/User-Guide', null],
    ['javascript:alert(1)', null],
  ])('%s → %s', (href, expected) => {
    expect(docsHref(href)).toBe(expected)
  })
})

describe('rewriteWikiLinks', () => {
  it('turns [[Page]] and [[Text|Page]] into Markdown links', () => {
    expect(rewriteWikiLinks('[[Getting-Started]] and [[the guide|User-Guide]]')).toBe(
      '[Getting Started](Getting-Started) and [the guide](User-Guide)',
    )
  })
})

describe('renderWikiPage', () => {
  const page = renderWikiPage({ name: 'Getting-Started', slug: 'getting-started' })!

  it('lifts the title and dedupes heading ids', () => {
    expect(page.title).toBe('Getting Started')
    expect(page.html).not.toContain('<h1')
    expect(page.toc).toEqual([
      { id: 'install', text: 'Install' },
      { id: 'install-1', text: 'Install' },
    ])
  })

  it('links wiki pages to /docs and unknown pages to the GitHub wiki', () => {
    expect(page.html).toContain('<a href="/docs/user-guide">Installation guide</a>')
    expect(page.html).toContain('<a href="/docs">the wiki home</a>')
    expect(page.html).toContain('href="https://github.com/ClassicMiniDIY/UltraLog/wiki/Not-A-Page"')
    expect(page.html).not.toContain('javascript:')
  })

  it('keeps https images with escaped alt text; relative images resolve on the wiki', () => {
    expect(page.html).toContain('<img src="https://example.test/a.png" alt="logo &lt;b&gt;" loading="lazy" decoding="async">')
    expect(page.html).toContain('<img src="https://github.com/ClassicMiniDIY/UltraLog/wiki/a.png"')
  })
})

describe('wikiNav', () => {
  it('follows _Sidebar groups, stops at the rule, and lists leftovers under More', () => {
    expect(wikiNav()).toEqual([
      { title: 'Getting Started', items: [{ path: '/docs/getting-started', title: 'Getting Started' }] },
      { title: 'Docs', items: [{ path: '/docs/user-guide', title: 'User Guide' }] },
    ])
  })
})
