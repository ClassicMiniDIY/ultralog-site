import type { Arch, Platform, Release, ReleaseAsset } from '#shared/types/site'

export interface Visitor {
  platform: Platform | null
  arch: Arch | null
}

interface UADataLike {
  mobile?: boolean
  platform?: string
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>
}

/** The visitor's desktop OS and, where the browser says, its CPU architecture. Client only. */
export async function detectVisitor(): Promise<Visitor> {
  const nav = navigator as Navigator & { userAgentData?: UADataLike }
  const ua = nav.userAgent
  const uad = nav.userAgentData
  if (uad?.mobile || /android|iphone|ipad|ipod|mobile/i.test(ua)) return { platform: null, arch: null }

  const src = `${uad?.platform ?? ''} ${nav.platform ?? ''} ${ua}`
  let platform: Platform | null = null
  if (/cros/i.test(src)) platform = null
  else if (/mac/i.test(src)) platform = nav.maxTouchPoints > 1 ? null : 'macos' // iPadOS reports Macintosh
  else if (/win/i.test(src)) platform = 'windows'
  else if (/linux|x11/i.test(src)) platform = 'linux'

  let arch: Arch | null = null
  try {
    const hints = await uad?.getHighEntropyValues?.(['architecture', 'bitness'])
    if (hints?.architecture === 'arm') arch = 'arm64'
    else if (hints?.architecture === 'x86') arch = 'x86-64'
  } catch {
    // Not offered (Safari, Firefox) or refused; fall through to the defaults below.
  }
  if (!arch && /aarch64|arm64/i.test(ua)) arch = 'arm64'
  return { platform, arch }
}

export interface PlatformBuild {
  platform: Platform
  os: string
  /** The build to offer first on this card. */
  primary: ReleaseAsset
  /** Another build for the same OS (the Intel DMG beside the Apple Silicon one). */
  alternate: ReleaseAsset | null
}

const OS_NAMES: Record<Platform, string> = { macos: 'macOS', windows: 'Windows', linux: 'Linux' }
const ORDER: Platform[] = ['macos', 'windows', 'linux']

/**
 * One card per OS from a release's assets. macOS offers Apple Silicon first unless the visitor's
 * browser reports an x86 CPU (Safari never says, and every Mac sold since 2023 is Apple Silicon).
 */
export function platformBuilds(release: Release | null | undefined, visitor: Visitor | null): PlatformBuild[] {
  if (!release) return []
  const out: PlatformBuild[] = []
  for (const platform of ORDER) {
    const builds = release.assets.filter((a) => a.platform === platform)
    if (builds.length === 0) continue
    const preferArch: Arch = visitor?.platform === platform && visitor.arch ? visitor.arch : platform === 'macos' ? 'arm64' : 'x86-64'
    const primary = builds.find((a) => a.arch === preferArch) ?? builds[0]!
    const alternate = builds.find((a) => a !== primary && a.arch !== primary.arch) ?? null
    out.push({ platform, os: OS_NAMES[platform], primary, alternate })
  }
  return out
}

export function archLabel(asset: ReleaseAsset): string {
  if (asset.platform === 'macos') return asset.arch === 'arm64' ? 'Apple Silicon' : 'Intel'
  return asset.arch ?? ''
}

/** "Apple Silicon · .dmg · 13.5 MB", "10 / 11 · .zip · 11.7 MB", ".tar.gz · 11.8 MB". */
export function assetMeta(asset: ReleaseAsset): string {
  const lead = asset.platform === 'macos' ? archLabel(asset) : asset.platform === 'windows' ? '10 / 11' : ''
  return [lead, asset.kind, formatSize(asset.size)].filter(Boolean).join(' · ')
}

export function latestStable(releases: Release[] | null | undefined): Release | null {
  return releases?.find((r) => !r.prerelease) ?? null
}
