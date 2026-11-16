/*
 * Regenerates public/favicon.ico from public/favicon.svg.
 *
 *   node scripts/favicon-ico.mjs
 *
 * Pages name their icon with <link rel="icon" href="/favicon.svg">, and
 * browsers that read SVG icons use that. /favicon.ico is the address that
 * browsers, feed readers and crawlers request when they do not read the
 * page's <head> first; Googlebot asked for it and got a 404 (Search Console,
 * Crawl stats, November 2026). This file answers that request with the same
 * mark.
 *
 * Three sizes, 16, 32 and 48 pixels, each stored as a PNG inside the ICO
 * container, which every current browser reads. 48 is the size Google Search
 * asks a raster favicon to be a multiple of. Not run by the build: the ICO is
 * committed, so what is published is exactly what was reviewed, as with the
 * social preview card.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SIZES = [16, 32, 48]

const svg = await readFile(resolve(ROOT, 'public/favicon.svg'))

const images = await Promise.all(
  SIZES.map((size) =>
    sharp(svg, { density: 72 * (size / 64) * 4 })
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer(),
  ),
)

/* ICONDIR (6 bytes), then one ICONDIRENTRY (16 bytes) per image, then the images. */
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0) // reserved
header.writeUInt16LE(1, 2) // type: icon
header.writeUInt16LE(images.length, 4)

let offset = 6 + 16 * images.length
const entries = images.map((png, i) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(SIZES[i] % 256, 0) // width (0 would mean 256)
  entry.writeUInt8(SIZES[i] % 256, 1) // height
  entry.writeUInt8(0, 2) // no palette
  entry.writeUInt8(0, 3) // reserved
  entry.writeUInt16LE(1, 4) // colour planes
  entry.writeUInt16LE(32, 6) // bits per pixel
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += png.length
  return entry
})

const out = resolve(ROOT, 'public/favicon.ico')
await writeFile(out, Buffer.concat([header, ...entries, ...images]))
console.log('wrote', out)
