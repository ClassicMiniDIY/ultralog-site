<script setup lang="ts">
import type { Release } from '#shared/types/site'

// The hero's primary action. Prerendered as "Download" → /download; once the visitor's OS is known
// it becomes "Download for macOS" pointing at that build.
const props = defineProps<{ release: Release | null }>()
const visitor = useVisitor()

const build = computed(() => {
  const p = visitor.value?.platform
  if (!p) return null
  return platformBuilds(props.release, visitor.value).find((b) => b.platform === p && b.forVisitor) ?? null
})
const version = computed(() => props.release?.tag ?? '')
const caption = computed(() => {
  if (!version.value) return ''
  return build.value ? `${version.value} · ${archLabel(build.value.primary)}` : `${version.value} · macOS, Windows, Linux`
})
</script>

<template>
  <a v-if="build" :href="build.primary.url" class="ul-btn ul-btn--primary ul-btn--lg">
    <UlIcon name="download" />Download for {{ build.os }}
  </a>
  <NuxtLink v-else to="/download" class="ul-btn ul-btn--primary ul-btn--lg">
    <UlIcon name="download" />Download
  </NuxtLink>
  <NuxtLink to="/docs" class="ul-btn ul-btn--lg">View docs</NuxtLink>
  <span v-if="caption" class="ul-caption ul-mono">{{ caption }}</span>
</template>
