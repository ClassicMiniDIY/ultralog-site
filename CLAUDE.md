# CLAUDE.md

ultralog.co: the website for UltraLog (ClassicMiniDIY/UltraLog), the Rust/egui ECU log viewer.
Nuxt 4 + Vue 3 `<script setup>` + TypeScript strict, Bun, Tailwind CSS 4 via `@tailwindcss/vite`,
fully prerendered (`nuxt generate`) and served as a static-assets-only Cloudflare Worker.
Design doc: `docs/plans/2026-10-24-ultralog-site.md`. Deployment runbook: `docs/cloudflare-setup.md`.

```bash
bun install
bun run dev          # http://localhost:3000
bun run generate     # .output/public; set GITHUB_TOKEN to avoid the 60/h API limit
bun run typecheck
bun run screenshots  # after changing source/screenshots/*.png
bun run test         # Vitest
bun run sync:wiki    # refresh .wiki/ (dev and generate do this too)
```

## Design system

UI follows `design/` (the Night Drive handoff): `design/design-system/README.md` and
`5-website.md`, component previews in `design/design-system/components/`, renders in
`design/reference/`. **Never hard-code a colour.** Every colour is a token from
`design/tokens/tokens.css` (imported unchanged by `app/assets/css/main.css`); in TypeScript use
`design/tokens/tokens.ts`. Tailwind's default palette is cleared, so only token-backed utilities
(`bg-panel`, `text-ink-muted`, `border-line`, …) exist. The `ul-*` classes in
`app/assets/css/components.css` are ported from the handoff's `bundle.css`; keep their names.

## Load-bearing contracts

- **Theme composition.** `<html data-theme>` carries intensity (`stealth|night|ultra`) or `hc`;
  Color blind mode is `<body data-theme="cvd">`, layered over the intensity grounds, never with
  `hc`. The inline bootstrap scripts in `app/utils/theme.ts` set both before first paint; they and
  `useTheme` must agree on the storage keys. Do not set `data-theme` through `useHead`
  `htmlAttrs`/`bodyAttrs`: hydration would overwrite the stored choice.
- **Release data is fetched once per build** (`server/utils/github.ts`, module-level promise) and
  a failure fails the build on purpose. Pages read `/api/releases.json` through `useReleases(key, pick)`
  so each page's payload holds only what it renders.
- **Release notes** are cut at `## Installation` / `## What's Changed` before rendering (older
  bodies that open with `## Installation` fall back to the generated PR list). All Markdown from
  GitHub or the wiki goes through `createMarkdown`: raw HTML dropped, image alt text escaped, and
  links resolved against the source's GitHub URL and kept only if http(s)/mailto. Resolving also
  keeps relative links away from the prerender crawler, which would otherwise 404 and fail the
  build. Keep that true for anything rendered with `v-html`; `test/markdown.test.ts` covers it.
- **"Latest" is the highest stable semver** (`prepareReleases`), not the newest by date, so a 2.x
  backport published after 3.0.0 does not take over the hero and downloads.
- **API files end in `.json`** (`/api/releases.json`, `/api/ecus/<slug>.json`) so Cloudflare serves
  them as JSON; an extensionless static file gets no content type.
- **ECU pages** render the wiki's Supported-ECU-Formats section headed `## <wikiSection>`
  (optionally followed by ` - …` or ` / …`; `shared/utils/ecus.ts`). Renaming a heading in the wiki
  fails the CI build; a wiki or OECUA fetch failure only adds a `::warning::` so an outage does not
  block a release deploy. Channel tables come from the OpenECU Alliance adapter in `oecua`.
- **Docs are the GitHub wiki**, cloned into `.wiki/` by `scripts/sync-wiki.ts` (the `dev`,
  `generate` and `build` scripts run it first; `WIKI_DIR=../UltraLog.wiki` previews a local
  checkout, including unpushed edits). `nuxt.config.ts` reads the clone for the prerender list,
  so the sync must run before nuxt. Wiki links are rewritten to `/docs/<page>` only when that page
  exists (`docsHref`); anything else resolves on github.com, so the crawler never sees a dead link.
  Nuxt Content is deliberately not used (design doc, Stack).
- **Screenshots** are committed WebP files in `public/screenshots/<name>-{760,1520}.webp`,
  generated from `source/screenshots/*.png`. `@nuxt/image` was dropped: its static output only
  covered the visible tab and named WebP files `.png`, which Cloudflare serves as `image/png`.
- **Mode band** renders every tab panel (inactive ones `hidden`) so no panel needs a fetch.
- `RELEASES_FIXTURE=<file>` builds from a saved API response (offline, or previewing a release
  that does not exist yet; the "New in 3.0" section only shows when the latest tag is 3.x).
