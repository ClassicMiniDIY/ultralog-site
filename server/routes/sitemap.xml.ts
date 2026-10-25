import { ECUS } from '#shared/utils/ecus'

export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  const paths = [
    '/',
    '/download',
    '/releases',
    '/ecus',
    ...ECUS.map((e) => `/ecus/${e.slug}`),
    ...listWikiFiles().map((f) => docsPath(f)),
  ]
  const urls = paths.map((p) => `  <url><loc>${siteUrl}${p === '/' ? '/' : p}</loc></url>`).join('\n')
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
