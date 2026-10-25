<script setup lang="ts">
import type { IconName } from '~/utils/icons'
import { LINKS } from '~/data/content'

// The docs live in the GitHub wiki for now (see docs/plans, decision 4).
const pages: { title: string; page: string; body: string; icon: IconName }[] = [
  { title: 'Getting started', page: 'Getting-Started', body: 'Install, open your first log and chart a channel.', icon: 'arrow' },
  { title: 'User guide', page: 'User-Guide', body: 'Every tool, panel and shortcut.', icon: 'book' },
  { title: 'Supported ECU formats', page: 'Supported-ECU-Formats', body: 'How to export from each ECU and what UltraLog reads.', icon: 'file' },
  { title: 'Tuning table generators', page: 'Tuning-Table-Generators', body: 'Lambda delay and accel enrichment tables, measures and confidence.', icon: 'grid' },
  { title: 'Field normalization', page: 'Field-Normalization', body: 'Map ECU channel names to one standard set.', icon: 'chart' },
  { title: 'Unit conversion', page: 'Unit-Conversion', body: 'Display units for temperature, pressure, AFR and more.', icon: 'timer' },
  { title: 'Troubleshooting', page: 'Troubleshooting', body: 'A log will not open, or the numbers look wrong.', icon: 'warning' },
  { title: 'FAQ', page: 'FAQ', body: 'Short answers to common questions.', icon: 'book' },
]

useSeoMeta({
  title: 'Docs',
  description: 'UltraLog documentation: getting started, user guide, supported ECU formats and tuning table generators.',
})
</script>

<template>
  <div>
    <SiteHero variant="page" eyebrow="Docs" lede="The documentation is in the GitHub wiki. Start here.">
      <template #title>Read the <em>manual</em></template>
    </SiteHero>
    <section class="ul-section">
      <div class="ul-wrap">
        <ul class="ul-news">
          <li v-for="p in pages" :key="p.page">
            <a :href="`${LINKS.wiki}/${p.page}`" class="ul-news__card ul-doclink">
              <span class="ul-feature__icon"><UlIcon :name="p.icon" /></span>
              <span>
                <span class="ul-doclink__title">{{ p.title }}<UlIcon name="external" /></span>
                <span class="ul-doclink__body">{{ p.body }}</span>
              </span>
            </a>
          </li>
        </ul>
        <p class="ul-section__lede ul-docs__help">
          Something missing? <a :href="LINKS.newIssue">Open an issue</a> or ask in
          <a :href="LINKS.discussions">Discussions</a>.
        </p>
      </div>
    </section>
  </div>
</template>
