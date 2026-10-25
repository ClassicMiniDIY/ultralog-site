<script setup lang="ts">
import type { Release } from '#shared/types/site'

// One DownloadCard per OS. The detected OS gets the is-you treatment (cyan frame, "Your system",
// primary button); without JS, or on a phone, all three cards are equal.
const props = defineProps<{ release: Release | null }>()
const visitor = useVisitor()
const builds = computed(() => platformBuilds(props.release, visitor.value))
</script>

<template>
  <div v-if="builds.length" class="ul-dl">
    <div
      v-for="b in builds"
      :key="b.platform"
      class="ul-dl__card"
      :class="{ 'is-you': b.forVisitor }"
    >
      <span v-if="b.forVisitor" class="ul-badge ul-badge--info">Your system</span>
      <span v-else class="ul-badge">{{ archLabel(b.primary) }}</span>
      <h3 class="ul-dl__os">{{ b.os }}</h3>
      <span class="ul-dl__meta">{{ assetMeta(b.primary) }}</span>
      <a
        :href="b.primary.url"
        class="ul-btn ul-btn--block"
        :class="{ 'ul-btn--primary': b.forVisitor }"
        :aria-label="`Download ${b.os} ${archLabel(b.primary)} ${b.primary.kind}`"
      >
        <UlIcon name="download" />Download
      </a>
      <span v-if="b.alternate" class="ul-dl__alt">
        {{ archLabel(b.alternate) }}:
        <a :href="b.alternate.url">{{ b.alternate.name }}</a>
        <span class="ul-mono"> · {{ formatSize(b.alternate.size) }}</span>
      </span>
    </div>
  </div>
  <p v-else class="ul-section__lede">
    No builds found for the latest release. Get them from
    <a href="https://github.com/ClassicMiniDIY/UltraLog/releases">GitHub releases</a>.
  </p>
</template>
