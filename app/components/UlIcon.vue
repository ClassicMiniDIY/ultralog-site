<script setup lang="ts">
import { ICONS, type IconName } from '~/utils/icons'

defineProps<{ name: IconName }>()
</script>

<template>
  <svg class="ul-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path v-for="d in ICONS[name]" :key="d" :d="d" />
  </svg>
</template>
