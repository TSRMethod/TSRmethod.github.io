import styles from './HeroGeometry.module.css'

/*
 * The decorative TSR figure behind the hero.
 *
 * WHAT IT DRAWS, and why it is this and not a particle field: TSR represents
 * a structure by taking triplets of points and reducing each triangle between
 * them to one integer. So the picture is exactly that — a sparse field of
 * points with faint relationships between them, out of which three points at
 * a time are picked out and the triangle between them is drawn, held, and let
 * go as another triplet is chosen elsewhere. Someone who reads the method
 * should recognise the page; someone who has not should still see geometry
 * rather than decoration.
 *
 * EVERY TRIANGLE IS SCALENE, deliberately and by measurement: side ratios run
 * about 1 : 1.6 : 2.0, each with one near-horizontal edge (5–13° off level).
 * TSR keys depend on a triangle's sides being different — that is what makes
 * a key distinctive — and the group's own mark is a scalene triangle. A ring
 * of equilateral triangles would look like a logo grid and would quietly say
 * the wrong thing about the method.
 *
 * HOW IT MOVES: CSS only. No animation library, no canvas, no requestAnimation
 * Frame loop, no state, no JavaScript running after this renders once. The
 * whole thing is static SVG plus a handful of keyframes on opacity, transform
 * and stroke-dashoffset — all of which the compositor can handle — so the
 * cost of the hero being animated is the cost of the markup.
 *
 * IT IS INVISIBLE TO ASSISTIVE TECHNOLOGY. `aria-hidden` and `focusable`
 * false on the SVG, `pointer-events: none` on the layer: it adds nothing to
 * the accessibility tree, creates no tab stop, and cannot intercept a click
 * meant for the hero's own links.
 */

/*
 * A 600×400 field. Coordinates are written out rather than generated: the
 * composition is a drawing — weighted to the right so the heading and lede
 * keep the left — not something an algorithm should be asked to re-derive on
 * every page load.
 */
const NODES = [
  /* Triangle vertices. */
  { x: 250, y: 270 },
  { x: 452, y: 300 },
  { x: 322, y: 198, ring: true },
  { x: 398, y: 96 },
  { x: 548, y: 116 },
  { x: 496, y: 170, ring: true },
  { x: 416, y: 300, ring: true },
  { x: 516, y: 244 },
  { x: 540, y: 310 },
  { x: 120, y: 190, wide: true },
  { x: 300, y: 150 },
  { x: 150, y: 286, wide: true },
  /* Points that belong to no triangle: a structure has more residues than
     the ones any one key is built from. */
  { x: 196, y: 88, wide: true },
  { x: 78, y: 332, wide: true },
  { x: 350, y: 352 },
  { x: 470, y: 378 },
]

/** The faint web of relationships the triangles are selected from. */
const EDGES = [
  { from: 12, to: 10, wide: true },
  { from: 9, to: 12, wide: true },
  { from: 9, to: 11, wide: true },
  { from: 11, to: 13, wide: true },
  { from: 10, to: 2 },
  { from: 0, to: 14 },
  { from: 14, to: 6 },
  { from: 2, to: 3 },
  { from: 5, to: 7 },
  { from: 1, to: 15 },
  { from: 3, to: 10 },
  { from: 0, to: 11, wide: true },
]

/*
 * The triplets that are picked out. `length` is the perimeter, which is what
 * stroke-dasharray needs to draw an edge on rather than dash it.
 */
const TRIANGLES = [
  { points: '250,270 452,300 322,198', length: 480 },
  { points: '398,96 548,116 496,170', length: 355 },
  { points: '416,300 516,244 540,310', length: 315 },
  { points: '120,190 300,150 150,286', length: 495, wide: true },
]

export default function HeroGeometry() {
  return (
    <div className={styles.layer} aria-hidden="true">
      <svg
        className={styles.figure}
        viewBox="0 0 600 400"
        /*
         * `meet`, not `slice`. The hero is a wide, short band; sliced into it,
         * the figure was magnified until only two or three enormous nodes were
         * left on screen and no triangle could be read as a triangle — which
         * is the one thing this graphic exists to show. `meet` keeps the whole
         * composition inside its box, and the box is placed on the right of
         * the hero by the stylesheet. `xMax` then pins the drawing to that
         * box's right edge, so the figure sits with the band rather than
         * floating in the middle of a gap.
         */
        preserveAspectRatio="xMaxYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <g className={styles.edges}>
          {EDGES.map(({ from, to, wide }) => (
            <line
              key={`${from}-${to}`}
              className={wide ? styles.wideOnly : undefined}
              x1={NODES[from].x}
              y1={NODES[from].y}
              x2={NODES[to].x}
              y2={NODES[to].y}
            />
          ))}
        </g>

        <g className={styles.triangles}>
          {TRIANGLES.map(({ points, length, wide }) => (
            <polygon
              key={points}
              className={[styles.triangle, wide ? styles.wideOnly : null]
                .filter(Boolean)
                .join(' ')}
              points={points}
              style={{
                /* The dash pattern is the shape's own perimeter, so one
                   "dash" is the whole outline and the offset draws it. */
                strokeDasharray: length,
                '--tsr-outline': `${length}px`,
              }}
            />
          ))}
        </g>

        <g className={styles.nodes}>
          {NODES.map(({ x, y, ring, wide }, index) => (
            <g
              key={`${x}-${y}`}
              className={[styles.node, wide ? styles.wideOnly : null]
                .filter(Boolean)
                .join(' ')}
            >
              {ring && <circle className={styles.ring} cx={x} cy={y} r="11" />}
              <circle
                className={styles.dot}
                cx={x}
                cy={y}
                r={index % 3 === 0 ? 4 : 3}
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
