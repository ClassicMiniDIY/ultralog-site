// Static homepage copy. Voice rules: design/design-system/README.md ("Voice and copy").
import type { IconName } from '~/utils/icons'

export interface Feature {
  icon: IconName
  title: string
  body: string
}

export const FEATURES: Feature[] = [
  {
    icon: 'chart',
    title: '14 analyzers',
    body: 'AFR drift, Butterworth filters, VE and correlation. Run one, chart it in a click.',
  },
  {
    icon: 'timer',
    title: 'Lambda delay tables',
    body: 'Mine your logs for injector-to-wideband delay, binned by RPM and load.',
  },
  {
    icon: 'grid',
    title: 'Heatmap histograms',
    body: 'Average any channel over RPM × MAP. Copy straight into your tune.',
  },
]

export interface Mode {
  id: string
  name: string
  body: string
  /** `name` is the file stem in public/screenshots (scripts/screenshots.ts writes -760 and -1520). */
  image?: { name: string; alt: string; width: number; height: number }
}

// The five tools in the app's ActiveTool::ALL order.
export const MODES: Mode[] = [
  {
    id: 'log-viewer',
    name: 'Log Viewer',
    body: 'Stack up to 10 plot panels on one synchronized timeline. Min/max legend, playback from 0.25x to 8x, and the GPS track map beside the chart.',
    image: {
      name: 'chart-night',
      alt: 'UltraLog Log Viewer in Night Drive: RPM, MAP, TPS and ignition timing from a Haltech log, with min/max channel cards, the cursor legend and the playback bar.',
      width: 760,
      height: 448,
    },
  },
  {
    id: 'scatter',
    name: 'Scatter Plot',
    body: 'Plot any two channels against each other to see how they move together, colored by a third.',
    image: {
      name: 'scatter',
      alt: 'Two UltraLog scatter plots in Night Drive from a Haltech log: MAP against RPM, and ignition timing against MAP, colored by hit count.',
      width: 760,
      height: 448,
    },
  },
  {
    id: 'histogram',
    name: 'Histogram',
    body: 'Average any channel over RPM × MAP, or count hits per cell. Copy the grid straight into your tune.',
    image: {
      name: 'histogram',
      alt: 'UltraLog Histogram in Night Drive: ignition timing averaged over a 32 by 32 grid of RPM and MAP cells from a Haltech log.',
      width: 760,
      height: 448,
    },
  },
  {
    id: 'lambda-delay',
    name: 'Lambda Delay',
    body: 'Finds injector pulse-width steps and measures how long the wideband takes to answer. Every cell shows its sample count and confidence.',
    image: {
      name: 'lambda-delay',
      alt: 'UltraLog Lambda Delay table from a Haltech log: dead time in milliseconds per RPM and MAP cell, with a confidence badge on each cell and the event rejection summary.',
      width: 760,
      height: 448,
    },
  },
  {
    id: 'accel-enrich',
    name: 'Accel Enrichment',
    body: 'Detects tip-ins, shifts the lambda window by the measured delay, and suggests a starting correction per RPM and throttle-rate cell.',
    image: {
      name: 'accel-enrich',
      alt: 'UltraLog Accel Enrichment table from a Haltech log: suggested correction in percent per RPM and throttle-rate cell, with confidence badges, the rejection summary and the event list for one selected cell.',
      width: 760,
      height: 448,
    },
  },
]

export interface NewsItem {
  title: string
  body: string
}

// "What's New" in 3.0.0, from the current ultralog.co (UltraLog repo docs/index.html on release/3.0.0).
export const WHATS_NEW_3: NewsItem[] = [
  {
    title: 'The Night Drive look',
    body: 'An indigo-black interface with one cyan accent, a sunset redline and mono numbers. One slider takes it from quiet Stealth greys to full Ultra glow, and never touches your data colours.',
  },
  {
    title: 'A new export sheet',
    body: 'Charts, scatter plots, histograms and tuning tables export on one clean sheet, PDF or PNG, on light Paper or dark Graphite. PDFs carry real, selectable text.',
  },
  {
    title: 'Lambda delay tables',
    body: 'Measures how long the wideband takes to respond to injector steps, binned by RPM and load, ready for your ECU’s closed-loop O2 delay table.',
  },
  {
    title: 'Accel enrichment tables',
    body: 'Reports the lean or rich excursion on every tip-in with a suggested starting correction. Runs across several logs at once.',
  },
  {
    title: 'TunerStudio MSL, RaceChrono and Torque Pro',
    body: 'Open .msl datalogs from TunerStudio and RealDash, RaceChrono CSV v3 sessions, and Torque Pro trackLogs, with the track map ready out of the box.',
  },
  {
    title: 'GPS track map',
    body: 'Logs with GPS draw the track beside your chart: lap detection, any channel painted onto the racing line, and opt-in satellite backgrounds.',
  },
  {
    title: 'Color blind mode and High contrast',
    body: 'Okabe-Ito series and cividis heatmaps with direct labels, or true black grounds and white text. Both meet WCAG AAA.',
  },
  {
    title: 'MCP server for AI',
    body: 'Claude Desktop can drive UltraLog: load files, select channels, compute formulas and query data with 23 tools.',
  },
]

export const LINKS = {
  repo: 'https://github.com/ClassicMiniDIY/UltraLog',
  releases: 'https://github.com/ClassicMiniDIY/UltraLog/releases',
  wiki: 'https://github.com/ClassicMiniDIY/UltraLog/wiki',
  issues: 'https://github.com/ClassicMiniDIY/UltraLog/issues',
  newIssue: 'https://github.com/ClassicMiniDIY/UltraLog/issues/new/choose',
  discussions: 'https://github.com/ClassicMiniDIY/UltraLog/discussions',
  license: 'https://github.com/ClassicMiniDIY/UltraLog/blob/main/LICENSE.md',
  exampleLogs: 'https://github.com/ClassicMiniDIY/UltraLog/tree/main/exampleLogs',
} as const
