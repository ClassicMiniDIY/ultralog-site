<script setup lang="ts">
import type { EcuDetail } from '#shared/types/site'
import { findEcu } from '#shared/utils/ecus'
import { LINKS } from '~/data/content'

const route = useRoute()
const slug = String(route.params.slug)
const ecu = findEcu(slug)
if (!ecu) throw createError({ statusCode: 404, statusMessage: 'Format not found', fatal: true })

const { data } = await useFetch<EcuDetail>(`/api/ecus/${slug}`, { key: `ecu:${slug}` })

const sampleUrl = ecu.sample ? `${LINKS.exampleLogs}/${ecu.sample.split('/').map(encodeURIComponent).join('/')}` : null

useSeoMeta({
  title: `${ecu.name} logs`,
  description: `Open ${ecu.name} logs (${ecu.extensions.join(', ')}) in UltraLog, the free ECU log viewer. ${ecu.summary}`,
})
</script>

<template>
  <div v-if="ecu">
    <SiteHero variant="page" :eyebrow="ecu.maker" :lede="ecu.summary">
      <template #title><em>{{ ecu.name }}</em> logs</template>
      <template #cta>
        <span v-for="x in ecu.extensions" :key="x" class="ul-badge ul-badge--ecu">{{ x }}</span>
        <a v-if="sampleUrl" :href="sampleUrl" class="ul-btn"><UlIcon name="file" />Sample log</a>
        <NuxtLink to="/download" class="ul-btn ul-btn--primary"><UlIcon name="download" />Download UltraLog</NuxtLink>
      </template>
    </SiteHero>

    <section class="ul-section" aria-label="How UltraLog reads this format">
      <div class="ul-wrap">
        <!-- Rendered at build from the wiki's Supported-ECU-Formats page, raw HTML dropped (server/utils/markdown.ts). -->
        <div v-if="data?.wikiHtml" class="ul-prose" v-html="data.wikiHtml" />
        <p v-else class="ul-section__lede">
          Export and parser notes are in the
          <a :href="`${LINKS.wiki}/Supported-ECU-Formats`">Supported ECU formats</a> wiki page.
        </p>
      </div>
    </section>

    <section v-if="data?.channels.length" class="ul-section" aria-labelledby="channels-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="channels-title" class="ul-section__title">Channel names</h2>
          <p class="ul-section__lede">
            With field normalization on, these {{ ecu.name }} names show as one standard name. From the
            <a v-if="data.adapter" :href="data.adapter.url">OpenECU Alliance {{ data.adapter.name }} adapter</a>
            <span class="ul-mono"> v{{ data.adapter?.version }}</span>.
          </p>
        </div>
        <div class="ul-table-wrap">
          <table class="ul-table">
            <thead>
              <tr>
                <th scope="col" class="ul-label">Shown as</th>
                <th scope="col" class="ul-label">Unit</th>
                <th scope="col" class="ul-label">Names in the log</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in data.channels" :key="c.name">
                <td class="ul-table__name">{{ c.name }}</td>
                <td class="ul-mono">{{ c.unit ?? '' }}</td>
                <td class="ul-mono ul-table__names">{{ c.sourceNames.join(' · ') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
