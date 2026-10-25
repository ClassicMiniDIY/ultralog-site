// Theme composition (design/design-system/README.md, Themes):
//   <html data-theme> = intensity anchor (stealth | night | ultra), or hc when the system asks for more contrast
//   <body data-theme="cvd"> = Color blind mode, layered over the intensity grounds; never set with hc
// The two bootstrap scripts below run inline before first paint, so a stored choice never flashes.

export type Intensity = 'stealth' | 'night' | 'ultra'

export const INTENSITIES: { id: Intensity; label: string }[] = [
  { id: 'stealth', label: 'Stealth' },
  { id: 'night', label: 'Night Drive' },
  { id: 'ultra', label: 'Ultra' },
]

export const STORAGE_INTENSITY = 'ultralog-site:intensity'
export const STORAGE_CVD = 'ultralog-site:cvd'
export const HC_QUERY = '(prefers-contrast: more)'

export const HEAD_BOOTSTRAP = `(function(){var d=document.documentElement,i='night';d.classList.add('js');try{var s=localStorage.getItem('${STORAGE_INTENSITY}');if(s==='stealth'||s==='ultra')i=s}catch(e){}try{if(matchMedia('${HC_QUERY}').matches)i='hc'}catch(e){}d.setAttribute('data-theme',i)})()`

export const BODY_BOOTSTRAP = `(function(){try{if(document.documentElement.getAttribute('data-theme')!=='hc'&&localStorage.getItem('${STORAGE_CVD}')==='1')document.body.setAttribute('data-theme','cvd')}catch(e){}})()`

export function isIntensity(v: unknown): v is Intensity {
  return v === 'stealth' || v === 'night' || v === 'ultra'
}
