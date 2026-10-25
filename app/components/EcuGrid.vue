<script setup lang="ts">
import { ECUS } from '#shared/utils/ecus'
</script>

<template>
  <ul class="ul-ecus">
    <li v-for="e in ECUS" :key="e.slug">
      <NuxtLink :to="`/ecus/${e.slug}`" class="ul-ecu ul-hex">
        <span class="ul-ecu__name">{{ e.name }}</span>
        <span class="ul-ecu__maker">{{ e.summary }}</span>
        <span class="ul-ecu__exts">
          <span v-for="x in e.extensions" :key="x" class="ul-badge ul-badge--ecu">{{ x }}</span>
        </span>
      </NuxtLink>
    </li>
  </ul>
</template>
