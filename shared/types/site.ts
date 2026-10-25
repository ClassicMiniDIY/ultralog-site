// Types shared by the prerendered server routes and the pages.

export type Platform = 'macos' | 'windows' | 'linux'
export type Arch = 'arm64' | 'x86-64'

export interface ReleaseAsset {
  name: string
  url: string
  size: number
  /** Hex SHA-256 from the GitHub asset digest, when GitHub recorded one. */
  sha256: string | null
  platform: Platform | null
  arch: Arch | null
  /** File type as shown to the user: `.dmg`, `.zip`, `.tar.gz`, `AppImage`. */
  kind: string
}

export interface Release {
  tag: string
  name: string
  url: string
  publishedAt: string
  prerelease: boolean
  /** The highest stable version: the one the hero, downloads and "Latest" badge use. */
  latest: boolean
  /** Top-level bullets of the release notes, as inline HTML (bold lead kept). */
  highlights: string[]
  /** Release notes as HTML, without the install boilerplate and the generated changelog. */
  notesHtml: string
  assets: ReleaseAsset[]
}

export interface EcuChannel {
  name: string
  unit: string | null
  category: string
  sourceNames: string[]
}

export interface EcuDetail {
  slug: string
  wikiHtml: string | null
  adapter: { id: string; name: string; version: string; url: string } | null
  channels: EcuChannel[]
}
