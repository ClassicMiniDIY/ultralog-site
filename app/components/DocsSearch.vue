<script setup lang="ts">
import { search, snippet, type PreparedEntry } from '#shared/utils/search'

// Docs search: the ARIA 1.2 combobox pattern over a listbox of links. The index loads on first
// focus (useDocsSearch). `/` focuses the box from anywhere on the page. Snippets render as text
// segments with <mark>, never as HTML.
const route = useRoute()
const id = useId()
const listId = `${id}-results`

const root = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
const query = ref('')
const open = ref(false)
const active = ref(-1)
const index = shallowRef<PreparedEntry[] | null>(null)
const state = ref<'idle' | 'loading' | 'error'>('idle')

const LIMIT = 8
const matches = computed(() => (index.value ? search(index.value, query.value, Infinity) : []))
const results = computed(() => matches.value.slice(0, LIMIT))
const showList = computed(() => open.value && results.value.length > 0)
const status = computed(() => {
  if (!query.value.trim()) return ''
  if (state.value === 'loading') return 'Loading search…'
  if (state.value === 'error') return 'Search could not load. Check your connection and try again.'
  if (!index.value) return ''
  const n = results.value.length
  const total = matches.value.length
  if (!n) return `No results for “${query.value.trim()}”`
  return total > n ? `Top ${n} of ${total} results` : `${n} ${n === 1 ? 'result' : 'results'}`
})
// The count is for screen readers; the empty, loading and error notes are shown.
const statusVisible = computed(() => open.value && !!status.value && !results.value.length)

async function load() {
  if (index.value || state.value === 'loading') return
  state.value = 'loading'
  try {
    index.value = await loadSearchIndex()
    state.value = 'idle'
  } catch {
    state.value = 'error'
  }
}

function onFocus() {
  open.value = true
  load()
}

function onInput() {
  open.value = true
  if (state.value === 'error') load()
}

// Typing selects the first result, so Enter opens it. Also on index load: typing can beat the fetch.
watch([query, index], () => {
  active.value = results.value.length ? 0 : -1
})

function onFocusOut(e: FocusEvent) {
  if (!root.value?.contains(e.relatedTarget as Node | null)) close()
}

function close() {
  open.value = false
  active.value = -1
}

function reset() {
  close()
  query.value = ''
  input.value?.blur()
}

// The router does not scroll for a path you are already on with no hash (a page intro result).
function scrollIfSamePage(path: string) {
  if (path === route.path) window.scrollTo({ top: 0 })
}

/** Enter on the active result. */
function go(i: number) {
  const r = results.value[i]
  if (!r) return
  reset()
  scrollIfSamePage(r.entry.path)
  navigateTo(r.entry.path)
}

/**
 * A click on a result. NuxtLink has already navigated by the time this runs (its handler comes
 * first); a modifier click is left to the browser so Cmd/Ctrl/Shift-click opens a new tab.
 */
function onPick(i: number, e: MouseEvent) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  const path = results.value[i]?.entry.path
  reset()
  if (path) scrollIfSamePage(path)
}

function onKey(e: KeyboardEvent) {
  // Enter and the arrows belong to the input method while a CJK candidate is being composed.
  if (e.isComposing || e.keyCode === 229) return
  const n = results.value.length
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!n) return
    e.preventDefault()
    open.value = true
    const step = e.key === 'ArrowDown' ? 1 : -1
    active.value = active.value < 0 ? (step > 0 ? 0 : n - 1) : (active.value + step + n) % n
    document.getElementById(`${listId}-${active.value}`)?.scrollIntoView({ block: 'nearest' })
  } else if (e.key === 'Enter') {
    if (showList.value && active.value >= 0) {
      e.preventDefault()
      go(active.value)
    }
  } else if (e.key === 'Escape') {
    if (open.value && query.value) {
      e.preventDefault()
      query.value = ''
      close()
    } else {
      input.value?.blur()
    }
  }
}

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

function onSlash(e: KeyboardEvent) {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
  e.preventDefault()
  input.value?.focus()
}

onMounted(() => window.addEventListener('keydown', onSlash))
onBeforeUnmount(() => window.removeEventListener('keydown', onSlash))
watch(() => route.fullPath, close)
</script>

<template>
  <div ref="root" class="ul-search" @focusout="onFocusOut">
    <label :for="id" class="sr-only">Search the docs</label>
    <div class="ul-search__box">
      <UlIcon name="search" />
      <input
        :id="id"
        ref="input"
        v-model="query"
        class="ul-search__input"
        type="search"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        enterkeyhint="go"
        placeholder="Search docs"
        aria-autocomplete="list"
        :aria-expanded="showList"
        :aria-controls="listId"
        :aria-activedescendant="showList && active >= 0 ? `${listId}-${active}` : undefined"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKey"
      >
      <kbd class="ul-search__key" aria-hidden="true">/</kbd>
    </div>
    <ul v-show="showList" :id="listId" class="ul-search__list" role="listbox" aria-label="Search results">
      <li v-for="(r, i) in results" :key="r.entry.path" role="none">
        <NuxtLink
          :id="`${listId}-${i}`"
          :to="r.entry.path"
          class="ul-search__item"
          role="option"
          tabindex="-1"
          :aria-selected="i === active"
          @mousedown.prevent
          @mousemove="active = i"
          @click="onPick(i, $event)"
        >
          <span class="ul-search__where">
            <span>{{ r.entry.page }}</span>
            <template v-if="r.entry.heading">
              <span aria-hidden="true"> › </span><span class="sr-only">, </span>
              <span class="ul-search__heading">{{ r.entry.heading }}</span>
            </template>
          </span>
          <span v-if="r.entry.text" class="ul-search__snippet">
            <template v-for="(s, k) in snippet(r.entry.text, query)" :key="k">
              <mark v-if="s.hit">{{ s.text }}</mark><template v-else>{{ s.text }}</template>
            </template>
          </span>
        </NuxtLink>
      </li>
    </ul>
    <p class="ul-search__status" :class="{ 'sr-only': !statusVisible }" role="status">{{ status }}</p>
  </div>
</template>
