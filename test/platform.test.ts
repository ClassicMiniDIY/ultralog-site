import { describe, expect, it } from 'vitest'
import type { Release, ReleaseAsset } from '#shared/types/site'
import { archLabel, platformBuilds } from '../app/utils/platform'
import { headingMatches } from '../server/utils/ecus'

const asset = (name: string, platform: ReleaseAsset['platform'], arch: ReleaseAsset['arch'], kind: string): ReleaseAsset => ({
  name,
  url: `https://example.test/${name}`,
  size: 13_484_901,
  sha256: null,
  platform,
  arch,
  kind,
})

const release: Release = {
  tag: 'v2.16.2',
  name: 'v2.16.2',
  url: '',
  publishedAt: '2026-10-23T13:46:43Z',
  prerelease: false,
  latest: true,
  highlights: [],
  notesHtml: '',
  assets: [
    asset('ultralog-macos-arm64.dmg', 'macos', 'arm64', '.dmg'),
    asset('ultralog-macos-intel.dmg', 'macos', 'x86-64', '.dmg'),
    asset('ultralog-windows.zip', 'windows', 'x86-64', '.zip'),
    asset('ultralog-linux.tar.gz', 'linux', 'x86-64', '.tar.gz'),
  ],
}

describe('platformBuilds', () => {
  it('offers Apple Silicon first and Intel as the alternate when the arch is unknown', () => {
    const mac = platformBuilds(release, { platform: 'macos', arch: null })[0]!
    expect(mac.primary.name).toBe('ultralog-macos-arm64.dmg')
    expect(mac.alternate?.name).toBe('ultralog-macos-intel.dmg')
    expect(mac.forVisitor).toBe(true)
  })

  it('offers the Intel DMG first to an Intel Mac', () => {
    expect(platformBuilds(release, { platform: 'macos', arch: 'x86-64' })[0]!.primary.name).toBe('ultralog-macos-intel.dmg')
  })

  it('does not call an x86-64 Linux build "Your system" on an arm64 Linux machine', () => {
    const linux = platformBuilds(release, { platform: 'linux', arch: 'arm64' }).find((b) => b.platform === 'linux')!
    expect(linux.primary.name).toBe('ultralog-linux.tar.gz')
    expect(linux.forVisitor).toBe(false)
  })

  it('keeps Windows on Arm as "Your system" (x64 emulation runs the build)', () => {
    expect(platformBuilds(release, { platform: 'windows', arch: 'arm64' }).find((b) => b.platform === 'windows')!.forVisitor).toBe(true)
  })

  it('gives every card equal weight without a detected visitor', () => {
    expect(platformBuilds(release, null).every((b) => !b.forVisitor)).toBe(true)
  })
})

describe('archLabel', () => {
  it('names macOS builds the way Apple does', () => {
    expect(archLabel(asset('a.dmg', 'macos', 'arm64', '.dmg'))).toBe('Apple Silicon')
    expect(archLabel(asset('a.dmg', 'macos', 'x86-64', '.dmg'))).toBe('Intel')
    expect(archLabel(asset('a-universal.dmg', 'macos', null, '.dmg'))).toBe('Universal')
  })
})

describe('headingMatches (wiki sections)', () => {
  it.each([
    ['## Haltech', 'Haltech', true],
    ['## MegaSquirt / Honda Tuning Studio - Full Support', 'MegaSquirt', true],
    ['## TunerStudio MSL - Full Support', 'TunerStudio MSL', true],
    ['## Speeduino / rusEFI', 'Speeduino / rusEFI', true],
    ['## Link ECU G5 CAN', 'Link ECU', false],
    ['## Haltech Elite notes', 'Haltech', false],
  ])('%s vs %s', (line, heading, expected) => {
    expect(headingMatches(line, heading)).toBe(expected)
  })
})
