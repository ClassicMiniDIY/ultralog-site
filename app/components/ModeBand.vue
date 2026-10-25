<script setup lang="ts">
import { MODES } from '~/data/content'

// The five tools as a tab list in the app's mode-nav style, one screenshot each.
// WAI-ARIA tabs: arrow keys move between tabs, Home/End jump to the ends. Every panel is in the
// prerendered HTML (inactive ones `hidden`), so each panel works without a client-side fetch.
const active = ref(0)
const tabs = ref<HTMLButtonElement[]>([])

function select(i: number, focus = false) {
  active.value = (i + MODES.length) % MODES.length
  if (focus) nextTick(() => tabs.value[active.value]?.focus())
}

function onKey(e: KeyboardEvent) {
  const moves: Record<string, number> = { ArrowRight: active.value + 1, ArrowLeft: active.value - 1, Home: 0, End: MODES.length - 1 }
  const next = moves[e.key]
  if (next === undefined) return
  e.preventDefault()
  select(next, true)
}

const srcset = (name: string) => `/screenshots/${name}-760.webp 760w, /screenshots/${name}-1520.webp 1520w`
</script>

<template>
  <div class="ul-modes">
    <div class="ul-modenav" role="tablist" aria-label="UltraLog tools" @keydown="onKey">
      <button
        v-for="(m, i) in MODES"
        :id="`mode-tab-${m.id}`"
        :key="m.id"
        ref="tabs"
        type="button"
        role="tab"
        class="ul-modenav__item"
        :aria-selected="i === active"
        :aria-controls="`mode-panel-${m.id}`"
        :tabindex="i === active ? 0 : -1"
        @click="select(i)"
      >
        {{ m.name }}
      </button>
    </div>
    <div
      v-for="(m, i) in MODES"
      :id="`mode-panel-${m.id}`"
      :key="m.id"
      class="ul-modes__panel"
      role="tabpanel"
      :aria-labelledby="`mode-tab-${m.id}`"
      :hidden="i !== active"
    >
      <div class="ul-modes__copy">
        <h3 class="ul-modes__title">{{ m.name }}</h3>
        <p>{{ m.body }}</p>
      </div>
      <figure class="ul-shot">
        <div class="ul-redline" />
        <img
          v-if="m.image"
          :src="`/screenshots/${m.image.name}-760.webp`"
          :srcset="srcset(m.image.name)"
          sizes="(min-width: 1024px) 760px, calc(100vw - 82px)"
          :alt="m.image.alt"
          :width="m.image.width"
          :height="m.image.height"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="ul-shot__empty">A screenshot of {{ m.name }} follows with the 3.0 release.</div>
      </figure>
    </div>
  </div>
</template>
