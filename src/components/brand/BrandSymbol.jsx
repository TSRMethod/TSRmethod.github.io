import symbol from './symbol.json'
import styles from './BrandSymbol.module.css'

/*
 * The group's symbol, drawn inline so it takes each theme's colours.
 *
 * A triangle split by the median from the midpoint of its base to the third
 * vertex, the line from which TSR measures θ; the pale sector marks θ on its
 * acute side. The geometry is generated, not hand-drawn: symbol.json comes
 * from the identity package (see assets/brand/README.md), and
 * scripts/brand-assets.mjs draws the favicon and the other brand images from
 * the same file, so the header, footer and icons cannot drift apart.
 *
 *   version  "full"  the symbol, for 32 px and larger
 *            "small" the small-size version: wider gap, rounder corners, no
 *                    θ sector, for anything smaller
 *   tone     "colour" the brand colours (--brand-symbol-* tokens)
 *            "mono"   one colour, currentColor
 *
 * It is always decorative: the name beside it (or the link it sits in)
 * carries the meaning, so it is hidden from assistive technology rather than
 * announced a second time.
 */
export default function BrandSymbol({ version = 'full', tone = 'colour', className }) {
  const v = symbol.versions[version]
  const mono = tone === 'mono'

  return (
    <svg
      className={[styles.symbol, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${v.width} ${v.height}`}
      aria-hidden="true"
      focusable="false"
      data-version={version}
      data-tone={tone}
    >
      {mono ? (
        <>
          <path d={v.partAMono} />
          <path d={v.partBMono} />
        </>
      ) : (
        <>
          <path className={styles.a} d={v.partA} />
          <path className={styles.b} d={v.partB} />
          {v.sector && <path className={styles.sector} d={v.sector} />}
        </>
      )}
    </svg>
  )
}
