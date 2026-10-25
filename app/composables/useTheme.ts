import { HC_QUERY, STORAGE_CVD, STORAGE_INTENSITY, isIntensity, type Intensity } from '~/utils/theme'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private mode or blocked storage: the choice applies to this page view only.
  }
}

/** Footer theme controls. Mirrors the bootstrap scripts in utils/theme.ts; call once (SiteFooter). */
export function useTheme() {
  const intensity = ref<Intensity>('night')
  const cvd = ref(false)
  const highContrast = ref(false)
  const ready = ref(false)

  function apply() {
    const html = document.documentElement
    html.setAttribute('data-theme', highContrast.value ? 'hc' : intensity.value)
    if (cvd.value && !highContrast.value) document.body.setAttribute('data-theme', 'cvd')
    else document.body.removeAttribute('data-theme')
  }

  onMounted(() => {
    const stored = read(STORAGE_INTENSITY)
    if (isIntensity(stored)) intensity.value = stored
    cvd.value = read(STORAGE_CVD) === '1'
    const mq = matchMedia(HC_QUERY)
    highContrast.value = mq.matches
    const onChange = (e: MediaQueryListEvent) => {
      highContrast.value = e.matches
      apply()
    }
    mq.addEventListener('change', onChange)
    // A choice made in another tab applies here too.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_INTENSITY && isIntensity(e.newValue)) intensity.value = e.newValue
      if (e.key === STORAGE_CVD) cvd.value = e.newValue === '1'
    }
    window.addEventListener('storage', onStorage)
    onBeforeUnmount(() => {
      mq.removeEventListener('change', onChange)
      window.removeEventListener('storage', onStorage)
    })
    // After the stored values above have flushed, so loading them does not write them back.
    nextTick(() => {
      ready.value = true
    })
  })

  watch(intensity, (v) => {
    if (!ready.value) return
    write(STORAGE_INTENSITY, v)
    apply()
  })
  watch(cvd, (v) => {
    if (!ready.value) return
    write(STORAGE_CVD, v ? '1' : '0')
    apply()
  })

  return { intensity, cvd, highContrast }
}
