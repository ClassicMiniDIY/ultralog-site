<script setup lang="ts">
import { LINKS } from '~/data/content'
</script>

<template>
  <header class="ul-nav">
    <nav class="ul-wrap ul-nav__row" aria-label="Main">
      <NuxtLink to="/" class="ul-nav__home" aria-label="UltraLog home">
        <img src="/logos/ultralog-lockup.svg" alt="UltraLog" width="134" height="28" />
      </NuxtLink>
      <div class="ul-nav__links">
        <a href="/#features" class="ul-nav__link ul-nav__link--wide">Features</a>
        <NuxtLink to="/ecus" class="ul-nav__link ul-nav__link--wide">ECUs</NuxtLink>
        <NuxtLink to="/docs" class="ul-nav__link">Docs</NuxtLink>
        <NuxtLink to="/releases" class="ul-nav__link">Releases</NuxtLink>
        <a :href="LINKS.repo" class="ul-nav__link">GitHub</a>
      </div>
    </nav>
  </header>
</template>
