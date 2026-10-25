import type { EcuChannel } from '#shared/types/site'
import { readWikiFile, rewriteWikiLinks, wikiMarkdown } from './wiki'

const OECUA_API = 'https://oecua.org/api/adapters'
const OECUA_SITE = 'https://oecua.org/adapters'

/**
 * A data source did not give what a page expects. In CI a missing wiki section fails the build
 * (it would otherwise deploy blank ECU pages unnoticed); an OECUA fetch failure only annotates the
 * run, so an outage of oecua.org does not block a release deploy.
 */
function reportMiss(message: string, { failInCi }: { failInCi: boolean }) {
  if (process.env.CI && failInCi) throw new Error(`[ecus] ${message}`)
  console.warn(process.env.GITHUB_ACTIONS ? `::warning title=ECU data::${message}` : `[ecus] ${message}`)
}

/**
 * True when a `## ` heading line names `heading`: the whole title, or the title followed by
 * " - Full Support" / " / Honda Tuning Studio". `Link ECU` does not match `Link ECU G5 CAN`.
 */
export function headingMatches(line: string, heading: string): boolean {
  const esc = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^## ${esc}(?:\\s*$| - | / )`).test(line)
}

/**
 * The Supported-ECU-Formats wiki section headed `heading`, rendered without its heading. Its
 * `###` headings sit under the ECU page's h1, so they become h2; wiki links go to /docs pages.
 */
export function getWikiSection(heading: string): string | null {
  const page = readWikiFile('Supported-ECU-Formats')
  if (page === null) {
    reportMiss('the wiki has no Supported-ECU-Formats page (is .wiki synced?)', { failInCi: true })
    return null
  }
  const section = page.split(/\n(?=## )/).find((s) => headingMatches(s.split('\n', 1)[0] ?? '', heading))
  if (!section) {
    reportMiss(`no Supported-ECU-Formats wiki section is headed "## ${heading}"`, { failInCi: true })
    return null
  }
  const body = section
    .replace(/^## .*\n/, '')
    .replace(/\n---\s*$/, '')
    .trim()
  return wikiMarkdown({ headingShift: -1 }).parse(rewriteWikiLinks(body)) as string
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
