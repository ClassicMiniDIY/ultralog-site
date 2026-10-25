<script setup lang="ts">
// One hero per page: eyebrow, display headline (one word in magenta via <em>), lede, CTA slot.
// The striped sun and the perspective floor are drawn from tokens so they follow the theme.
withDefaults(defineProps<{ eyebrow: string; lede?: string; variant?: 'home' | 'page' | 'docs' }>(), {
  lede: '',
  variant: 'home',
})

// Floor geometry from design/design-system/components/SiteHero/preview.html.
const rays = Array.from({ length: 25 }, (_, i) => ({ x1: 240 + i * 20, x2: -1080 + i * 130 }))
const rows = [0, 14, 34, 62, 100]
</script>

<template>
  <section class="ul-hero" :class="{ 'ul-hero--page': variant !== 'home', 'ul-hero--docs': variant === 'docs' }">
    <svg class="ul-hero__floor" viewBox="0 0 960 120" preserveAspectRatio="none" aria-hidden="true">
      <line v-for="r in rays" :key="`r${r.x1}`" :x1="r.x1" y1="0" :x2="r.x2" y2="120" />
      <line v-for="y in rows" :key="`h${y}`" x1="0" :y1="y" x2="960" :y2="y" />
    </svg>
    <div class="ul-wrap ul-hero__inner">
      <svg class="ul-hero__sun" viewBox="0 0 288 144" width="288" height="144" aria-hidden="true">
        <defs>
          <clipPath id="ul-hero-sun"><circle cx="144" cy="144" r="144" /></clipPath>
        </defs>
        <g clip-path="url(#ul-hero-sun)">
          <rect style="fill: var(--gold)" x="0" y="0" width="288" height="52" />
          <rect style="fill: var(--orange)" x="0" y="56" width="288" height="32" />
          <rect style="fill: var(--magenta)" x="0" y="96" width="288" height="20" />
          <rect style="fill: var(--violet)" x="0" y="128" width="288" height="12" />
        </g>
      </svg>
      <p class="ul-hero__eyebrow">{{ eyebrow }}</p>
      <h1 class="ul-hero__title"><slot name="title" /></h1>
      <p v-if="lede" class="ul-hero__lede">{{ lede }}</p>
      <div v-if="$slots.cta" class="ul-hero__cta"><slot name="cta" /></div>
    </div>
  </section>
</template>
