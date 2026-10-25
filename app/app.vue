<script setup lang="ts">
import sairaDisplay from '~~/design/fonts/woff2/saira-latin-800-italic.woff2?url'
import outfitBody from '~~/design/fonts/woff2/outfit-latin-400-normal.woff2?url'
import { BODY_BOOTSTRAP, HEAD_BOOTSTRAP } from '~/utils/theme'

useHead({
  script: [
    // Theme before first paint: no flash of the default theme for a stored choice.
    { key: 'theme-html', innerHTML: HEAD_BOOTSTRAP, tagPriority: 'critical' },
    { key: 'theme-body', innerHTML: BODY_BOOTSTRAP, tagPosition: 'bodyOpen' },
  ],
  link: [
    // The hero headline and body text are the first things painted.
    { rel: 'preload', as: 'font', type: 'font/woff2', href: sairaDisplay, crossorigin: '' },
    { rel: 'preload', as: 'font', type: 'font/woff2', href: outfitBody, crossorigin: '' },
  ],
})
</script>

<template>
  <a href="#main" class="ul-skip">Skip to content</a>
  <div class="ul-site">
    <SiteNav />
    <main id="main">
      <NuxtPage />
    </main>
    <SiteFooter />
  </div>
</template>
