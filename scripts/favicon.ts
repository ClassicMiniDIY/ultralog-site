// Writes public/favicon.ico (16, 32 and 48 px PNGs in one ICO) from public/favicon.svg.
// Browsers and crawlers request /favicon.ico whatever the page links, so it must exist.
// Run after changing the SVG:  bun scripts/favicon.ts
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const SIZES = [16, 32, 48]
const pngs = await Promise.all(SIZES.map((s) => sharp('public/favicon.svg', { density: 384 }).resize(s, s).png().toBuffer()))

// ICO: 6-byte header, one 16-byte directory entry per image, then the PNG data.
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(pngs.length, 4)
let offset = 6 + 16 * pngs.length
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(SIZES[i]!, 0) // width
  e.writeUInt8(SIZES[i]!, 1) // height
  e.writeUInt16LE(1, 4) // colour planes
  e.writeUInt16LE(32, 6) // bits per pixel
  e.writeUInt32LE(png.length, 8)
  e.writeUInt32LE(offset, 12)
  offset += png.length
  return e
})
await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...pngs]))
console.log(`public/favicon.ico  ${offset} bytes  (${SIZES.join(', ')} px)`)
