import type { EcuDetail } from '#shared/types/site'
import { findEcu } from '#shared/utils/ecus'

// /api/ecus/<slug>.json, prerendered for every format at build (see nitro.prerender.routes).
// The .json suffix gives the static file a JSON content type on Cloudflare.
export default defineEventHandler(async (event): Promise<EcuDetail> => {
  const slug = (getRouterParam(event, 'slug') ?? '').replace(/\.json$/, '')
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
