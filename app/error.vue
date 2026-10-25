<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useSeoMeta({ title: notFound.value ? 'Page not found' : 'Error', robots: 'noindex' })
</script>

<template>
  <div class="ul-site">
    <SiteNav />
    <main id="main">
      <SiteHero variant="page" :eyebrow="String(error.statusCode)" :lede="notFound ? 'That page is not here. It may have moved when the site was rebuilt.' : error.statusMessage">
        <template #title>{{ notFound ? 'Off the ' : 'Something ' }}<em>{{ notFound ? 'map' : 'broke' }}</em></template>
        <template #cta>
          <NuxtLink to="/" class="ul-btn ul-btn--primary">Go to the homepage</NuxtLink>
          <NuxtLink to="/download" class="ul-btn">Download</NuxtLink>
        </template>
      </SiteHero>
    </main>
  </div>
</template>
