<script setup lang="ts">
const { data: releases } = await useReleases('all', (all) => all)

useSeoMeta({
  title: 'Releases',
  description: 'Release notes for every UltraLog version, from the GitHub releases.',
})
</script>

<template>
  <div>
    <SiteHero variant="page" eyebrow="Releases" lede="Every version, from the GitHub release notes.">
      <template #title>What <em>changed</em></template>
    </SiteHero>
    <section class="ul-section">
      <div class="ul-wrap ul-releases">
        <ReleaseCard
          v-for="r in releases ?? []"
          :key="r.tag"
          :release="r"
          :latest="r.latest"
          :heading-level="2"
          full
        />
      </div>
    </section>
  </div>
</template>
