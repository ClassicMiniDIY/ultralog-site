import type { EcuChannel } from '#shared/types/site'
import { readWikiFile, rewriteWikiLinks, wikiMarkdown } from './wiki'
import adaptersData from '../../data/openecu/adapters.json'

// Where a spec file can be read. Built from the provenance the data file records, so the link
// points at the ref the committed data actually came from — hardcoding `main` would show a
// version string from a tag beside a link to different content. The adapter data itself is
// committed in data/openecu/adapters.json (regenerate with `bun run sync:adapters`), so the
// build fetches no adapter data. Until 2026-11 this came from the oecua.org REST API; the
// OpenECU Alliance is retired and UltraLog owns the corpus now.
const { repo, ref, corpus } = adaptersData.source
const SPEC_SOURCE = `https://github.com/${repo}/blob/${ref.replace(/-dirty$/, '')}/${corpus}`

/**
 * A data source did not give what a page expects. In CI a missing wiki section fails the build;
 * see `getAdapter` for why a missing adapter throws unconditionally instead.
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

// OpenECU unit ids → the spelling the app shows (SI casing, design-system voice rules).
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
  'deg/s': '°/s',
  kph: 'km/h',
  kmh: 'km/h',
  mph: 'mph',
  lambda: 'λ',
  afr: 'AFR',
  g: 'g',
  'g/s': 'g/s',
  mg: 'mg',
  hz: 'Hz',
  'rpm/s': 'rpm/s',
  'kpa/s': 'kPa/s',
  'percent/s': '%/s',
  mpa: 'MPa',
  ma: 'mA',
  ohms: 'Ω',
  nm: 'N·m',
  'm/s2': 'm/s²',
  millimeters: 'mm',
  meters: 'm',
  kilometers: 'km',
  liters: 'L',
  'l/h': 'L/h',
  'cc/min': 'cc/min',
  // Dimensionless counters and codes. The spec gives them a `unit` so a consumer knows the
  // quantity, but printing the word "count" in a unit column is noise — show nothing.
  count: '',
  gear: '',
  code: '',
  lap: '',
  ratio: '',
  multiplier: '',
  bytes: '',
  version: '',
}

interface StoredChannel {
  name: string
  unit: string | null
  category: string
  sourceNames: string[]
}

interface StoredAdapter {
  id: string
  name: string
  version: string
  vendor: string
  channels: StoredChannel[]
}

const ADAPTERS = adaptersData.adapters as Record<string, StoredAdapter>

/**
 * The adapter for `ref` (`vendor/id`), or null when the committed data has no such entry —
 * which means `shared/utils/ecus.ts` names an adapter `scripts/sync-adapters.ts` did not
 * write. That is a build bug in this repo, not an upstream outage, so it fails CI.
 */
export function getAdapter(specRef: string) {
  const a = ADAPTERS[specRef]
  // Throws everywhere, not just in CI. The page wraps its channel table in
  // `v-if="data?.channels.length"`, so a miss does not render an incomplete section — the whole
  // section vanishes with nothing to notice. And a missing key in a committed file is a repo
  // bug that will never fix itself on retry, unlike the network fetch `failInCi` was written
  // for: `shared/utils/ecus.ts` names an adapter `scripts/sync-adapters.ts` did not write.
  if (!a) {
    throw new Error(
      `[ecus] no adapter "${specRef}" in data/openecu/adapters.json (run \`bun run sync:adapters\`)`,
    )
  }
  const channels: EcuChannel[] = a.channels.map((c) => ({
    name: c.name,
    unit: c.unit ? (UNIT_LABELS[c.unit.toLowerCase()] ?? c.unit) : null,
    category: c.category ?? 'other',
    sourceNames: c.sourceNames ?? [],
  }))
  return {
    adapter: {
      id: a.id,
      name: a.name,
      version: a.version,
      url: `${SPEC_SOURCE}/${specRef}.adapter.yaml`,
    },
    channels,
  }
}
