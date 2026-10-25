<script setup lang="ts">
import type { DocNavGroup, DocPage } from '#shared/types/site'

// Docs layout: wiki sidebar on the left, the page, "On this page" on the right (wide screens).
// On narrow screens the sidebar folds into a disclosure above the page.
const props = defineProps<{ page: DocPage; nav: DocNavGroup[] }>()
const route = useRoute()
const current = computed(() => route.path.replace(/\/$/, '') || '/docs')
const currentTitle = computed(() => props.nav.flatMap((g) => g.items).find((i) => i.path === current.value)?.title)
</script>

<template>
  <div class="ul-wrap ul-docs">
    <nav class="ul-docs__nav" aria-label="Docs">
      <details class="ul-docs__fold">
        <summary class="ul-btn ul-btn--block">
          <UlIcon name="book" />{{ currentTitle ?? 'All docs' }}
        </summary>
        <DocsNavList :nav="nav" :current="current" />
      </details>
      <div class="ul-docs__side">
        <NuxtLink to="/docs" class="ul-docs__home" :aria-current="current === '/docs' ? 'page' : undefined">Docs home</NuxtLink>
        <DocsNavList :nav="nav" :current="current" />
      </div>
    </nav>

    <article class="ul-docs__main">
      <!-- Rendered at build from the GitHub wiki with raw HTML dropped (server/utils/markdown.ts). -->
      <div class="ul-prose ul-prose--docs" v-html="page.html" />
      <p class="ul-caption ul-docs__edit">
        From the <a :href="page.sourceUrl">GitHub wiki</a>.
        <a :href="page.editUrl">Edit this page</a>
      </p>
    </article>

    <aside v-if="page.toc.length > 1" class="ul-docs__toc" aria-labelledby="toc-title">
      <h2 id="toc-title" class="ul-overline">On this page</h2>
      <ul>
        <li v-for="t in page.toc" :key="t.id"><a :href="`#${t.id}`">{{ t.text }}</a></li>
      </ul>
    </aside>
  </div>
</template>
