// Prerendered to a static JSON file at build (see nitro.prerender.routes).
export default defineEventHandler((event) => {
  const { githubToken } = useRuntimeConfig(event)
  return getReleases(githubToken)
})
