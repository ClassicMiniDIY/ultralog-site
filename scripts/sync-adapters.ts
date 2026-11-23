// Regenerates data/openecu/adapters.json from the OpenECU spec corpus in the UltraLog repo.
//
// This is a MANUAL step, deliberately not part of `build`. The generated JSON is committed, so
// the build fetches no adapter data. That is the opposite of scripts/sync-wiki.ts on purpose:
// the wiki is prose whose absence is obvious, whereas a missing adapter makes the whole channel
// section vanish (the page's `v-if="data?.channels.length"`), which nobody notices. The site
// used to fetch this from oecua.org at build time with failInCi: false — exactly that silent
// failure. See CLAUDE.md, "Channel tables come from committed data".
//
// Run it when UltraLog's corpus changes, then commit the result:
//
//   bun run sync:adapters                        # from ClassicMiniDIY/UltraLog main
//   bun run sync:adapters --ref v3.2.0           # from a tag or sha
//   bun run sync:adapters --from ../UltraLog     # from a local checkout
//
// Nothing downstream validates this file — `server/utils/ecus.ts` casts it and `scripts/` is in
// no tsconfig include, so `bun run typecheck` never sees this script. It therefore validates its
// own output: every spec must yield a non-empty id, name, version and vendor, and every channel
// a name. Upstream used to run a zod schema over these files before serving them; that layer
// went with the site, and these assertions stand in for it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { parse } from 'yaml'
import { ECUS } from '../shared/utils/ecus'

// Resolve from this file, not the cwd: run from scripts/ and relative paths would quietly
// write scripts/data/openecu/adapters.json and report success.
const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..')
const OUT = join(ROOT, 'data/openecu/adapters.json')
const REPO = 'ClassicMiniDIY/UltraLog'
const CORPUS = 'spec/openecu/adapters'

interface RawChannel {
  id?: unknown
  name?: unknown
  category?: unknown
  unit?: unknown
  source_names?: unknown
}

interface RawAdapter {
  id?: unknown
  name?: unknown
  version?: unknown
  vendor?: unknown
  channels?: unknown
}

interface Channel {
  name: string
  unit: string | null
  /** Not rendered anywhere today; kept so a future grouped table needs no regeneration. */
  category: string
  sourceNames: string[]
}

interface Adapter {
  id: string
  name: string
  version: string
  vendor: string
  channels: Channel[]
}

/** `--flag value` or `--flag=value`. A flag with no value is an error, never a silent default. */
function arg(flag: string): string | undefined {
  const argv = process.argv.slice(2)
  const i = argv.findIndex((a) => a === flag || a.startsWith(`${flag}=`))
  if (i === -1) return undefined
  const a = argv[i]!
  const value = a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[i + 1]
  if (!value || value.startsWith('--')) throw new Error(`${flag} needs a value`)
  return value
}

const KNOWN = ['--from', '--ref']
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--') && !KNOWN.some((k) => a === k || a.startsWith(`${k}=`))) {
    throw new Error(`unknown option ${a} (known: ${KNOWN.join(', ')})`)
  }
}

const localRepo = arg('--from')
const refArg = arg('--ref')
if (localRepo && refArg) throw new Error('--from and --ref are mutually exclusive')

const str = (v: unknown, where: string): string => {
  if (typeof v !== 'string' || v.trim() === '') throw new Error(`${where} is missing or not a string`)
  return v.trim()
}

/**
 * What `source.ref` records. For `--from` it is the local checkout's actual HEAD, marked
 * `-dirty` when the tree is modified — recording a bare "main" there would stamp the file with
 * provenance it does not have, and the digests would be of local bytes that match no commit.
 */
function provenance(): { repo: string; ref: string; corpus: string; from?: string } {
  if (!localRepo) return { repo: REPO, ref: refArg ?? 'main', corpus: CORPUS }
  const git = (args: string[]) =>
    execFileSync('git', ['-C', localRepo, ...args], { encoding: 'utf8' }).trim()
  let ref: string
  try {
    ref = git(['rev-parse', 'HEAD'])
    if (git(['status', '--porcelain', '--', CORPUS]) !== '') ref += '-dirty'
  } catch {
    ref = 'unknown'
  }
  return { repo: REPO, ref, corpus: CORPUS, from: localRepo }
}

async function read(specRef: string): Promise<string> {
  const rel = `${CORPUS}/${specRef}.adapter.yaml`
  if (localRepo) return readFileSync(join(localRepo, rel), 'utf8')
  const url = `https://raw.githubusercontent.com/${REPO}/${refArg ?? 'main'}/${rel}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
  return res.text()
}

const unitOf = (u: unknown) => (typeof u === 'string' && u.trim() !== '' ? u.trim() : null)

/** The adapter refs the site needs, from the ECU list, so the two cannot drift. */
const refs = [...new Set(ECUS.map((e) => e.oecua).filter((r): r is string => !!r))].sort()

/** Channel counts from the committed file, to show what moved before anything is committed. */
const previous: Record<string, number> = {}
if (existsSync(OUT)) {
  const old = JSON.parse(readFileSync(OUT, 'utf8')) as { adapters?: Record<string, Adapter> }
  for (const [k, v] of Object.entries(old.adapters ?? {})) previous[k] = v.channels.length
}

const adapters: Record<string, Adapter> = {}
const digests: Record<string, string> = {}

for (const r of refs) {
  const text = await read(r)
  digests[r] = createHash('sha256').update(text).digest('hex')
  const raw = parse(text) as RawAdapter

  if (!Array.isArray(raw.channels)) throw new Error(`${r}: 'channels' is missing or not a list`)
  const channels: Channel[] = (raw.channels as RawChannel[]).map((c, i) => ({
    name: str(c.name, `${r}: channels[${i}].name`),
    unit: unitOf(c.unit),
    category: typeof c.category === 'string' && c.category !== '' ? c.category : 'other',
    // The spec is snake_case. The old oecua.org JSON API served these camelCased, which is why
    // this mapping exists: read straight from YAML with the API's shape and every channel
    // silently loses its source names, with no error anywhere.
    sourceNames: Array.isArray(c.source_names) ? (c.source_names as string[]) : [],
  }))
  if (channels.length === 0) throw new Error(`${r}: parsed to zero channels`)

  adapters[r] = {
    id: str(raw.id, `${r}: id`),
    name: str(raw.name, `${r}: name`),
    version: str(raw.version, `${r}: version`),
    vendor: str(raw.vendor, `${r}: vendor`),
    channels,
  }

  const was = previous[r]
  const delta = was === undefined ? 'new' : was === channels.length ? 'unchanged' : `was ${was}`
  console.log(`[adapters] ${r}: ${channels.length} channels (${delta})`)
}

for (const r of Object.keys(previous)) {
  if (!(r in adapters)) console.log(`[adapters] ${r}: REMOVED (no longer in shared/utils/ecus.ts)`)
}

const payload = {
  $comment: `Generated by scripts/sync-adapters.ts from ${REPO}. Do not hand-edit.`,
  source: { ...provenance(), generated: new Date().toISOString().slice(0, 10) },
  // sha256 of each spec file as fetched, for auditing this file against upstream by hand.
  digests,
  adapters,
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`)

const total = Object.values(adapters).reduce((n, a) => n + a.channels.length, 0)
console.log(`[adapters] wrote ${OUT}: ${refs.length} adapters, ${total} channels`)
