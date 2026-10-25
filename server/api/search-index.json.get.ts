// Docs search index: one entry per wiki section. Prerendered; the docs search box fetches it on first focus.
export default defineEventHandler(() => buildSearchIndex())
