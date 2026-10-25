// Turns the app screenshots in source/screenshots/*.png into the WebP files the site serves
// (public/screenshots/<name>-<width>.webp). Run after adding or replacing a screenshot:
//   bun run screenshots
// The output is committed, so builds do not need sharp's native binary.
import { mkdir, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import sharp from 'sharp'

const SRC = 'source/screenshots'
const OUT = 'public/screenshots'
// The band shows a screenshot at most 760 CSS px wide; 1520 covers 2x screens.
const WIDTHS = [760, 1520]

await mkdir(OUT, { recursive: true })
for (const file of (await readdir(SRC)).filter((f) => f.endsWith('.png'))) {
  const name = basename(file, '.png')
  const image = sharp(join(SRC, file))
  const { width, height } = await image.metadata()
  for (const w of WIDTHS) {
    const out = join(OUT, `${name}-${w}.webp`)
    const info = await image.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out)
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KiB  (source ${width}x${height})`)
  }
}
