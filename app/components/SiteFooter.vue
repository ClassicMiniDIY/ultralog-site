<script setup lang="ts">
import { LINKS } from '~/data/content'
import { INTENSITIES } from '~/utils/theme'

const { intensity, cvd, highContrast } = useTheme()
</script>

<template>
  <footer class="ul-footer">
    <div class="ul-redline" />
    <div class="ul-wrap ul-footer__row">
      <div>
        <img src="/logos/ultralog-lockup.svg" alt="UltraLog" width="115" height="24" loading="lazy" />
        <ul class="ul-footer__links">
          <li><NuxtLink to="/download">Download</NuxtLink></li>
          <li><NuxtLink to="/releases">Releases</NuxtLink></li>
          <li><NuxtLink to="/ecus">Supported ECUs</NuxtLink></li>
          <li><NuxtLink to="/docs">Docs</NuxtLink></li>
          <li><a :href="LINKS.repo">GitHub</a></li>
          <li><a :href="LINKS.issues">Report an issue</a></li>
          <li><a :href="LINKS.discussions">Discussions</a></li>
        </ul>
        <p class="ul-caption ul-footer__legal">
          Free and open source under the <a :href="LINKS.license">AGPL-3.0 license</a>. © 2024–2026 Cole Gentry.
          ECU names are trademarks of their owners; UltraLog is not affiliated with them.
        </p>
      </div>

      <div class="ul-display">
        <span class="ul-overline">Display</span>
        <label class="ul-check">
          <input v-model="cvd" type="checkbox" :disabled="highContrast" />
          <span class="ul-check__box"><UlIcon name="check" /></span>
          Color blind mode
        </label>
        <fieldset>
          <legend class="ul-label">Ultra intensity</legend>
          <div class="ul-seg" :aria-disabled="highContrast">
            <label v-for="i in INTENSITIES" :key="i.id" class="ul-seg__item">
              <input v-model="intensity" type="radio" name="intensity" :value="i.id" :disabled="highContrast" />
              {{ i.label }}
            </label>
          </div>
          <span v-if="highContrast" class="ul-caption">High contrast is on in your system settings, so intensity effects are off.</span>
        </fieldset>
      </div>
    </div>
  </footer>
</template>
