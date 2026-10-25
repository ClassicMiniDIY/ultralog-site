<script setup lang="ts">
import type { Release } from '#shared/types/site'

// Homepage form shows the top bullets; `full` renders the whole release notes (/releases).
const props = withDefaults(defineProps<{ release: Release; latest?: boolean; full?: boolean; headingLevel?: 2 | 3 }>(), {
  latest: false,
  full: false,
  headingLevel: 3,
})
const heading = computed(() => `h${props.headingLevel}`)
</script>

<template>
  <article :id="release.tag" class="ul-release">
    <div class="ul-release__head">
      <component :is="heading" class="ul-release__ver">{{ release.tag }}</component>
      <span v-if="latest" class="ul-badge ul-badge--success"><UlIcon name="check" />Latest</span>
      <span v-if="release.prerelease" class="ul-badge ul-badge--warning"><UlIcon name="warning" />Pre-release</span>
      <a :href="release.url" class="ul-caption ul-mono ul-release__src">
        <time :datetime="release.publishedAt">{{ formatDate(release.publishedAt) }}</time> · GitHub
        <span class="sr-only">release notes for {{ release.tag }}</span>
      </a>
    </div>
    <!-- Release notes are rendered from Markdown at build with raw HTML dropped (server/utils/markdown.ts). -->
    <div v-if="full && release.notesHtml" class="ul-prose" v-html="release.notesHtml" />
    <ul v-else-if="release.highlights.length">
      <li v-for="(h, i) in release.highlights" :key="i" v-html="h" />
    </ul>
  </article>
</template>
