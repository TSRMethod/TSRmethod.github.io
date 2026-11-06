/*
 * Checks the built site in dist/ before it can be deployed.
 *
 *   npm run build && npm run check:dist
 *
 * Run by both workflows after the build. It reads the files GitHub Pages
 * will serve, not what the browser draws after JavaScript runs, because the
 * files are what a crawler, a link preview and a reader's first paint get:
 *
 *   - every sitemap URL has its own HTML file, with that page's content in
 *     document order (readable without JavaScript), a title no other page uses, a description, and a canonical URL and
 *     og:url equal to the sitemap entry;
 *   - 404.html is the not-found page, marked noindex, with no canonical;
 *   - the Google Search Console verification file is published unchanged
 *     from public/, so the site stays verified after every deployment;
 *   - Learn BioTSR's downloads are present, never in the sitemap, and their
 *     folder holds no HTML, so nothing there escapes these checks; the
 *     notebook is valid, with no stored error and no local path;
 *   - every other HTML file is a redirect from an old address to a page in
 *     the sitemap, and is itself noindex;
 *   - the social preview image exists at the size the tags declare, and the
 *     structured data parses;
 *   - no analytics tag is written into the HTML (it is added at run time,
 *     once, by src/lib/analytics.js), and build-only files are not published.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { fileForPath } from './prerender.mjs'

const DIST = resolve(process.cwd(), 'dist')
const PUBLIC = resolve(process.cwd(), 'public')
const ORIGIN = 'https://tsrmethod.github.io'

const failures = []
const fail = (message) => failures.push(message)

const read = (file) => readFileSync(join(DIST, file), 'utf8')

/*
 * Google's ownership check for Search Console. Google fetches it at the site
 * root and expects exactly these bytes; if it disappears, the property stops
 * being verified. Not a page, so it is not in the sitemap.
 */
const VERIFICATION_FILES = ['google69a21a8e64b2f7ee.html']

/*
 * Learn BioTSR's downloads. Not pages: never in the sitemap, and the folder
 * may hold no HTML.
 */
const LEARN_FILES_DIR = 'learn-files'
const LEARN_FILES = [
  'learn-files/biotsr-first-10-minutes.ipynb',
  'learn-files/how-biotsr-works.mp4',
  'learn-files/how-biotsr-works-poster.jpg',
  'learn-files/how-biotsr-works.en.vtt',
  'learn-files/how-biotsr-works.chapters.vtt',
]

function attr(html, pattern) {
  const match = html.match(pattern)
  return match ? match[1] : null
}

const titleOf = (html) => attr(html, /<title>([^<]*)<\/title>/)
const canonicalOf = (html) => attr(html, /<link rel="canonical" href="([^"]*)"/)
const descriptionOf = (html) => attr(html, /<meta name="description" content="([^"]*)"/)
const ogUrlOf = (html) => attr(html, /<meta property="og:url" content="([^"]*)"/)
const isNoindex = (html) => /<meta name="robots" content="noindex"/.test(html)

function htmlFiles(dir = DIST) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return htmlFiles(path)
    return name.endsWith('.html') ? [relative(DIST, path).split(sep).join('/')] : []
  })
}

/* ---- Files that must exist ---- */

for (const file of ['index.html', '404.html', 'sitemap.xml', 'robots.txt', '.nojekyll']) {
  if (!existsSync(join(DIST, file))) fail(`missing dist/${file}`)
}
if (existsSync(join(DIST, '.vite'))) fail('dist/.vite (the build manifest) would be published')

for (const file of VERIFICATION_FILES) {
  if (!existsSync(join(PUBLIC, file))) fail(`missing public/${file}, the Search Console verification file`)
  else if (!existsSync(join(DIST, file))) fail(`missing dist/${file}, the Search Console verification file`)
  else if (!readFileSync(join(DIST, file)).equals(readFileSync(join(PUBLIC, file)))) {
    fail(`dist/${file} differs from public/${file}; Google needs it unchanged`)
  }
}

const sitemap = existsSync(join(DIST, 'sitemap.xml')) ? read('sitemap.xml') : ''
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (locs.length === 0) fail('sitemap.xml lists no URLs')

/* ---- Learn BioTSR files ---- */

for (const file of LEARN_FILES) {
  if (!existsSync(join(DIST, file))) fail(`missing dist/${file}`)
}
if (locs.some((loc) => loc.includes(`/${LEARN_FILES_DIR}/`))) fail(`sitemap.xml lists a file from /${LEARN_FILES_DIR}/`)
if (existsSync(join(DIST, LEARN_FILES_DIR))) {
  for (const name of readdirSync(join(DIST, LEARN_FILES_DIR), { recursive: true })) {
    if (String(name).endsWith('.html')) fail(`dist/${LEARN_FILES_DIR}/${name}: HTML here would escape the page checks`)
  }
}
const notebookFile = join(DIST, 'learn-files/biotsr-first-10-minutes.ipynb')
if (existsSync(notebookFile)) {
  try {
    const notebook = JSON.parse(readFileSync(notebookFile, 'utf8'))
    const outputs = notebook.cells.flatMap((cell) => cell.outputs ?? [])
    if (notebook.nbformat !== 4) fail('the Learn BioTSR notebook is not nbformat 4')
    if (outputs.some((output) => output.output_type === 'error')) fail('the Learn BioTSR notebook stores an error')
    if (/\/Users\/|\/home\/|\/private\//.test(JSON.stringify(outputs))) fail('the Learn BioTSR notebook stores a local path')
  } catch {
    fail('the Learn BioTSR notebook is not valid JSON')
  }
}

for (const track of ['learn-files/how-biotsr-works.en.vtt', 'learn-files/how-biotsr-works.chapters.vtt']) {
  if (existsSync(join(DIST, track)) && !read(track).startsWith('WEBVTT')) fail(`dist/${track} is not WebVTT`)
}
const videoFile = join(DIST, 'learn-files/how-biotsr-works.mp4')
if (existsSync(videoFile)) {
  // The index (moov) must come before the media data (mdat), or a browser
  // has to fetch the end of the file before it can start playing.
  const head = readFileSync(videoFile).subarray(0, 64 * 1024).toString('latin1')
  const moov = head.indexOf('moov')
  const mdat = head.indexOf('mdat')
  if (moov < 0 || (mdat >= 0 && mdat < moov)) fail('the Learn BioTSR video is not fast-start (moov after mdat)')
}

/* ---- One prerendered file per sitemap URL ---- */

const pageFiles = new Set()
const titles = new Map()

for (const loc of locs) {
  if (!loc.startsWith(`${ORIGIN}/`)) {
    fail(`sitemap URL ${loc} is not on ${ORIGIN}`)
    continue
  }
  const path = loc.slice(ORIGIN.length)
  if (path !== '/' && path.endsWith('/')) fail(`sitemap URL ${loc} has a trailing slash`)

  const file = fileForPath(path)
  pageFiles.add(file)
  if (!existsSync(join(DIST, file))) {
    fail(`${loc}: no dist/${file}, so GitHub Pages would answer 404`)
    continue
  }

  const html = read(file)
  const where = `dist/${file}`

  if (canonicalOf(html) !== loc) fail(`${where}: canonical is ${canonicalOf(html)}, expected ${loc}`)
  if (ogUrlOf(html) !== loc) fail(`${where}: og:url is ${ogUrlOf(html)}, expected ${loc}`)
  if (!descriptionOf(html)) fail(`${where}: no description`)
  if (isNoindex(html)) fail(`${where}: marked noindex`)
  if (!html.includes(`data-prerendered="${path}"`)) fail(`${where}: not prerendered for ${path}`)

  if (/<template id="B:|<div hidden id="S:/.test(html)) {
    fail(`${where}: part of the page is written out of order and needs JavaScript to read`)
  }

  const h1s = html.match(/<h1[\s>]/g) ?? []
  if (h1s.length !== 1) fail(`${where}: ${h1s.length} <h1> elements, expected 1`)

  const title = titleOf(html)
  if (!title) fail(`${where}: no title`)
  else if (titles.has(title)) fail(`${where}: title "${title}" is also used by ${titles.get(title)}`)
  else titles.set(title, where)

  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([^<]*)<\/script>/g)) {
    try {
      const data = JSON.parse(json)
      if (data['@context'] !== 'https://schema.org') fail(`${where}: structured data without schema.org context`)
    } catch {
      fail(`${where}: structured data is not valid JSON`)
    }
  }
}

/* ---- The 404 page ---- */

if (existsSync(join(DIST, '404.html'))) {
  const html = read('404.html')
  if (!isNoindex(html)) fail('dist/404.html: not marked noindex')
  if (canonicalOf(html)) fail('dist/404.html: has a canonical URL')
  if (!html.includes('Page not found')) fail('dist/404.html: does not contain the not-found page')
  if (html.includes('data-prerendered')) fail('dist/404.html: would be hydrated as a page')
}

/* ---- Everything else is a redirect from an old address ---- */

for (const file of htmlFiles()) {
  if (pageFiles.has(file) || file === '404.html' || VERIFICATION_FILES.includes(file)) continue

  const html = read(file)
  const target = canonicalOf(html)
  if (!/<meta http-equiv="refresh"/.test(html) || !isNoindex(html)) {
    fail(`dist/${file}: neither a page in the sitemap nor a redirect`)
  } else if (!locs.includes(target)) {
    fail(`dist/${file}: redirects to ${target}, which is not in the sitemap`)
  }
}

/* ---- Social preview image and analytics ---- */

const index = existsSync(join(DIST, 'index.html')) ? read('index.html') : ''
const image = attr(index, /<meta property="og:image" content="([^"]*)"/)
if (!image?.startsWith(`${ORIGIN}/`)) {
  fail(`og:image is ${image}, expected an absolute URL on ${ORIGIN}`)
} else {
  const file = join(DIST, image.slice(ORIGIN.length + 1))
  if (!existsSync(file)) {
    fail(`og:image ${image} is not in dist/`)
  } else {
    const png = readFileSync(file)
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    const declared = [
      attr(index, /<meta property="og:image:width" content="(\d+)"/),
      attr(index, /<meta property="og:image:height" content="(\d+)"/),
    ].map(Number)
    if (width !== declared[0] || height !== declared[1]) {
      fail(`og:image is ${width}×${height}, but the tags say ${declared.join('×')}`)
    }
  }
}

for (const file of htmlFiles()) {
  if (/googletagmanager|gtag\(/.test(read(file))) {
    fail(`dist/${file}: contains an analytics tag; it must only be added at run time`)
  }
}

if (failures.length > 0) {
  console.error(`check-dist: ${failures.length} problem(s)\n  ${failures.join('\n  ')}`)
  process.exit(1)
}

console.log(
  `check-dist: ${locs.length} pages prerendered with their own metadata, ` +
    `404.html noindex, ${htmlFiles().length - locs.length - 1 - VERIFICATION_FILES.length} redirects, ` +
    'Learn BioTSR files OK, Search Console file intact, social image OK',
)
