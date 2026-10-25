// Clones or updates the UltraLog GitHub wiki into .wiki/ for /docs and the ECU pages.
// Runs before `dev` and `generate`. With WIKI_DIR set (a local checkout) it does nothing.
// Offline with an existing clone, it keeps the clone and warns; with no clone, it fails.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const REMOTE = 'https://github.com/ClassicMiniDIY/UltraLog.wiki.git'
const DIR = '.wiki'

function git(args: string[]): boolean {
  const r = spawnSync('git', args, { stdio: 'inherit' })
  return r.status === 0
}

if (process.env.WIKI_DIR) {
  console.log(`[wiki] using WIKI_DIR=${process.env.WIKI_DIR}`)
} else if (existsSync(`${DIR}/.git`)) {
  // The clone is ours and read-only, so a hard reset to the remote is the right update.
  const ok = git(['-C', DIR, 'fetch', '--depth', '1', 'origin']) && git(['-C', DIR, 'reset', '--hard', 'FETCH_HEAD'])
  if (!ok) console.warn('[wiki] update failed; building from the existing clone')
} else if (!git(['clone', '--depth', '1', REMOTE, DIR])) {
  console.error(`[wiki] could not clone ${REMOTE}`)
  process.exit(1)
}
