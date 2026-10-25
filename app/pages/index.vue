<script setup lang="ts">
import { ECU_COUNT } from '#shared/utils/ecus'
import { FEATURES, LINKS, WHATS_NEW_3 } from '~/data/content'

const { data: latest } = await useReleases('latest', (all) => latestStable(all))

// The 3.0 copy is shown once 3.0 is the release people download.
const showWhatsNew = computed(() => Number(latest.value?.tag.replace(/^v/, '').split('.')[0]) >= 3)

const description = `Free, open-source ECU log viewer for Haltech, ECUMaster, Speeduino, rusEFI, AiM, Link and ${ECU_COUNT - 6} more formats. Stacked plots, histograms, lambda delay and accel enrichment tables. macOS, Windows and Linux.`

useSeoMeta({
  title: 'Free ECU log viewer',
  titleTemplate: 'UltraLog · %s',
  description,
  ogTitle: 'UltraLog · Free ECU log viewer',
  ogDescription: description,
  ogUrl: 'https://ultralog.co/',
  ogImageAlt: 'UltraLog: a striped synthwave sun over a neon grid floor.',
})
useHead({ link: [{ rel: 'canonical', href: 'https://ultralog.co/' }] })
</script>

<template>
  <div>
    <SiteHero :eyebrow="`Free · open source · ${ECU_COUNT} log formats`" lede="The fast, beautiful ECU log viewer for tuners. Haltech to Speeduino, street to track.">
      <template #title>Unlock your <em>performance</em> data</template>
      <template #cta><HeroDownload :release="latest ?? null" /></template>
    </SiteHero>

    <section id="features" class="ul-section" aria-labelledby="features-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="features-title" class="ul-section__title">14 analyzers. {{ ECU_COUNT }} log formats. Free, forever.</h2>
        </div>
        <div class="ul-features">
          <FeatureCard v-for="f in FEATURES" :key="f.title" v-bind="f" />
        </div>
      </div>
    </section>

    <section class="ul-section" aria-labelledby="modes-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="modes-title" class="ul-section__title">Five tools, one log</h2>
          <p class="ul-section__lede">Every view reads the same log, one keystroke apart.</p>
        </div>
        <ModeBand />
      </div>
    </section>

    <section v-if="showWhatsNew" class="ul-section" aria-labelledby="new-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="new-title" class="ul-section__title">New in 3.0</h2>
          <NuxtLink to="/releases" class="ul-btn ul-btn--ghost ul-section__more">All releases<UlIcon name="arrow" /></NuxtLink>
        </div>
        <ul class="ul-news">
          <li v-for="n in WHATS_NEW_3" :key="n.title" class="ul-news__card">
            <h3>{{ n.title }}</h3>
            <p>{{ n.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="ul-section" aria-labelledby="ecus-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="ecus-title" class="ul-section__title">Supported ECUs and loggers</h2>
          <p class="ul-section__lede">CSV and binary logs, opened as the ECU writes them.</p>
        </div>
        <EcuGrid />
      </div>
    </section>

    <section id="download" class="ul-section" aria-labelledby="download-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="download-title" class="ul-section__title">Download UltraLog</h2>
          <p class="ul-section__lede">macOS, Windows and Linux. Always free.</p>
          <NuxtLink to="/download" class="ul-btn ul-btn--ghost ul-section__more">Checksums and older versions<UlIcon name="arrow" /></NuxtLink>
        </div>
        <DownloadCards :release="latest ?? null" />
      </div>
    </section>

    <section v-if="latest" class="ul-section" aria-labelledby="latest-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="latest-title" class="ul-section__title">Latest release</h2>
          <a :href="LINKS.releases" class="ul-btn ul-btn--ghost ul-section__more">On GitHub<UlIcon name="external" /></a>
        </div>
        <ReleaseCard :release="latest" latest />
      </div>
    </section>
  </div>
</template>
