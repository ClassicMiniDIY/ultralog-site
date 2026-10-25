import type { Release } from '#shared/types/site'
import type { Visitor } from '~/utils/platform'

/**
 * Releases from the prerendered /api/releases.json. `pick` keeps a page's payload to what it renders,
 * so `/` carries one release, not every release note ever written.
 */
export function useReleases<T>(key: string, pick: (all: Release[]) => T) {
  return useFetch('/api/releases.json', {
    key: `releases:${key}`,
    transform: (all: Release[]) => pick(all),
  })
}

/** Detected OS/arch, shared by the hero and the download cards. `null` until mounted and on mobile. */
export function useVisitor() {
  const visitor = useState<Visitor | null>('visitor', () => null)
  onMounted(async () => {
    if (!visitor.value) visitor.value = await detectVisitor()
  })
  return visitor
}
