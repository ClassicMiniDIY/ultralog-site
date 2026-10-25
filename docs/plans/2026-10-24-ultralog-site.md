# ultralog.co on Nuxt + Cloudflare

Status: built and verified locally (2026-10-24). Not deployed, no remote. Open decisions at the end.

Source brief: `design/HANDOFF-WEBSITE.md` and `design/design-system/5-website.md` (copied from the
UltraLog design handoff). This doc records how the brief is implemented and what is still open.

## Repo layout

New repo, separate from the app (`ClassicMiniDIY/UltraLog` keeps `docs/index.html` on GitHub Pages
until DNS moves).

```text
ultralog-site/
├── app/
│   ├── app.vue                 # head: theme bootstrap script, fonts preload, OG/meta defaults
│   ├── assets/css/main.css     # @import tailwindcss + tokens.css + @theme map + component CSS
│   ├── components/             # SiteNav, SiteHero, HeroDownload, FeatureCard, DownloadCards,
│   │                           # ReleaseCard, ModeBand, EcuGrid, SiteFooter, UlIcon
│   ├── composables/            # useTheme, useSite (useReleases, useVisitor)
│   ├── data/content.ts         # features, modes, 3.0 What's New, links
│   ├── pages/                  # index, download, releases, docs, ecus/index, ecus/[slug]
│   └── utils/                  # platform.ts (OS detection, cards), theme.ts (bootstrap), icons, format
├── shared/                     # types/site.ts, utils/ecus.ts (18 formats; used by app, server, config)
├── server/
│   ├── api/releases.json.get.ts  # every release, normalized (prerendered)
│   ├── api/ecus/[slug].get.ts    # /api/ecus/<slug>.json: wiki section + OECUA channel map
│   ├── routes/                 # sitemap.xml, robots.txt
│   └── utils/                  # github.ts (fetch + normalize), markdown.ts, ecus.ts (wiki, OECUA)
├── public/                     # logos, favicon, og.png, screenshots/*.webp
├── source/screenshots/         # app screenshots (PNG), input to `bun run screenshots`
├── design/                     # the Night Drive handoff (reference only, not served)
├── wrangler.jsonc              # static-assets-only Worker
└── docs/plans/                 # this file
```

## Stack

- **Nuxt 4.6.2** (latest stable on 2026-10-24), Vue 3 `<script setup>`, TypeScript strict, Bun.
- **Tailwind CSS 4** via `@tailwindcss/vite`. `@theme inline` maps every colour utility to a token
  variable (`--color-cyan: var(--cyan)`), and the default Tailwind palette is cleared
  (`--color-*: initial`), so a raw colour utility does not exist. Component CSS from the handoff
  (`ul-*` classes) is ported as-is; it already reads only tokens.
- **No Nuxt Content** yet. `/docs` links to the GitHub wiki (see decision 4).
- **Screenshots** are WebP files at 760 and 1520 px, made by `scripts/screenshots.ts` (sharp) and
  committed. `@nuxt/image` was tried and dropped: in static output it only generated images for
  the visible tab, and it names WebP files `.png`, which Cloudflare would serve as `image/png`.
- **`marked`** at build time only, for release notes. Raw HTML in a release body is dropped and links
  are limited to `http(s)`.

## Cloudflare deployment

- `nuxt generate` → `.output/public`. Every route is prerendered; there is no server at runtime.
- Deployed as a **Worker with static assets only** (no `main`), the current Cloudflare
  recommendation over Pages. `wrangler.jsonc`: `assets.directory = .output/public`,
  `html_handling: "drop-trailing-slash"` (same as OpenECUAlliance), `not_found_handling: "404-page"`.
- CI (`.github/workflows/deploy.yml`, not yet added to any remote): on push to `main`, on
  `repository_dispatch` type `app-release`, on `workflow_dispatch`, and a daily `schedule` backstop.
  Steps: checkout → `oven-sh/setup-bun` → `bun install --frozen-lockfile` → `bun run generate`
  with `GITHUB_TOKEN` → `cloudflare/wrangler-action@v3` → curl smoke test of `/`, `/download`,
  `/releases`. Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (the built-in
  `GITHUB_TOKEN` is enough for reading public releases).

## Release-driven content

- `server/utils/github.ts` calls `GET /repos/ClassicMiniDIY/UltraLog/releases?per_page=100`
  (paginated, `Authorization: Bearer $GITHUB_TOKEN` when set; unauthenticated works for local
  builds at 60 requests an hour). Drafts are skipped.
- Asset → platform by file name (`app/utils/platform.ts`):
  `.dmg` + `arm64|aarch64|apple-silicon` → macOS Apple Silicon, `.dmg` + `intel|x86_64|x64` →
  macOS Intel, `.msi`/`.exe`/`windows*.zip` → Windows, `.AppImage`/`.deb`/`.rpm`/`linux*.tar.gz` →
  Linux. Size from `asset.size`, SHA-256 from `asset.digest` (GitHub fills it for uploads since
  2025). Today's assets are `ultralog-macos-arm64.dmg`, `ultralog-macos-intel.dmg`,
  `ultralog-windows.zip`, `ultralog-linux.tar.gz`.
- Release notes: the body is cut at `## Installation` (the boilerplate install steps, the
  generated "What's Changed" list with its emoji headings, and the changelog link). About 35 older
  bodies open with `## Installation`; for those the generated PR list is used instead, without
  the emoji group headings and with "by @user in <url>" shortened to a PR link. The rest is
  rendered to HTML at build. The ReleaseCard bullets are the body's top-level list items (bold
  lead kept, hard-wrapped lines joined), up to six; the full rendered notes go on `/releases`.
- "Latest" is the highest stable semver, not the newest by date, so a 2.x backport published
  after 3.0.0 does not replace 3.0.0 in the hero and downloads.
- `/api/releases.json` is a Nitro route listed in `nitro.prerender.routes`, so it is fetched once during
  `nuxt generate` and written out as a static JSON file. Pages call `useFetch('/api/releases.json')`
  with `transform` so `/` only carries the latest release in its payload.
- Prereleases: never the hero version, DownloadCards or "Latest". Listed on `/releases` with a
  "Pre-release" warning badge.
- **Rebuild on a new release.** The brief says to add an app-repo workflow on `release: published`.
  That event never fires here: `release.yml` creates the release with `softprops/action-gh-release`
  and the default `GITHUB_TOKEN`, and GitHub does not start workflows from events that
  `GITHUB_TOKEN` causes. The working hook is two parts in the **UltraLog** repo:
  1. A last step in `release.yml`, after the assets upload:
     `gh api repos/ClassicMiniDIY/<site-repo>/dispatches -f event_type=app-release` with a
     fine-grained PAT (`SITE_DISPATCH_TOKEN`, site repo only, Contents read/write).
  2. A small workflow on `release: [edited]` doing the same dispatch, because the feature notes are
     written with `gh release edit` after publish (Cole's own token, so this event does fire).
  The daily schedule in the site's deploy workflow catches anything both miss.

## Themes

- `design/tokens/tokens.css` is imported unchanged; Vite resolves its `@font-face` URLs to
  `design/fonts/woff2/` and fingerprints the files. Saira 800 italic and Outfit 400 are preloaded.
- Composition, matching the app's rule (chrome from intensity, data from Color blind mode, High
  contrast over both): `<html data-theme="stealth|night|ultra|hc">` and, when Color blind mode is on
  and High contrast is off, `<body data-theme="cvd">`. The `cvd` block only re-declares ink, line,
  status and data tokens, so it layers over the intensity grounds the way the app composes them.
- An inline script in `<head>` sets the `<html>` value and a second one at `bodyOpen` sets the
  `<body>` value, both before first paint. They read `localStorage` (`ultralog-site:intensity`,
  `ultralog-site:cvd`) and `matchMedia('(prefers-contrast: more)')`, all in `try/catch`.
- Footer: **Color blind mode** checkbox and an **Ultra intensity** segmented control
  (Stealth / Night Drive / Ultra). With High contrast active, both are disabled and a caption says
  why, as in the app.
- Known deviation from the app: `cvd` re-declares `--redline-*` and `--grid-floor`, so with Color
  blind mode on, Stealth shows the full redline and Ultra loses the magenta floor tint. The app
  interpolates per token in Rust; the CSS tokens have no combined theme for this.
- `prefers-reduced-motion: reduce` turns off transitions and glow hover changes.
- Without JS the page renders in `night` (the `:root` defaults), all three DownloadCards look equal,
  and the theme controls are hidden.

## Pages

- `/` SiteHero · three FeatureCards · mode screenshot band · What's New in 3.0 (copy from the
  current site) · supported ECUs grid · DownloadCards · latest ReleaseCard · footer.
- `/download` DownloadCards for the latest stable release, a table of every asset with size and
  SHA-256, and the last ten stable versions with links.
- `/releases` every release as a ReleaseCard with the rendered notes.
- `/docs` wiki links (Getting started, User guide, Supported formats, Computed channels, MCP) and
  the issue / discussion links.
- `/ecus` and `/ecus/[slug]` one page per supported format: maker, file types, how to export,
  parser notes, a link to the sample log in `exampleLogs/`, and, where an OpenECU Alliance adapter
  exists, the channel table built from it at build time (source names → normalized name, unit).

## Open items before deployment

1. Screenshots in the Night Drive look exist only for Log Viewer and Lambda Delay
   (`docs/screenshots/` on `origin/release/3.0.0`). Scatter Plot and Histogram use the pre-3.0
   images (old grey theme, jet colour map); Accel Enrichment has none and shows a text note.
   Retake those three, put the PNGs in `source/screenshots/`, run `bun run screenshots`.
2. The 3.0.0 What's New copy is hard-coded from the current site (`app/data/content.ts`) and only
   shows once the latest stable tag is 3.x. After 3.0.0 ships it can come from the release body.
3. Old URLs: the GitHub Pages site had only `/` (plus `robots.txt`, `sitemap.xml`), so no redirects
   are needed. The new sitemap is generated at build.

## Verification (2026-10-24, local `nuxt generate` served statically)

- `bun run typecheck` clean; `bun run generate` prerenders 69 routes; `wrangler deploy --dry-run`
  reads 136 asset files.
- Lighthouse 12 on `/`: mobile performance 95, accessibility 100, best practices 100, SEO 100
  (LCP 2.4 s, CLS 0.002, TBT 10 ms); desktop 100 / 100 / 100 / 100. `/download`, `/releases`,
  `/docs`, `/ecus`, `/ecus/haltech`, `/ecus/rusefi`: accessibility, best practices and SEO 100.
- Hero, FeatureCards, DownloadCards and ReleaseCard compared against `design/reference/*-night.png`
  at 960 px. The reference DownloadCard shows `.msi` and an AppImage; the real assets are `.zip`
  and `.tar.gz`, and the site shows what the release has.
- Theme: Color blind mode + Ultra persist across reload with no flash (the head script runs before
  the stylesheet); `prefers-contrast: more` gives `hc` with the controls disabled; 375 px has no
  horizontal scroll; phones get three equal cards.
- `RELEASES_FIXTURE` with the latest tag set to v3.0.0 shows the "New in 3.0" section.

## App-repo hook (not applied; needs approval)

Last step of the `release` job in UltraLog's `.github/workflows/release.yml`, after the assets upload:

```yaml
      - name: Rebuild ultralog.co
        if: needs.check-tag.outputs.is_prerelease == 'false'
        env:
          GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
        run: gh api repos/ClassicMiniDIY/ultralog-site/dispatches -f event_type=app-release
```

New `.github/workflows/site-dispatch.yml` for notes edited after publish:

```yaml
name: Rebuild ultralog.co on release edit
on:
  release:
    types: [edited]
jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - env:
          GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
        run: gh api repos/ClassicMiniDIY/ultralog-site/dispatches -f event_type=app-release
```

## Decisions that need Cole

1. **GitHub repo name and org.** Proposed: `ClassicMiniDIY/ultralog-site`, public.
2. **Cloudflare account and Worker name.** Proposed: the ClassicMiniDIY account that already hosts
   `open-ecu-alliance.classicminidiy.workers.dev`, Worker `ultralog-site`.
3. **DNS move of ultralog.co.** Add the zone to Cloudflare (or move it), attach the custom domain to
   the Worker, then delete `docs/CNAME` and turn off GitHub Pages in the UltraLog repo.
4. **Wiki import.** Keep `/docs` as links to the GitHub wiki (current build), or import
   `UltraLog.wiki` into Nuxt Content at build (adds a second repo checkout to CI and a
   wiki-link rewrite pass).
5. **App-repo hook.** Approve adding the dispatch step to `release.yml` and the `release: edited`
   workflow, and creating the `SITE_DISPATCH_TOKEN` PAT.
