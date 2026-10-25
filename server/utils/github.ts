import { readFile } from 'node:fs/promises'
import type { Arch, Platform, Release, ReleaseAsset } from '#shared/types/site'

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

/** Map a release asset to a platform by its file name. Unknown files keep `platform: null`. */
export function classifyAsset(name: string): { platform: Platform | null; arch: Arch | null; kind: string } {
  const n = name.toLowerCase()
  const arch: Arch | null = /arm64|aarch64|apple-?silicon/.test(n)
    ? 'arm64'
    : /intel|x86[_-]?64|amd64|x64/.test(n)
      ? 'x86-64'
      : null
  if (n.endsWith('.dmg') || n.endsWith('.pkg')) {
    return { platform: 'macos', arch, kind: n.endsWith('.dmg') ? '.dmg' : '.pkg' }
  }
  if (n.endsWith('.msi')) return { platform: 'windows', arch: arch ?? 'x86-64', kind: '.msi' }
  if (n.endsWith('.exe')) return { platform: 'windows', arch: arch ?? 'x86-64', kind: '.exe' }
  if (n.endsWith('.zip') && n.includes('windows')) return { platform: 'windows', arch: arch ?? 'x86-64', kind: '.zip' }
  if (n.endsWith('.appimage')) return { platform: 'linux', arch: arch ?? 'x86-64', kind: 'AppImage' }
  if (n.endsWith('.deb')) return { platform: 'linux', arch: arch ?? 'x86-64', kind: '.deb' }
  if (n.endsWith('.rpm')) return { platform: 'linux', arch: arch ?? 'x86-64', kind: '.rpm' }
  if (n.endsWith('.tar.gz') && n.includes('linux')) return { platform: 'linux', arch: arch ?? 'x86-64', kind: '.tar.gz' }
  return { platform: null, arch: null, kind: n.slice(n.lastIndexOf('.')) }
}

// Everything from the install boilerplate on is the same in every release and is left out.
const NOTES_END = [/^##\s+Installation\b/im, /^##\s+What's Changed\b/im, /^<!--\s*Release notes generated/im, /^\*\*Full Changelog\*\*/im]

export function releaseNotesSection(body: string): string {
  let end = body.length
  for (const re of NOTES_END) {
    const m = re.exec(body)
    if (m && m.index < end) end = m.index
  }
  return body.slice(0, end).replace(/\r\n/g, '\n').trim()
}

const notesMarkdown = createMarkdown({ headingShift: 1 })

export function extractHighlights(notes: string): string[] {
  const out: string[] = []
  for (const token of notesMarkdown.lexer(notes)) {
    if (token.type !== 'list') continue
    for (const item of token.items) {
      const firstLine = item.text.split('\n')[0]?.trim()
      if (firstLine) out.push(notesMarkdown.parseInline(firstLine) as string)
      if (out.length >= MAX_HIGHLIGHTS) return out
    }
  }
  if (out.length === 0) {
    const para = notesMarkdown.lexer(notes).find((t) => t.type === 'paragraph')
    if (para && 'text' in para) out.push(notesMarkdown.parseInline(para.text) as string)
  }
  return out
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
    highlights: extractHighlights(notes),
    notesHtml: notesMarkdown.parse(notes) as string,
    assets,
  }
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
 * Every published release, newest first. Fetched once per build: several prerendered routes ask
 * for it. A failed fetch fails the build on purpose, so a deploy never ships without downloads.
 */
export function getReleases(token: string): Promise<Release[]> {
  cache ??= fetchAll(token)
    .then((list) =>
      list
        .filter((r) => !r.draft && r.published_at)
        .sort((a, b) => Date.parse(b.published_at!) - Date.parse(a.published_at!))
        .map(normalize),
    )
    .catch((err) => {
      cache = null
      throw err
    })
  return cache
}
