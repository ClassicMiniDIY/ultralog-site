import tailwindcss from '@tailwindcss/vite'
import { ECUS } from './shared/utils/ecus'
import { colors } from './design/tokens/tokens'
import { docsPath, listWikiFiles } from './server/utils/wiki'

const SITE_URL = 'https://ultralog.co'
// scripts/sync-wiki.ts runs before nuxt, so the wiki is on disk when this file loads.
const WIKI = listWikiFiles()

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  typescript: { strict: true },

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      titleTemplate: '%s · UltraLog',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: colors.night['bg-void'] },
        { name: 'color-scheme', content: 'dark' },
        { property: 'og:site_name', content: 'UltraLog' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: `${SITE_URL}/og.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@classicminidiy' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    // Read only at build time by the prerendered server routes.
    githubToken: process.env.GITHUB_TOKEN ?? '',
    public: { siteUrl: SITE_URL },
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/download',
        '/releases',
        '/docs',
        '/ecus',
        '/api/releases.json',
        '/sitemap.xml',
        '/robots.txt',
        '/_redirects',
        ...ECUS.map((e) => `/ecus/${e.slug}`),
        ...ECUS.map((e) => `/api/ecus/${e.slug}.json`),
        '/api/docs-nav.json',
        '/api/search-index.json',
        ...WIKI.map((f) => docsPath(f)),
        ...WIKI.map((f) => `/api/docs/${f.slug || 'index'}.json`),
      ],
      failOnError: true,
    },
  },
})
