import { readFile } from 'node:fs/promises'
import type { Arch, Platform, Release, ReleaseAsset } from '#shared/types/site'
import { createMarkdown } from './markdown'

const REPO = 'ClassicMiniDIY/UltraLog'
const MAX_PAGES = 5
const MAX_HIGHLIGHTS = 6

interface GhAsset {
  name: string
  size: number
  browser_download_url: string
  digest?: string | null
}

interface GhRelease {
  tag_name: string
  name: string | null
  html_url: string
  published_at: string | null
  draft: boolean
  prerelease: boolean
  body: string | null
  assets: GhAsset[]
}

function extension(name: string): string {
  const n = name.toLowerCase()
  if (n.endsWith('.tar.gz')) return '.tar.gz'
  const dot = n.lastIndexOf('.')
  return dot > 0 ? n.slice(dot) : ''
}

/** Map a release asset to a platform by its file name. Unknown files keep `platform: null`. */
export function classifyAsset(name: string): { platform: Platform | null; arch: Arch | null; kind: string } {
  const n = name.toLowerCase()
  const ext = extension(n)
  const arch: Arch | null = /arm64|aarch64|apple-?silicon/.test(n)
    ? 'arm64'
    : /intel|x86[_-]?64|amd64|x64/.test(n)
      ? 'x86-64'
      : null
  if (ext === '.dmg' || ext === '.pkg') return { platform: 'macos', arch, kind: ext }
  if (ext === '.msi' || ext === '.exe' || (ext === '.zip' && n.includes('windows'))) {
    return { platform: 'windows', arch: arch ?? 'x86-64', kind: ext }
  }
  if (ext === '.appimage') return { platform: 'linux', arch: arch ?? 'x86-64', kind: 'AppImage' }
  if (ext === '.deb' || ext === '.rpm' || (ext === '.tar.gz' && n.includes('linux'))) {
    return { platform: 'linux', arch: arch ?? 'x86-64', kind: ext }
  }
  return { platform: null, arch: null, kind: ext }
}

const INSTALL = /^##\s+Installation\b/im
const CHANGED = /^##\s+What's Changed\b/im
const GENERATED_END = [/^<!--\s*Release notes generated/im, /^\*\*Full Changelog\*\*/im]

function cutAt(body: string, markers: RegExp[]): string {
  let end = body.length
  for (const re of markers) {
    const m = re.exec(body)
    if (m && m.index < end) end = m.index
  }
  return body.slice(0, end)
}

function tidy(md: string): string {
  return md.replace(/\n-{3,}\s*$/, '').trim()
}

/**
 * The part of a release body worth showing. Normally everything above `## Installation` (the
 * install steps and the generated "What's Changed" list are the same boilerplate every time).
 * Older releases open with `## Installation` and only have the generated list; for those the
 * list is used, with its emoji group headings dropped and the "by @user in <url>" tail shortened
 * to a PR link.
 */
export function releaseNotesSection(body: string): string {
  const text = body.replace(/\r\n/g, '\n')
  const notes = tidy(cutAt(text, [INSTALL, CHANGED, ...GENERATED_END]))
  if (notes) return notes

  const m = CHANGED.exec(text)
  if (!m) return ''
  const list = cutAt(text.slice(m.index + m[0].length), [INSTALL, ...GENERATED_END])
  return tidy(
    list
      .split('\n')
      .filter((line) => !/^#{1,6}\s/.test(line))
      .map((line) => line.replace(/ by @[\w-]+ in (https:\/\/github\.com\/\S+\/pull\/(\d+))\s*$/, ' ([#$2]($1))'))
      .join('\n'),
  )
}

const notesMarkdown = createMarkdown({ baseUrl: `https://github.com/${REPO}/releases/tag/`, headingShift: 1 })

/** A list item's own sentence: hard-wrapped lines joined, nested lists and later paragraphs left out. */
function leadText(itemText: string): string {
  const lines: string[] = []
  for (const line of itemText.split('\n')) {
    if (!line.trim() || /^\s*([-*+]|\d+[.)])\s/.test(line)) break
    lines.push(line.trim())
  }
  return lines.join(' ')
}

export function extractHighlights(notes: string): string[] {
  const tokens = notesMarkdown.lexer(notes)
  const out: string[] = []
  for (const token of tokens) {
    if (token.type !== 'list') continue
    for (const item of token.items) {
      const lead = leadText(item.text)
      if (lead) out.push(notesMarkdown.parseInline(lead) as string)
      if (out.length >= MAX_HIGHLIGHTS) return out
    }
  }
  if (out.length === 0) {
    const para = tokens.find((t) => t.type === 'paragraph')
    if (para && 'text' in para) out.push(notesMarkdown.parseInline(leadText(para.text)) as string)
  }
  return out
}

/** [major, minor, patch] from a tag like `v2.16.2` or `v3.0.0-beta.1`; null if it is not semver-like. */
export function parseVersion(tag: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(tag)
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a) ?? [0, 0, 0]
  const vb = parseVersion(b) ?? [0, 0, 0]
  for (let i = 0; i < 3; i++) if (va[i] !== vb[i]) return va[i]! - vb[i]!
  return 0
}

function normalize(r: GhRelease): Release {
  const notes = releaseNotesSection(r.body ?? '')
  const assets: ReleaseAsset[] = r.assets.map((a) => ({
    name: a.name,
    url: a.browser_download_url,
    size: a.size,
    sha256: a.digest?.startsWith('sha256:') ? a.digest.slice('sha256:'.length) : null,
    ...classifyAsset(a.name),
  }))
  return {
    tag: r.tag_name,
    name: r.name || r.tag_name,
    url: r.html_url,
    publishedAt: r.published_at ?? '',
    prerelease: r.prerelease,
    latest: false,
    highlights: extractHighlights(notes),
    notesHtml: notesMarkdown.parse(notes) as string,
    assets,
  }
}

/**
 * Newest first by publish date, with `latest` on the highest stable version. A 2.x backport
 * published after 3.0.0 must not become the version the site offers.
 */
export function prepareReleases(list: GhRelease[]): Release[] {
  const releases = list
    .filter((r) => !r.draft && r.published_at)
    .sort((a, b) => Date.parse(b.published_at!) - Date.parse(a.published_at!))
    .map(normalize)
  const latest = releases
    .filter((r) => !r.prerelease && parseVersion(r.tag))
    .reduce<Release | null>((best, r) => (!best || compareVersions(r.tag, best.tag) > 0 ? r : best), null)
  if (latest) latest.latest = true
  return releases
}

async function fetchAll(token: string): Promise<GhRelease[]> {
  // RELEASES_FIXTURE points at a saved API response, for offline builds and for previewing
  // content (such as the 3.0 section) before the release exists.
  const fixture = process.env.RELEASES_FIXTURE
  if (fixture) return JSON.parse(await readFile(fixture, 'utf8')) as GhRelease[]

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'ultralog-site-build',
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const all: GhRelease[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await $fetch<GhRelease[]>(`https://api.github.com/repos/${REPO}/releases`, {
      headers,
      query: { per_page: 100, page },
    })
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

let cache: Promise<Release[]> | null = null

/**
 * Every published release. Fetched once per build: several prerendered routes ask for it.
 * A failed fetch fails the build on purpose, so a deploy never ships without downloads.
 */
export function getReleases(token: string): Promise<Release[]> {
  cache ??= fetchAll(token)
    .then(prepareReleases)
    .catch((err) => {
      cache = null
      throw err
    })
  return cache
}
