import manifest from 'virtual:image-manifest'

/*
 * The reader's half of the image pipeline.
 *
 * `virtual:image-manifest` is produced during a production build by
 * scripts/optimize-images.mjs (wired up in vite.config.js). In development and
 * under test it is empty, and every function here degrades to "there is
 * nothing but the original" — which is exactly what we want: no derivative has
 * to exist for a page to render, so a CMS upload is never a broken image while
 * it waits for the next deployment.
 */

/** The manifest entry for a content image path, or null. */
export function getImageEntry(src, source = manifest) {
  if (typeof src !== 'string') return null
  return source[src] ?? null
}

/**
 * A `srcSet` string for the WebP derivatives of `src`, or null when there are
 * none — in which case the caller should render a plain <img>.
 *
 * Widths are ascending, which is not cosmetic: browsers scan the candidate
 * list and the smallest adequate match should come first.
 */
export function buildSrcSet(src, source = manifest) {
  const entry = getImageEntry(src, source)
  if (!entry?.variants?.length) return null

  return entry.variants
    .slice()
    .sort((a, b) => a.width - b.width)
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(', ')
}

/**
 * Intrinsic dimensions, when the build recorded them.
 *
 * Given to the <img> so the browser can reserve the right box before the
 * bytes arrive; without them a portrait grid reflows as each face loads.
 */
export function getIntrinsicSize(src, source = manifest) {
  const entry = getImageEntry(src, source)
  if (!entry?.width || !entry?.height) return null
  return { width: entry.width, height: entry.height }
}

export default manifest
