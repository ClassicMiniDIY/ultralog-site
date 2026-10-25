# Docs search

Status: implemented 2026-10-25 (branch `feature/docs-search`).

The `/docs` pages come from the GitHub wiki (about 150 KB of Markdown over 14 pages). Search finds
a section, not just a page, and jumps to its heading.

## Decisions

- **Index at build time, search in the browser.** The site is fully static. A prerendered route,
  `/api/search-index.json`, holds one entry per section: the page intro plus every `h2` and `h3`.
  Each entry has the path with its anchor, the page title, the heading and the section's plain
  text. The browser fetches the index on the first focus of the search box, never on page load,
  so it costs nothing for visitors who do not search.
- **No search library.** The index is 564 sections (190 KB raw, 56 KB gzipped), which fit a
  linear scan in well under a millisecond. `shared/utils/search.ts` (unit-tested) does the matching. A library such as
  MiniSearch or Fuse.js would add weight and a second index format for no gain at this size.
  Revisit only if the wiki grows past a few thousand sections.
- **Index from the rendered HTML, not the Markdown.** Splitting `renderWikiPage().html` at the
  heading tags gives the same ids the page uses, so every result anchor lands on a real heading.
  Block tags become spaces and inline tags are dropped (so `<code>x</code>)` reads `x)`), image
  alt text is kept, and entities are decoded, so code, tables and link text are searchable.
- **Matching.** The query is split into terms on anything that is not a letter or digit,
  case-folded and accent-folded one code point at a time (so the snippet highlighter and the
  matcher always agree). Every term must match (AND). A term matches as a substring, and a match
  at a word start scores higher; terms of one or two characters match only at a word start. The
  heading counts most, then the page title, then the body (repeats capped). A heading equal to
  the query, and the whole query as one phrase in the body, add bonuses. Ties keep wiki order.
- **UI.** A combobox at the top of the docs sidebar (above the fold-out on narrow screens), with
  the ARIA 1.2 combobox/listbox pattern. Up/Down move the active result, Enter opens it, Escape
  clears, and `/` focuses the box from anywhere on a docs page. A result shows page > heading
  and a snippet with the matched terms in `<mark>`. The snippet is built from text segments and
  rendered with `v-for`, never `v-html`, so indexed text cannot inject markup.
- **No-JS:** the box is hidden (`html:not(.js)`); the sidebar still lists every page.
- **Links stay links.** Each result is a real `<a>`, so Cmd/Ctrl-click opens a new tab. Enter
  opens the active result; IME composition keys are ignored. Choosing the intro of the page you
  are on scrolls to the top, which the router does not do for a same-path link.
