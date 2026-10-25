import { describe, expect, it } from 'vitest'
import { classifyAsset, extractHighlights, prepareReleases, releaseNotesSection } from '../server/utils/github'

describe('classifyAsset', () => {
  it.each([
    ['ultralog-macos-arm64.dmg', 'macos', 'arm64', '.dmg'],
    ['ultralog-macos-intel.dmg', 'macos', 'x86-64', '.dmg'],
    ['ultralog-windows.zip', 'windows', 'x86-64', '.zip'],
    ['UltraLog-1.0.msi', 'windows', 'x86-64', '.msi'],
    ['ultralog-linux.tar.gz', 'linux', 'x86-64', '.tar.gz'],
    ['UltraLog-aarch64.AppImage', 'linux', 'arm64', 'AppImage'],
    ['ultralog-macos-arm64.tar.gz', null, null, '.tar.gz'],
    ['README', null, null, ''],
  ])('%s', (name, platform, arch, kind) => {
    expect(classifyAsset(name)).toEqual({ platform, arch, kind })
  })
})

const INSTALL = '## Installation\n\n### macOS\n1. Download the `.dmg`\n'
const CHANGED =
  "## What's Changed\n### 🔄 Other Changes\n* fix(deps): bump webpki-roots by @SomethingNew71 in https://github.com/ClassicMiniDIY/UltraLog/pull/103\n\n\n**Full Changelog**: https://github.com/ClassicMiniDIY/UltraLog/compare/v2.16.1...v2.16.2"

describe('releaseNotesSection', () => {
  it('keeps the notes above the install boilerplate', () => {
    const body = `## Security\n\nText.\n\n${INSTALL}\n<!-- Release notes generated -->\n\n${CHANGED}`
    expect(releaseNotesSection(body)).toBe('## Security\n\nText.')
  })

  it('falls back to the generated PR list when the body opens with Installation', () => {
    const notes = releaseNotesSection(`${INSTALL}\n${CHANGED}`)
    expect(notes).toBe(
      '* fix(deps): bump webpki-roots ([#103](https://github.com/ClassicMiniDIY/UltraLog/pull/103))',
    )
    expect(notes).not.toContain('🔄')
  })

  it('drops a trailing rule', () => {
    expect(releaseNotesSection('**Beta.**\n\n---\n')).toBe('**Beta.**')
  })
})

describe('extractHighlights', () => {
  it('joins hard-wrapped lines and skips nested lists', () => {
    const notes = '- **webpki-roots 1.0.10.** Removes the root that signed the\n  compromised intermediates.\n  - nested detail\n- **Second.** Done.'
    expect(extractHighlights(notes)).toEqual([
      '<strong>webpki-roots 1.0.10.</strong> Removes the root that signed the compromised intermediates.',
      '<strong>Second.</strong> Done.',
    ])
  })
})

describe('prepareReleases', () => {
  const rel = (tag: string, published: string, prerelease = false) => ({
    tag_name: tag,
    name: tag,
    html_url: `https://github.com/x/releases/tag/${tag}`,
    published_at: published,
    draft: false,
    prerelease,
    body: '- **Item.** Text.',
    assets: [],
  })

  it('marks the highest stable version latest, not the newest by date', () => {
    const out = prepareReleases([
      rel('v3.0.0', '2026-11-01T00:00:00Z'),
      rel('v2.16.3', '2026-11-05T00:00:00Z'),
      rel('v3.1.0-beta.1', '2026-11-06T00:00:00Z', true),
    ])
    expect(out.map((r) => r.tag)).toEqual(['v3.1.0-beta.1', 'v2.16.3', 'v3.0.0'])
    expect(out.filter((r) => r.latest).map((r) => r.tag)).toEqual(['v3.0.0'])
  })

  it('skips drafts', () => {
    const draft = { ...rel('v9.9.9', '2026-12-01T00:00:00Z'), draft: true }
    expect(prepareReleases([draft, rel('v1.0.0', '2026-01-01T00:00:00Z')]).map((r) => r.tag)).toEqual(['v1.0.0'])
  })
})
