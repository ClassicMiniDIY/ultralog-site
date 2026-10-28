// Cloudflare Workers static assets redirect rules, prerendered to .output/public/_redirects
// (https://developers.cloudflare.com/workers/static-assets/redirects/). Built here, not committed
// to public/, because the docs lines follow the wiki's page list.
export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  const lines = [
    '# Older iOS asks for this name before reading <link rel="apple-touch-icon">.',
    '/apple-touch-icon-precomposed.png /apple-touch-icon.png 200',
    '# GitHub wiki page names (/docs/User-Guide, /docs/Home) to the site slugs.',
    ...listWikiFiles()
      .filter((f) => f.name !== docsPath(f).slice('/docs/'.length))
      .map((f) => `/docs/${f.name} ${docsPath(f)} 301`),
  ]
  return `${lines.join('\n')}\n`
})
