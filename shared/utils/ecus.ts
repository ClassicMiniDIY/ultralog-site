// Supported log formats. Order matches the app's Supported ECUs list on the old site.
// `wikiSection` is the `## ` heading prefix in the wiki's Supported-ECU-Formats page; the ECU page
// renders that section at build. `oecua` is the OpenECU Alliance adapter id (vendor/id) when one
// exists; the channel table comes from it. `sample` is a path under exampleLogs/ in the app repo.

export interface EcuFormat {
  slug: string
  name: string
  maker: string
  extensions: string[]
  summary: string
  wikiSection: string
  oecua?: string
  sample?: string
}

export const ECUS: EcuFormat[] = [
  {
    slug: 'haltech',
    name: 'Haltech',
    maker: 'Haltech',
    extensions: ['.csv'],
    summary: 'NSP CSV exports from Elite, Nexus and IC-7 ECUs.',
    wikiSection: 'Haltech',
    oecua: 'haltech/haltech-nsp',
    sample: 'haltech/2025-07-18_0215pm_Log1118.csv',
  },
  {
    slug: 'ecumaster',
    name: 'ECUMaster EMU Pro',
    maker: 'ECUMaster',
    extensions: ['.csv'],
    summary: 'CSV exports from EMU Pro and EMU Black.',
    wikiSection: 'ECUMaster EMU Pro',
    oecua: 'ecumaster/ecumaster-emu-csv',
    sample: 'ecumaster/2025_1218_1902.csv',
  },
  {
    slug: 'romraider',
    name: 'RomRaider',
    maker: 'RomRaider',
    extensions: ['.csv'],
    summary: 'RomRaider Logger CSVs for Subaru ECUs, and generic Time-first CSVs.',
    wikiSection: 'RomRaider',
    oecua: 'romraider/romraider-csv',
    sample: 'RomRaider/romraiderlog_20251031_170713.csv',
  },
  {
    slug: 'speeduino',
    name: 'Speeduino',
    maker: 'Speeduino',
    extensions: ['.mlg'],
    summary: 'Native MLG binary logs. No export step.',
    wikiSection: 'Speeduino / rusEFI',
    oecua: 'speeduino/speeduino-mlg',
    sample: 'speeduino/speeduino.mlg',
  },
  {
    slug: 'rusefi',
    name: 'rusEFI',
    maker: 'rusEFI',
    extensions: ['.mlg'],
    summary: 'Native MLG binary logs, including 1000+ field firmware.',
    wikiSection: 'Speeduino / rusEFI',
    oecua: 'rusefi/rusefi-mlg',
    sample: 'rusefi/rusefilog.mlg',
  },
  {
    slug: 'aim',
    name: 'AiM',
    maker: 'AiM',
    extensions: ['.xrk', '.drk'],
    summary: 'XRK and DRK binary files from AiM loggers and dashes.',
    wikiSection: 'AiM',
    oecua: 'aim/aim-xrk',
    sample: 'aim/BMW_THill 5mi_BY_Race_a_1441.xrk',
  },
  {
    slug: 'link',
    name: 'Link ECU',
    maker: 'Link',
    extensions: ['.llg'],
    summary: 'PCLink LLG binary logs.',
    wikiSection: 'Link ECU',
    oecua: 'link/link-llg',
    sample: 'link/linklog.llg',
  },
  {
    slug: 'emerald',
    name: 'Emerald K6/M3D',
    maker: 'Emerald',
    extensions: ['.lg1', '.lg2'],
    summary: 'EM Soft logs: .lg2 channel list plus .lg1 records.',
    wikiSection: 'Emerald ECU',
    oecua: 'emerald/emerald-lg',
    sample: 'emerald/EM Log MG ZS Turbo boost run.lg1',
  },
  {
    slug: 'megasquirt',
    name: 'MegaSquirt',
    maker: 'MegaSquirt',
    extensions: ['.csv'],
    summary: 'TunerStudio CSV exports from MS1, MS2, MS3 and MS3-Pro.',
    wikiSection: 'MegaSquirt',
    oecua: 'megasquirt/megasquirt-tunerstudio',
    sample: 'megasquirt/10.92.csv',
  },
  {
    slug: 'tunerstudio-msl',
    name: 'TunerStudio MSL',
    maker: 'EFI Analytics',
    extensions: ['.msl'],
    summary: 'Legacy ASCII datalogs from TunerStudio and RealDash.',
    wikiSection: 'TunerStudio MSL',
    sample: 'msl/realdash_speeduino_excerpt.msl',
  },
  {
    slug: 'mhd',
    name: 'MHD Tuning',
    maker: 'MHD',
    extensions: ['.csv'],
    summary: 'CSV logs from BMW N54, N55, S55 and B58 flashed with MHD.',
    wikiSection: 'MHD Tuning',
    sample: 'mhd/mhd-n55-pull.csv',
  },
  {
    slug: 'motorsport-electronics',
    name: 'Motorsport Electronics',
    maker: 'Motorsport Electronics',
    extensions: ['.csv'],
    summary: 'ME Tuner CSV exports from ME221 and ME442.',
    wikiSection: 'Motorsport Electronics',
    sample: 'motorsportElectronics/ME221_2026_04_12_11_59_52.csv',
  },
  {
    slug: 'racechrono',
    name: 'RaceChrono',
    maker: 'RaceChrono',
    extensions: ['.csv'],
    summary: 'CSV v3 session exports: GPS, phone sensors and OBD/CAN on one timeline.',
    wikiSection: 'RaceChrono',
    sample: 'racechrono/session_massa_finalese_v3_excerpt.csv',
  },
  {
    slug: 'torque-pro',
    name: 'Torque Pro',
    maker: 'Torque',
    extensions: ['.csv'],
    summary: 'trackLog CSVs from the Android OBD-II app.',
    wikiSection: 'Torque Pro',
    sample: 'torque/trackLog_synthetic_two_sessions.csv',
  },
  {
    slug: 'woolich',
    name: 'Woolich Racing Tuned',
    maker: 'Woolich Racing',
    extensions: ['.csv'],
    summary: 'WRT CSV exports from motorcycle ECUs.',
    wikiSection: 'Woolich Racing Tuned',
    sample: 'woolich/Woolich.csv',
  },
  {
    slug: 'bluedriver',
    name: 'BlueDriver OBD-II',
    maker: 'BlueDriver',
    extensions: ['.csv'],
    summary: 'Live data CSVs from the BlueDriver scan tool.',
    wikiSection: 'BlueDriver OBD-II',
    sample: 'bluedriver/DataLog-Jan_16_2026_3-00-09-PM.csv',
  },
  {
    slug: 'dynamicefi',
    name: 'DynamicEFI',
    maker: 'DynamicEFI',
    extensions: ['.csv'],
    summary: 'EBL WhatsUp CSVs from modified GM TBI systems.',
    wikiSection: 'DynamicEFI',
    sample: 'dynamicEFI/20251006_0834_toWorkNewCap.csv',
  },
  {
    slug: 'locomotive',
    name: 'Locomotive',
    maker: 'Locomotive datalogger',
    extensions: ['.csv'],
    summary: 'Datalogger CSVs with a TimeStamp and Customer header.',
    wikiSection: 'Locomotive',
    sample: 'locomotive/115292475.csv',
  },
]

export const ECU_COUNT = ECUS.length

export function findEcu(slug: string): EcuFormat | undefined {
  return ECUS.find((e) => e.slug === slug)
}
