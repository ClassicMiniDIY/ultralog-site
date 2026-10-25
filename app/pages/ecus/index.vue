<script setup lang="ts">
import { ECU_COUNT } from '#shared/utils/ecus'

useSeoMeta({
  title: 'Supported ECUs',
  description: `UltraLog opens ${ECU_COUNT} ECU and logger formats: Haltech, ECUMaster, RomRaider, Speeduino, rusEFI, AiM, Link, Emerald, MegaSquirt and more.`,
})
</script>

<template>
  <div>
    <SiteHero variant="page" :eyebrow="`${ECU_COUNT} log formats`" lede="Open the file your ECU or logger writes. No conversion step.">
      <template #title>Supported <em>ECUs</em></template>
    </SiteHero>
    <section class="ul-section">
      <div class="ul-wrap"><EcuGrid /></div>
    </section>
  </div>
</template>
