/*
 * Regenerates public/share/social-card.png, the link-preview image.
 *
 *   node scripts/social-card.mjs
 *
 * 1200 × 630, the size Open Graph and X/Twitter large cards use. The group's
 * mark (the same geometry and colours as public/favicon.svg), its name and
 * its tagline, and the address: nothing that will date, as CONTENT-REVIEW
 * item 35 asked. Not run by the build — the PNG is committed, so what is
 * published is exactly what was reviewed. Text is drawn with the fonts of
 * the machine that runs this, so regenerate on a Mac to match the original.
 */
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const site = JSON.parse(await readFile(resolve(ROOT, 'src/content/site.json'), 'utf8'))

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect y="606" width="1200" height="24" fill="#0056b3"/>
  <g transform="translate(64 155) scale(5)">
    <g fill="none" stroke="#0f596f" stroke-width="7" stroke-linecap="round">
      <path d="M32 15 L13 47"/>
      <path d="M32 15 L51 47"/>
      <path d="M13 47 L51 47"/>
    </g>
    <circle cx="32" cy="15" r="10" fill="#134168"/>
    <circle cx="13" cy="47" r="10" fill="#54b8c9"/>
    <circle cx="51" cy="47" r="10" fill="#2e797f"/>
  </g>
  <text x="420" y="292" font-family="${FONT}" font-size="68" font-weight="700" fill="#003d80">${escape(site.name)}</text>
  <text x="420" y="356" font-family="${FONT}" font-size="31" fill="#1f2933">${escape(site.tagline)}</text>
  <text x="420" y="452" font-family="${FONT}" font-size="28" fill="#52606d">tsrmethod.github.io</text>
</svg>`

const out = resolve(ROOT, 'public/share/social-card.png')
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out)
console.log('wrote', out)
