import { buildSrcSet, getIntrinsicSize } from '../../lib/images'

/*
 * An <img> that quietly serves WebP derivatives when the build has made them.
 *
 * The `src` given here is always the path stored in content — the one a Pages
 * CMS editor's upload produced. That path never changes and remains the
 * fallback, so:
 *
 *   - a browser without WebP support gets the original format;
 *   - the dev server, where no derivatives exist, renders a plain <img>;
 *   - a newly uploaded image works immediately, optimised on the next build.
 *
 * `sizes` tells the browser how wide the image will actually be laid out, so
 * it can choose a candidate before CSS has been applied. It has no default on
 * purpose: a wrong `sizes` is worse than none, because the browser trusts it.
 * Callers that render at a known size pass it; the rest omit it and get the
 * full-width default behaviour.
 */
export default function OptimizedImage({
  src,
  alt,
  sizes,
  className,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
}) {
  const srcSet = buildSrcSet(src)
  const intrinsic = getIntrinsicSize(src)

  const img = (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      width={intrinsic?.width}
      height={intrinsic?.height}
    />
  )

  if (!srcSet) return img

  return (
    <picture>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      {img}
    </picture>
  )
}
