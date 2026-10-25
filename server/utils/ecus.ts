import type { EcuChannel } from '#shared/types/site'

const WIKI_RAW = 'https://raw.githubusercontent.com/wiki/ClassicMiniDIY/UltraLog/Supported-ECU-Formats.md'
const WIKI_BASE = 'https://github.com/ClassicMiniDIY/UltraLog/wiki'
const OECUA_API = 'https://oecua.org/api/adapters'
const OECUA_SITE = 'https://oecua.org/adapters'

// The wiki section's `###` headings sit under the page's h1, so they become h2.
const wikiMarkdown = createMarkdown({ headingShift: -1 })

let wikiPage: Promise<string | null> | null = null

function fetchWikiPage(): Promise<string | null> {
  wikiPage ??= $fetch<string>(WIKI_RAW, { responseType: 'text' }).catch((err: unknown) => {
    // The ECU pages still build without the wiki copy; they show the summary and link to the wiki.
    console.warn(`[ecus] wiki fetch failed: ${String(err)}`)
    return null
  })
  return wikiPage
}

/** `[[Page]]` and `[[Text|Page]]` are GitHub wiki links; turn them into normal Markdown links. */
function rewriteWikiLinks(md: string): string {
  return md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a: string, b?: string) => {
    const text = b ? a : a.replace(/-/g, ' ')
    const page = (b ?? a).trim().replace(/\s+/g, '-')
    return `[${text}](${WIKI_BASE}/${page})`
  })
}

/** The wiki section whose `## ` heading starts with `heading`, rendered without its heading. */
export async function getWikiSection(heading: string): Promise<string | null> {
  const page = await fetchWikiPage()
  if (!page) return null
  const sections = page.replace(/\r\n/g, '\n').split(/\n(?=## )/)
  const section = sections.find((s) => s.startsWith(`## ${heading}`))
  if (!section) {
    console.warn(`[ecus] no wiki section starts with "## ${heading}"`)
    return null
  }
  const body = section
    .replace(/^## .*\n/, '')
    .replace(/\n---\s*$/, '')
    .trim()
  return wikiMarkdown.parse(rewriteWikiLinks(body)) as string
}

interface OecuaChannel {
  name: string
  unit?: string | null
  category?: string
  sourceNames?: string[]
}

interface OecuaAdapter {
  id: string
  name: string
  version: string
  vendor: string
  channels: OecuaChannel[]
}

// OECUA unit ids → the spelling the app shows (SI casing, design-system voice rules).
const UNIT_LABELS: Record<string, string> = {
  percent: '%',
  celsius: '°C',
  fahrenheit: '°F',
  kelvin: 'K',
  kpa: 'kPa',
  psi: 'psi',
  bar: 'bar',
  mbar: 'mbar',
  rpm: 'rpm',
  volts: 'V',
  volt: 'V',
  millivolts: 'mV',
  amps: 'A',
  ms: 'ms',
  milliseconds: 'ms',
  seconds: 's',
  degrees: '°',
  kmh: 'km/h',
  mph: 'mph',
  lambda: 'λ',
  afr: 'AFR',
  g: 'g',
  hz: 'Hz',
}

const adapters = new Map<string, Promise<OecuaAdapter | null>>()

function fetchAdapter(ref: string): Promise<OecuaAdapter | null> {
  let p = adapters.get(ref)
  if (!p) {
    p = $fetch<OecuaAdapter>(`${OECUA_API}/${ref}`).catch((err: unknown) => {
      console.warn(`[ecus] OECUA adapter ${ref} fetch failed: ${String(err)}`)
      return null
    })
    adapters.set(ref, p)
  }
  return p
}

export async function getAdapter(ref: string) {
  const a = await fetchAdapter(ref)
  if (!a) return null
  const channels: EcuChannel[] = a.channels.map((c) => ({
    name: c.name,
    unit: c.unit ? (UNIT_LABELS[c.unit.toLowerCase()] ?? c.unit) : null,
    category: c.category ?? 'other',
    sourceNames: c.sourceNames ?? [],
  }))
  return {
    adapter: { id: a.id, name: a.name, version: a.version, url: `${OECUA_SITE}/${ref}` },
    channels,
  }
}
