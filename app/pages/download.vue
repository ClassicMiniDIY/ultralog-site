<script setup lang="ts">
import { LINKS } from '~/data/content'

const OLDER = 10

const { data } = await useReleases('download', (all) => {
  const stable = all.filter((r) => !r.prerelease)
  const latest = stable[0] ?? null
  return {
    latest,
    older: stable.slice(1, OLDER + 1).map((r) => ({ tag: r.tag, url: r.url, publishedAt: r.publishedAt })),
  }
})
const latest = computed(() => data.value?.latest ?? null)

useSeoMeta({
  title: 'Download',
  description: 'Download UltraLog for macOS (Apple Silicon and Intel), Windows and Linux, with SHA-256 checksums for every build.',
})
</script>

<template>
  <div>
    <SiteHero variant="page" eyebrow="Download" :lede="latest ? `${latest.tag}, released ${formatDate(latest.publishedAt)}. Signed and notarized on macOS.` : ''">
      <template #title>Get <em>UltraLog</em></template>
    </SiteHero>

    <section class="ul-section" aria-labelledby="builds-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="builds-title" class="ul-section__title">Builds</h2>
        </div>
        <DownloadCards :release="latest" />
      </div>
    </section>

    <section v-if="latest" class="ul-section" aria-labelledby="files-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="files-title" class="ul-section__title">Files and checksums</h2>
          <p class="ul-section__lede">Check a download with <code class="ul-mono">shasum -a 256 &lt;file&gt;</code>.</p>
        </div>
        <div class="ul-table-wrap">
          <table class="ul-table">
            <thead>
              <tr>
                <th scope="col" class="ul-label">File</th>
                <th scope="col" class="ul-label">Size</th>
                <th scope="col" class="ul-label">SHA-256</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in latest.assets" :key="a.name">
                <td><a :href="a.url" class="ul-mono">{{ a.name }}</a></td>
                <td class="ul-mono">{{ formatSize(a.size) }}</td>
                <td class="ul-mono ul-sha">{{ a.sha256 ?? 'not recorded' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="ul-section" aria-labelledby="install-title">
      <div class="ul-wrap ul-prose">
        <h2 id="install-title" class="ul-section__title">Install</h2>
        <h3>macOS</h3>
        <ol>
          <li>Open the <code>.dmg</code> and drag UltraLog to Applications.</li>
          <li>Launch it from Applications. The app is signed and notarized by Apple.</li>
        </ol>
        <h3>Windows</h3>
        <ol>
          <li>Extract <code>ultralog-windows.zip</code>.</li>
          <li>Run <code>ultralog-windows.exe</code>.</li>
        </ol>
        <h3>Linux</h3>
        <ol>
          <li>Extract: <code>tar -xzf ultralog-linux.tar.gz</code></li>
          <li>Run: <code>./ultralog-linux</code></li>
        </ol>
        <p>UltraLog checks for updates on launch and installs them in one click.</p>
      </div>
    </section>

    <section v-if="data?.older.length" class="ul-section" aria-labelledby="older-title">
      <div class="ul-wrap">
        <div class="ul-section__head">
          <h2 id="older-title" class="ul-section__title">Older versions</h2>
          <NuxtLink to="/releases" class="ul-btn ul-btn--ghost ul-section__more">Release notes<UlIcon name="arrow" /></NuxtLink>
        </div>
        <ul class="ul-older">
          <li v-for="r in data.older" :key="r.tag">
            <a :href="r.url" class="ul-mono">{{ r.tag }}</a>
            <span class="ul-caption ul-mono">{{ formatDate(r.publishedAt) }}</span>
          </li>
        </ul>
        <p class="ul-caption ul-older__more">Every version is on <a :href="LINKS.releases">GitHub releases</a>.</p>
      </div>
    </section>
  </div>
</template>
