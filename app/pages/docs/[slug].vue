<script setup lang="ts">
const route = useRoute()
const { page, nav } = useDocPage(String(route.params.slug))
await Promise.all([page, nav])
if (!page.data.value) throw createError({ statusCode: 404, statusMessage: 'Docs page not found', fatal: true })
</script>

<template>
  <div v-if="page.data.value">
    <SiteHero variant="docs" eyebrow="Docs">
      <template #title>{{ page.data.value.title }}</template>
    </SiteHero>
    <section class="ul-section ul-section--docs">
      <DocsShell :page="page.data.value" :nav="nav.data.value ?? []" />
    </section>
  </div>
</template>
