// Outline icons on a 24px grid, drawn at 16px with a 1.6px stroke (design-system README, Iconography).
// The first three are the FeatureCard glyphs from the design previews.
export const ICONS = {
  chart: ['M3 20.5h18', 'M4.5 16l4.5-5.5 4 3.5 6.5-8'],
  timer: ['M19.5 13a7.5 7.5 0 1 1-15 0a7.5 7.5 0 1 1 15 0', 'M12 9v4l2.5 2M10 2.8h4'],
  grid: [
    'M5 3.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z',
    'M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17',
  ],
  download: ['M12 4v11.5M7 10.5l5 5 5-5M4.5 19.5h15'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  warning: ['M12 4l9 16H3z', 'M12 10v4M12 17h.01'],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  arrow: ['M5 12h14M13 6l6 6-6 6'],
  file: ['M6 3.5h8l4.5 4.5v12.5H6z', 'M14 3.5V8h4.5'],
  book: ['M4.5 5.5A2 2 0 0 1 6.5 3.5h13v14h-13a2 2 0 0 0-2 2z', 'M4.5 19.5a2 2 0 0 0 2 2h13v-4'],
  search: ['M17 10.5a6.5 6.5 0 1 1-13 0a6.5 6.5 0 1 1 13 0', 'M15.3 15.3L20 20'],
} as const

export type IconName = keyof typeof ICONS
