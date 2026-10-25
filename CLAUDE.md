# CLAUDE.md

ultralog.co: the website for UltraLog (ClassicMiniDIY/UltraLog), the Rust/egui ECU log viewer.
Nuxt 4 + Vue 3 `<script setup>` + TypeScript strict, Bun, Tailwind CSS 4 via `@tailwindcss/vite`,
fully prerendered (`nuxt generate`) and served as a static-assets-only Cloudflare Worker.
Design doc and open decisions: `docs/plans/2026-10-24-ultralog-site.md`.

```bash
bun install
bun run dev          # http://localhost:3000
bun run generate     # .output/public; set GITHUB_TOKEN to avoid the 60/h API limit
bun run typecheck
bun run screenshots  # after changing source/screenshots/*.png
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
  a failure fails the build on purpose. Pages read `/api/releases` through `useReleases(key, pick)`
  so each page's payload holds only what it renders.
- **Release notes** are cut at `## Installation` / `## What's Changed` before rendering, and all
  Markdown from GitHub or the wiki goes through `createMarkdown` (raw HTML dropped, http(s) links
  only). Keep that true for anything rendered with `v-html`.
- **ECU pages** render the wiki's Supported-ECU-Formats section whose `## ` heading starts with
  `wikiSection` (`shared/utils/ecus.ts`). Renaming a heading in the wiki blanks that page's copy
  (the build logs a warning). Channel tables come from the OpenECU Alliance adapter in `oecua`.
- **Screenshots** are committed WebP files in `public/screenshots/<name>-{760,1520}.webp`,
  generated from `source/screenshots/*.png`. `@nuxt/image` was dropped: its static output only
  covered the visible tab and named WebP files `.png`, which Cloudflare serves as `image/png`.
- **Mode band** renders every tab panel (inactive ones `hidden`) so no panel needs a fetch.
- `RELEASES_FIXTURE=<file>` builds from a saved API response (offline, or previewing a release
  that does not exist yet; the "New in 3.0" section only shows when the latest tag is 3.x).
