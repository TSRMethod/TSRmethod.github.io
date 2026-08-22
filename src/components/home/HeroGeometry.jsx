import {
  ALPHA_CARBONS,
  BACKBONE,
  BACKBONE_NEAR,
  DEPTH,
  RESIDUE_POINTS,
  TRIPLETS,
} from './ubiquitin'
import styles from './HeroGeometry.module.css'

/*
 * The figure behind the hero: ubiquitin, and TSR being done to it.
 *
 * IT IS A REAL PROTEIN. Every coordinate comes from PDB entry 1UBQ — the 1.8 Å
 * structure of ubiquitin — projected once, at development time, by
 * scripts/derive-1ubq-figure.mjs. The browser receives about eighty numbers
 * and a path string; there is no structure file to download, no parser in the
 * bundle, and nothing is fetched from RCSB when someone opens the page. The
 * supplied camera-spin MP4 was used as a visual reference for what the fold
 * should look like and nothing else: at 2 MB, on a white background, it would
 * have cost more than the whole rest of the page to show a picture we can draw
 * from the coordinates themselves.
 *
 * IT TELLS THE METHOD'S STORY, in the order the method works:
 *
 *   the backbone resolves          — a structure
 *   α-carbons appear along it      — its residues
 *   three of them are picked out   — a triplet
 *   the triangle between them draws — one TSR key
 *   it fades, and another triplet is chosen elsewhere
 *
 * The protein never leaves. It is the context the triangles are measured
 * against, which is exactly its role in the method.
 *
 * THE TRIANGLES ARE THE REAL ONES. Each is drawn between three actual
 * α-carbons of the fold — the same points the figure already shows as
 * residues — chosen by the script for being properly scalene (sides around
 * 1 : 1.3 : 1.5). Nothing here is invented geometry, and because a corner and
 * its residue are the same coordinate, an edge cannot come away from its point.
 *
 * IT IS INVISIBLE TO ASSISTIVE TECHNOLOGY: `aria-hidden` on the layer and the
 * SVG, `focusable="false"`, `pointer-events: none`. It adds nothing to the
 * accessibility tree, takes no focus, and cannot intercept a click meant for
 * the hero's own links.
 */

/** "x,y" for an α-carbon, by its index in the chain. */
const at = (residue) => ALPHA_CARBONS[residue].join(',')

export default function HeroGeometry() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <svg
        className={styles.figure}
        viewBox="0 0 600 400"
        preserveAspectRatio="xMaxYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        {/*
         * ONE GROUP FOR EVERYTHING. The whole structure shares a single
         * transform, so if it moves at all it moves as one object. The
         * previous abstract figure animated points and lines separately and
         * they slid apart from each other; here there is no arrangement in
         * which that can happen, because there is only one thing being moved.
         */}
        <g className={styles.structure}>
          {/*
           * Two passes over the same trace, and the reason is depth. A flat
           * Cα line through a globular fold reads as a ball of string; drawing
           * the half of the chain nearest the viewer a shade stronger over the
           * whole of it brings the front of the molecule forward, which is
           * what makes it read as an object rather than a scribble.
           */}
          <path className={styles.backbone} d={BACKBONE} />
          <path className={styles.backboneNear} d={BACKBONE_NEAR} />

          <g className={styles.residues}>
            {RESIDUE_POINTS.map((residue, index) => (
              <circle
                key={residue}
                className={styles.residue}
                cx={ALPHA_CARBONS[residue][0]}
                cy={ALPHA_CARBONS[residue][1]}
                /* Nearer α-carbons are drawn slightly larger, for the same
                   reason the near half of the trace is drawn stronger. */
                r={2.1 + DEPTH[residue] * 1.5}
                style={{
                  '--residue-index': index,
                  '--residue-depth': 0.2 + DEPTH[residue] * 0.25,
                }}
              />
            ))}
          </g>

          {TRIPLETS.map((triplet, index) => (
            <g
              key={triplet.residues.join('-')}
              /*
               * The first triplet is marked rather than found by position.
               * `:first-of-type` would have matched the residues group — the
               * first <g> in here — and quietly hidden every triangle in the
               * reduced-motion state, which is the one state that must always
               * show a completed one.
               */
              className={[styles.triplet, index === 0 ? styles.primaryTriplet : null]
                .filter(Boolean)
                .join(' ')}
              /*
               * Each triplet has the stage to itself: one cycle, divided
               * between however many the structure yielded, so exactly one
               * relationship is being read at a time. The cycle is derived
               * from that number rather than written down, so re-deriving the
               * figure from another structure cannot leave a silent gap or an
               * overlap in the rhythm.
               */
              style={{ '--turn': index, '--cycle': `${TRIPLETS.length * 9}s` }}
            >
              <polygon
                className={styles.triangle}
                points={triplet.residues.map(at).join(' ')}
                style={{
                  strokeDasharray: triplet.perimeter,
                  '--outline': `${triplet.perimeter}px`,
                }}
              />

              {triplet.residues.map((residue) => (
                <g key={residue}>
                  {/* Centred on the residue, so a pulse cannot detach it. */}
                  <circle
                    className={styles.selectedRing}
                    cx={ALPHA_CARBONS[residue][0]}
                    cy={ALPHA_CARBONS[residue][1]}
                    r="9"
                  />
                  <circle
                    className={styles.selected}
                    cx={ALPHA_CARBONS[residue][0]}
                    cy={ALPHA_CARBONS[residue][1]}
                    r="4.2"
                  />
                </g>
              ))}
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
