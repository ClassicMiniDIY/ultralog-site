<script setup lang="ts">
import type { IconName } from '~/utils/icons'

defineProps<{ icon: IconName; title: string; body: string }>()
</script>

<template>
  <article class="ul-feature ul-hex">
    <div class="ul-feature__icon"><UlIcon :name="icon" /></div>
    <h3>{{ title }}</h3>
    <p>{{ body }}</p>
  </article>
</template>
