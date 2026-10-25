<script setup lang="ts">
const { page, nav } = useDocPage('')
await Promise.all([page, nav])
if (!page.data.value) throw createError({ statusCode: 404, statusMessage: 'Docs page not found', fatal: true })
</script>

<template>
  <div>
    <SiteHero variant="docs" eyebrow="Docs" lede="Install UltraLog, open your first log, and get the most out of every tool.">
      <template #title>Read the <em>manual</em></template>
    </SiteHero>
    <section v-if="page.data.value" class="ul-section ul-section--docs">
      <DocsShell :page="page.data.value" :nav="nav.data.value ?? []" />
    </section>
  </div>
</template>
