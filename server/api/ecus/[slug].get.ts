import type { EcuDetail } from '#shared/types/site'
import { findEcu } from '#shared/utils/ecus'

// Prerendered for every format at build (see nitro.prerender.routes).
export default defineEventHandler(async (event): Promise<EcuDetail> => {
  const slug = getRouterParam(event, 'slug') ?? ''
  const ecu = findEcu(slug)
  if (!ecu) throw createError({ statusCode: 404, statusMessage: `Unknown format "${slug}"` })

  const [wikiHtml, oecua] = await Promise.all([
    getWikiSection(ecu.wikiSection),
    ecu.oecua ? getAdapter(ecu.oecua) : Promise.resolve(null),
  ])
  return {
    slug,
    wikiHtml,
    adapter: oecua?.adapter ?? null,
    channels: oecua?.channels ?? [],
  }
})
