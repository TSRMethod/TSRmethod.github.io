/*
 * Production image optimisation.
 *
 * ---------------------------------------------------------------------------
 * Why this exists
 * ---------------------------------------------------------------------------
 * A supervisor editing the site through Pages CMS uploads whatever their phone
 * or their co-author gave them. The first real upload was a 1474 x 1474 JPEG
 * for a slot 88 pixels wide, and a 1.2 MB PNG for the home page. Asking a
 * non-technical editor to resize, compress and export WebP before uploading is
 * a rule that will be forgotten, and forgetting it makes the site slow rather
 * than broken — so nobody notices.
 *
 * So the build does it. The editor uploads a normal good-quality image and
 * nothing else is required of them, ever.
 *
 * ---------------------------------------------------------------------------
 * What it does NOT do
 * ---------------------------------------------------------------------------
 * It never touches `public/`. The original upload stays in the repository
 * exactly as committed, and the path written into the content file
 * (`/images/uploads/photo.jpeg`) stays valid forever — it is the <img> src and
 * the fallback. That matters because content records outlive build systems:
 * changing this implementation later must not mean rewriting scientific
 * content, and an editor must never need to know that a derivative exists.
 *
 * Everything here happens on the way to `dist/`.
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, extname, join, posix, relative, resolve, sep } from 'node:path'

/** Formats sharp can usefully re-encode. SVG is deliberately absent. */
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp'])

/*
 * Two profiles, because a face and a labelled diagram have opposite needs.
 *
 * Portraits are rendered in a 5.5–6.5rem box and are photographic: small
 * widths and ordinary photographic quality are invisible losses.
 *
 * Figures carry the science — axis labels, formulae, thin line art — and are
 * rendered up to the full content column, so they get more pixels and a
 * higher quality floor. Getting this wrong makes a diagram unreadable, which
 * is a content failure, not a performance one.
 */
export const PROFILES = {
  portrait: { widths: [160, 320, 600], fallbackWidth: 600, quality: 82 },
  figure: { widths: [480, 960, 1600], fallbackWidth: 1600, quality: 86 },
}

/** Images a developer curates live here; uploads land in /images/uploads. */
const PORTRAIT_DIR = '/images/people/'

/**
 * Which profile an image should use.
 *
 * Location alone is not enough: a portrait uploaded through the CMS sits in
 * `/images/uploads/` beside the home page diagram. So the People records are
 * consulted — a photo that some person's record points at is a portrait,
 * wherever it happens to live.
 */
export function selectProfile(url, portraitUrls = new Set()) {
  if (portraitUrls.has(url)) return 'portrait'
  if (url.startsWith(PORTRAIT_DIR)) return 'portrait'
  return 'figure'
}

/** `/images/uploads/a.png` + 320 -> `/images/uploads/a.w320.webp` */
export function variantUrl(url, width) {
  const ext = posix.extname(url)
  return `${url.slice(0, -ext.length)}.w${width}.webp`
}

/**
 * Widths worth generating for a source this wide.
 *
 * Never upscales: a 200px portrait yields one 160px variant, not three
 * blurry enlargements. The source width itself is included when it falls
 * between profile steps, so the largest variant is always as good as the
 * original without ever exceeding it.
 */
export function plannedWidths(sourceWidth, profile) {
  const { widths } = PROFILES[profile]
  const usable = widths.filter((width) => width < sourceWidth)
  const cap = Math.min(sourceWidth, PROFILES[profile].fallbackWidth)
  if (!usable.includes(cap)) usable.push(cap)
  return [...new Set(usable)].sort((a, b) => a - b)
}

/** Every `photo` any person record points at. */
export async function readPortraitUrls(contentDir) {
  const dir = join(contentDir, 'people')
  if (!existsSync(dir)) return new Set()

  const urls = new Set()
  for (const name of await readdir(dir)) {
    if (!name.endsWith('.json')) continue
    const record = JSON.parse(await readFile(join(dir, name), 'utf8'))
    if (record.photo) urls.add(record.photo)
  }
  return urls
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (entry.isFile()) yield full
  }
}

/**
 * Rewrite one image: WebP derivatives plus an optimised copy of the original.
 *
 * The fallback keeps its URL and its format — a `.png` stays a `.png` — so
 * nothing that references it needs to change. It is only replaced when the
 * re-encode actually came out smaller, because sharp will happily produce a
 * *larger* PNG than a well-optimised source.
 */
async function optimiseOne(sharp, { sourcePath, url, outDir, profile }) {
  const image = sharp(sourcePath, { failOn: 'error' })
  const meta = await image.metadata()

  if (!meta.width || !meta.height) {
    return { url, skipped: 'unreadable dimensions' }
  }

  const { quality, fallbackWidth } = PROFILES[profile]
  const widths = plannedWidths(meta.width, profile)
  const variants = []

  for (const width of widths) {
    const target = join(outDir, variantUrl(url, width).replace(/^\//, ''))
    await mkdir(dirname(target), { recursive: true })
    await sharp(sourcePath)
      .rotate() /* honour EXIF orientation before resizing */
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(target)
    variants.push({ width, url: variantUrl(url, width), bytes: (await stat(target)).size })
  }

  /* ---- the fallback the <img> element actually points at ---- */
  const originalBytes = (await stat(sourcePath)).size
  const ext = extname(sourcePath).toLowerCase()
  const pipeline = sharp(sourcePath)
    .rotate()
    .resize({ width: Math.min(meta.width, fallbackWidth), withoutEnlargement: true })

  if (ext === '.png') {
    /* Lossless. Diagrams here are line art with text in them, and palette
       reduction visibly damages anti-aliased labels. */
    pipeline.png({ compressionLevel: 9, palette: false })
  } else if (ext === '.webp') {
    pipeline.webp({ quality })
  } else {
    pipeline.jpeg({ quality, mozjpeg: true })
  }

  const rebuilt = await pipeline.toBuffer()
  const fallbackPath = join(outDir, url.replace(/^\//, ''))
  let fallbackBytes = originalBytes

  if (rebuilt.length < originalBytes) {
    await mkdir(dirname(fallbackPath), { recursive: true })
    await writeFile(fallbackPath, rebuilt)
    fallbackBytes = rebuilt.length
  }

  return {
    url,
    width: meta.width,
    height: meta.height,
    profile,
    variants,
    originalBytes,
    fallbackBytes,
  }
}

/**
 * Generate every derivative into `outDir`, and return the manifest.
 *
 * The manifest is what the OptimizedImage component reads. An image missing
 * from it simply renders as a plain <img> — which is what makes the dev server
 * work with no derivatives at all, and what stops a future CMS upload from
 * breaking a page before anyone has run a build.
 */
export async function optimizeImages({
  publicDir,
  contentDir,
  outDir,
  log = () => {},
} = {}) {
  const { default: sharp } = await import('sharp')

  const imagesRoot = join(publicDir, 'images')
  if (!existsSync(imagesRoot)) return { manifest: {}, stats: null }

  const portraitUrls = await readPortraitUrls(contentDir)
  const manifest = {}
  const stats = {
    processed: 0,
    skipped: 0,
    originalBytes: 0,
    fallbackBytes: 0,
    variantBytes: 0,
    largestVariantBytes: 0,
  }

  for await (const sourcePath of walk(imagesRoot)) {
    const ext = extname(sourcePath).toLowerCase()

    /*
     * SVG is vector: rasterising it would make it worse and bigger. It is
     * copied through untouched, as is anything else unrecognised.
     */
    if (!RASTER.has(ext)) {
      stats.skipped += 1
      continue
    }

    /* posix separators, because this becomes a URL. */
    const url = '/' + relative(publicDir, sourcePath).split(sep).join('/')

    /*
     * Refuse to look outside the image root. `relative` returning a path that
     * climbs out means a symlink or a crafted name escaped the tree.
     */
    if (url.includes('/../') || !url.startsWith('/images/')) {
      stats.skipped += 1
      continue
    }

    const profile = selectProfile(url, portraitUrls)
    const result = await optimiseOne(sharp, { sourcePath, url, outDir, profile })

    if (result.skipped) {
      stats.skipped += 1
      log(`  skipped ${url} (${result.skipped})`)
      continue
    }

    manifest[url] = {
      width: result.width,
      height: result.height,
      profile: result.profile,
      variants: result.variants.map(({ width, url: variant }) => ({ width, url: variant })),
    }

    stats.processed += 1
    stats.originalBytes += result.originalBytes
    stats.fallbackBytes += result.fallbackBytes
    stats.variantBytes += result.variants.reduce((sum, v) => sum + v.bytes, 0)
    /* What a visitor on a wide screen actually downloads for this image. */
    stats.largestVariantBytes += result.variants.at(-1)?.bytes ?? result.fallbackBytes
  }

  return { manifest, stats }
}

/**
 * The build summary.
 *
 * Two different numbers, because they answer different questions. The fallback
 * comparison is like-for-like — same URL, same format, what a browser without
 * WebP receives. The delivered figure is what a current browser actually
 * downloads, which is the number that matters to a visitor.
 */
export function formatSummary(stats) {
  if (!stats) return 'images: nothing to do'

  const kb = (bytes) => `${(bytes / 1024).toFixed(0)} kB`
  const percent = (from, to) =>
    from > 0 ? `${Math.round(((from - to) / from) * 100)}%` : '0%'

  return [
    `processed ${stats.processed} images (${stats.skipped} passed through untouched)`,
    `originals:            ${kb(stats.originalBytes)}`,
    `optimised fallbacks:  ${kb(stats.fallbackBytes)}  (${percent(stats.originalBytes, stats.fallbackBytes)} smaller)`,
    `webp delivered:       ${kb(stats.largestVariantBytes)}  (${percent(stats.originalBytes, stats.largestVariantBytes)} smaller, widest variant)`,
    `webp variants stored: ${kb(stats.variantBytes)} across all widths`,
  ].join('\n  ')
}

export { RASTER, PORTRAIT_DIR }
export default optimizeImages
