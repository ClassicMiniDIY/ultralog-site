<script setup lang="ts">
import type { DocNavGroup } from '#shared/types/site'

defineProps<{ nav: DocNavGroup[]; current: string }>()
</script>

<template>
  <div class="ul-docs__groups">
    <section v-for="g in nav" :key="g.title" class="ul-docs__group">
      <h2 class="ul-overline">{{ g.title }}</h2>
      <ul>
        <li v-for="i in g.items" :key="i.path">
          <NuxtLink :to="i.path" :aria-current="i.path === current ? 'page' : undefined">{{ i.title }}</NuxtLink>
        </li>
      </ul>
    </section>
  </div>
</template>
