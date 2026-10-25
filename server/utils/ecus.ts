import type { EcuChannel } from '#shared/types/site'
import { createMarkdown } from './markdown'

const WIKI_RAW = 'https://raw.githubusercontent.com/wiki/ClassicMiniDIY/UltraLog/Supported-ECU-Formats.md'
const WIKI_BASE = 'https://github.com/ClassicMiniDIY/UltraLog/wiki'
const OECUA_API = 'https://oecua.org/api/adapters'
const OECUA_SITE = 'https://oecua.org/adapters'

// The wiki section's `###` headings sit under the page's h1, so they become h2. Relative links
// (`User-Guide#computed-channels`) resolve against the wiki, as they do on GitHub.
const wikiMarkdown = createMarkdown({ baseUrl: `${WIKI_BASE}/`, headingShift: -1 })

/**
 * A data source did not give what a page expects. In CI a moved wiki heading fails the build
 * (it would otherwise deploy blank ECU pages unnoticed); network failures only annotate the run,
 * so an outage of oecua.org or raw.githubusercontent.com does not block a release deploy.
 */
function reportMiss(message: string, { failInCi }: { failInCi: boolean }) {
  if (process.env.CI && failInCi) throw new Error(`[ecus] ${message}`)
  console.warn(process.env.GITHUB_ACTIONS ? `::warning title=ECU data::${message}` : `[ecus] ${message}`)
}

let wikiPage: Promise<string | null> | null = null

function fetchWikiPage(): Promise<string | null> {
  wikiPage ??= $fetch<string>(WIKI_RAW, { responseType: 'text' }).catch((err: unknown) => {
    // The ECU pages still build without the wiki copy; they show the summary and link to the wiki.
    reportMiss(`wiki fetch failed: ${String(err)}`, { failInCi: false })
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

/**
 * True when a `## ` heading line names `heading`: the whole title, or the title followed by
 * " - Full Support" / " / Honda Tuning Studio". `Link ECU` does not match `Link ECU G5 CAN`.
 */
export function headingMatches(line: string, heading: string): boolean {
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^## ${esc}(?:\\s*$| - | / )`).test(line)
}

/** The wiki section whose `## ` heading names `heading`, rendered without its heading. */
export async function getWikiSection(heading: string): Promise<string | null> {
  const page = await fetchWikiPage()
  if (!page) return null
  const sections = page.replace(/\r\n/g, '\n').split(/\n(?=## )/)
  const section = sections.find((s) => headingMatches(s.split('\n', 1)[0] ?? '', heading))
  if (!section) {
    reportMiss(`no Supported-ECU-Formats wiki section is headed "## ${heading}"`, { failInCi: true })
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
  decibels: 'dB',
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
      reportMiss(`OECUA adapter ${ref} fetch failed: ${String(err)}`, { failInCi: false })
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
