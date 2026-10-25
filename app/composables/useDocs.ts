import type { DocNavGroup, DocPage } from '#shared/types/site'

/**
 * A wiki page and the docs sidebar, both from prerendered JSON. `slug` is '' for the docs home.
 * Not async: the page awaits the result in <script setup>, which keeps the Nuxt context
 * for anything called after the await (a composable that awaits internally loses it).
 */
export function useDocPage(slug: string) {
  const id = slug || 'index'
  const page = useFetch<DocPage>(`/api/docs/${id}.json`, { key: `doc:${id}` })
  const nav = useFetch<DocNavGroup[]>('/api/docs-nav.json', { key: 'docs-nav' })
  const title = () => (slug ? (page.data.value?.title ?? 'Docs') : 'Docs')
  useSeoMeta({
    title,
    description: () =>
      slug
        ? `${title()}: UltraLog documentation.`
        : 'UltraLog documentation: install, user guide, supported ECU formats, tuning table generators and more.',
  })
  return { page, nav }
}
