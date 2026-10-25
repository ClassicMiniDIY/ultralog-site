import type { DocPage } from '#shared/types/site'

// /api/docs/<slug>.json (`index.json` is the wiki Home page), prerendered for every wiki page.
export default defineEventHandler((event): DocPage => {
  const slug = (getRouterParam(event, 'slug') ?? '').replace(/\.json$/, '')
  const file = listWikiFiles().find((f) => (f.slug || 'index') === slug)
  const page = file && renderWikiPage(file)
  if (!page) throw createError({ statusCode: 404, statusMessage: `No docs page "${slug}"` })
  return page
})
