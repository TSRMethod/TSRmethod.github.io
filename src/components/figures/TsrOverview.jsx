import { ALPHA_CARBONS, BACKBONE } from '../home/ubiquitin'
import example from './tsrOverviewExample.json'
import styles from './TsrOverview.module.css'

/*
 * How TSR turns a structure into keys, for one real triangle.
 *
 * Six steps, as an ordered list of small panels rather than one wide image.
 * Each panel's words are ordinary text, so they reflow on a phone, scale with
 * the reader's font size and are read by a screen reader in order; the
 * drawings beside them are decorative (`aria-hidden`) and repeat nothing the
 * text does not say.
 *
 * NOTHING HERE IS INVENTED. The ubiquitin trace and its 76 α-carbons are the
 * projection the home page already draws (scripts/derive-1ubq-figure.mjs), and
 * every number — labels, angle, edges, classes, the key and how often it
 * occurs — is read from tsrOverviewExample.json, which
 * scripts/figures/tsr-overview-example.py writes from a real BioTSR 1.0.0
 * calculation. Step 4 draws that triangle to scale from its three edge
 * lengths. Step 6 is a schematic, and says so.
 *
 * The figure is deliberately specific about the points the earlier drawings
 * blurred:
 *
 *   - the base edge (L1–L2, which carries θ) is chosen by the vertex labels
 *     and is not necessarily the longest edge; maxDist is whichever edge is
 *     longest, here L2–L3;
 *   - θ is the angle between the base and the median from its midpoint to L3,
 *     folded into 0–90°;
 *   - the key is a mixed-radix integer: each label and class is multiplied by
 *     its place value and the products are added, so the step shows those
 *     weights rather than a bare "labels + bins";
 *   - a key fixes the labels, the angle class and the longest-edge class, not
 *     the whole triangle. The other triangles with this key are listed with
 *     their own measurements, which differ, rather than called "similar".
 *
 * Two variants from the same data: `full` on /tsr, six steps; `compact` on
 * the home page, four steps with one line each, linking to the full one. Each
 * card holds a drawing and a sentence or two, so the cards stay the same size;
 * the measurements, bin boundaries, encoding and the other triangles with the
 * key are in TsrWorkedExample below, which /tsr places after the figure at
 * the page's full width.
 */

const format = new Intl.NumberFormat('en-GB')

/* Residue numbers are 1-based; ALPHA_CARBONS is in chain order from 0. */
const point = (residueNumber) => ALPHA_CARBONS[residueNumber - 1]

const [v1, v2, v3] = example.vertices
const corners = [v1, v2, v3].map((v) => point(v.number))

/* "VAL" -> "Val", as residues are written in prose. */
const titleCase = (name) => `${name.charAt(0)}${name.slice(1).toLowerCase()}`
const residueName = (v) => `${titleCase(v.residue)}${v.number}`

/* "VAL5" -> "Val5". */
const residueId = (id) =>
  id.replace(/^([A-Z]+)(\d+)$/, (_m, name, number) => titleCase(name) + number)

/* Every triangle that received this key, the followed one first. */
const followed = [v1, v2, v3].map((v) => `${v.residue}${v.number}`).join()
const sameKey = [
  ...example.sameKey.filter((t) => t.residues.join() === followed),
  ...example.sameKey.filter((t) => t.residues.join() !== followed),
]

const range = (values) => [Math.min(...values), Math.max(...values)]
const [thetaLow, thetaHigh] = range(example.sameKey.map((t) => t.theta))
const [maxLow, maxHigh] = range(example.sameKey.map((t) => t.maxDistance))
const [baseLow, baseHigh] = range(example.sameKey.map((t) => t.edges[0]))

/*
 * The key, as BioTSR's encoder builds it (encoding/key.py): the three labels
 * as digits of base L, then the distance class and the angle class, each
 * weighted by the number of values the positions after it can take.
 */
const L = example.labelRadix
const D = example.distanceClasses
const T = example.thetaClasses
const labelIndex = L * L * (v1.label - 1) + L * (v2.label - 1) + (v3.label - 1)
const encodedKey = labelIndex * D * T + T * (example.distanceClass - 1) + (example.thetaClass - 1)
const one = (value) => value.toFixed(1)

const version = example.source.match(/BioTSR ([\d.]+)/)[1]

/*
 * A handful of other triangles, faint, so step 3 reads as "one of many".
 * Fixed residue triplets rather than random ones, so the drawing is stable.
 */
const OTHER_TRIANGLES = [
  [3, 30, 60],
  [12, 26, 48],
  [20, 40, 66],
  [5, 52, 72],
  [15, 35, 58],
]

function Structure({ showPoints = false, showTriangles = false }) {
  return (
    <svg viewBox="20 10 560 380" className={styles.drawing} aria-hidden="true" focusable="false">
      <path d={BACKBONE} className={showPoints ? styles.traceFaint : styles.trace} />
      {showTriangles &&
        OTHER_TRIANGLES.map((triplet) => (
          <polygon
            key={triplet.join('-')}
            points={triplet.map((n) => point(n).join(',')).join(' ')}
            className={styles.otherTriangle}
          />
        ))}
      {showTriangles && (
        <polygon points={corners.map((c) => c.join(',')).join(' ')} className={styles.triangle} />
      )}
      {showPoints &&
        ALPHA_CARBONS.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="5.5" className={styles.point} />
        ))}
      {showTriangles &&
        corners.map(([x, y], index) => (
          <circle key={index} cx={x} cy={y} r="9" className={styles.vertex} />
        ))}
    </svg>
  )
}

/*
 * The triangle to scale, from its three edges: L1 at the origin, L2 along the
 * x axis, L3 placed by the law of cosines. The median runs from the midpoint
 * of the base to L3; θ is the angle it makes with the base.
 */
const SCALE = 20
const PAD = 34
const l3x = (example.edge13 ** 2 - example.edge23 ** 2 + example.base ** 2) / (2 * example.base)
const l3y = Math.sqrt(example.edge13 ** 2 - l3x ** 2)
const minX = Math.min(0, l3x)
const toSvg = (x, y) => [PAD + (x - minX) * SCALE, PAD + (l3y - y) * SCALE]
const P1 = toSvg(0, 0)
const P2 = toSvg(example.base, 0)
const P3 = toSvg(l3x, l3y)
const MID = toSvg(example.base / 2, 0)
const WIDTH = PAD * 2 + (Math.max(example.base, l3x) - minX) * SCALE
const HEIGHT = PAD * 2 + l3y * SCALE + 18
/* Room on the right for the longest edge's label, which runs past L2. */
const LABEL_ROOM = 22
/* Room above L3 for its label. */
const TOP_ROOM = 8

/* The folded angle sits on the side of the base where it is acute. */
const medianAngle = Math.atan2(P3[1] - MID[1], P3[0] - MID[0])
const ARC = 26
const arcStart = [MID[0] - ARC, MID[1]]
const arcEnd = [MID[0] + ARC * Math.cos(medianAngle), MID[1] + ARC * Math.sin(medianAngle)]

function Geometry() {
  return (
    <svg
      viewBox={`0 ${-TOP_ROOM} ${(WIDTH + LABEL_ROOM).toFixed(1)} ${(HEIGHT + TOP_ROOM).toFixed(1)}`}
      className={styles.drawing}
      aria-hidden="true"
      focusable="false"
    >
      {/* Longest edge: drawn double, so it is told apart without colour. */}
      <line x1={P2[0]} y1={P2[1]} x2={P3[0]} y2={P3[1]} className={styles.longestEdge} />
      <line x1={P2[0]} y1={P2[1]} x2={P3[0]} y2={P3[1]} className={styles.longestEdgeInner} />
      <line x1={P1[0]} y1={P1[1]} x2={P3[0]} y2={P3[1]} className={styles.edge} />
      <line x1={P1[0]} y1={P1[1]} x2={P2[0]} y2={P2[1]} className={styles.base} />
      <line x1={MID[0]} y1={MID[1]} x2={P3[0]} y2={P3[1]} className={styles.median} />
      <path
        d={`M${arcStart[0]},${arcStart[1]} A${ARC},${ARC} 0 0 1 ${arcEnd[0]},${arcEnd[1]}`}
        className={styles.arc}
      />
      <text x={MID[0] - ARC - 4} y={MID[1] - 10} className={styles.symbol} textAnchor="end">
        θ
      </text>
      <circle cx={MID[0]} cy={MID[1]} r="3" className={styles.midpoint} />
      <text x={(P1[0] + P2[0]) / 2} y={P1[1] + 24} className={styles.edgeLabel} textAnchor="middle">
        base {example.base} Å
      </text>
      <text
        x={(P2[0] + P3[0]) / 2 + 10}
        y={(P2[1] + P3[1]) / 2 - 8}
        className={styles.edgeLabel}
        textAnchor="start"
      >
        maxDist {example.maxDistance} Å
      </text>
      {[
        [P1, 'L1', -22, 6],
        [P2, 'L2', 22, 6],
        [P3, 'L3', 0, -13],
      ].map(([[x, y], label, dx, dy]) => (
        <g key={label}>
          <circle cx={x} cy={y} r="6" className={styles.vertex} />
          <text x={x + dx} y={y + dy} className={styles.vertexLabel} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
    </svg>
  )
}

/* Step 6: two schematic key profiles over the same key axis. */
const PROFILE_A = [3, 0, 2, 0, 4, 1, 0, 2, 0, 1]
const PROFILE_B = [2, 1, 0, 0, 3, 0, 2, 2, 0, 0]

function Profiles() {
  const bar = 14
  const gap = 6
  return (
    <svg viewBox="0 0 220 120" className={styles.drawing} aria-hidden="true" focusable="false">
      {[
        [PROFILE_A, 52, 'A'],
        [PROFILE_B, 108, 'B'],
      ].map(([profile, baseline, name]) => (
        <g key={name}>
          <text x="0" y={baseline - 4} className={styles.axisLabel}>
            {name}
          </text>
          <line x1="16" y1={baseline} x2="216" y2={baseline} className={styles.axis} />
          {profile.map((count, index) => {
            if (count === 0) return null
            const shared = PROFILE_A[index] > 0 && PROFILE_B[index] > 0
            return (
              <rect
                key={index}
                x={20 + index * (bar + gap)}
                y={baseline - count * 9}
                width={bar}
                height={count * 9}
                className={shared ? styles.sharedBar : styles.ownBar}
              />
            )
          })}
        </g>
      ))}
    </svg>
  )
}

/*
 * What goes into the key, as a small two-column list, and the key itself. A
 * list rather than wrapped chips, so it fits the drawings' height in the
 * narrowest card without cutting anything off.
 */
function KeyPanel() {
  return (
    <div className={styles.keyPanel} aria-hidden="true">
      <span className={styles.keyTerm}>labels</span>
      <span className={styles.keyValue}>
        {v1.label} · {v2.label} · {v3.label}
      </span>
      <span className={styles.keyTerm}>θ class</span>
      <span className={styles.keyValue}>{example.thetaClass}</span>
      <span className={styles.keyTerm}>distance class</span>
      <span className={styles.keyValue}>{example.distanceClass}</span>
      <span className={styles.key}>{format.format(encodedKey)}</span>
    </div>
  )
}

/* "Val5–Ile61–Leu56". */
const triangleName = (t) => t.residues.map(residueId).join('–')

/*
 * Each card is a drawing and a sentence or two. The numbers behind them —
 * edges, bins, the encoding and the other triangles with this key — are in
 * the worked example below the figure, where they have the width to be read.
 */
function FullSteps() {
  return (
    <>
      <li className={styles.step}>
        <Structure />
        <p className={styles.title}>A 3D structure</p>
        <p>
          Ubiquitin, PDB entry {example.structure}, chain {example.chain}, drawn
          as a flat projection of its backbone.
        </p>
      </li>

      <li className={styles.step}>
        <Structure showPoints />
        <p className={styles.title}>Selected points</p>
        <p>
          One Cα atom per residue: {example.points} points. Atomic methods use
          heavy atoms; cross methods take points from two named sides.
        </p>
      </li>

      <li className={styles.step}>
        <Structure showPoints showTriangles />
        <p className={styles.title}>Triangles</p>
        <p>
          Every three points form a triangle: {format.format(example.triangles)}{' '}
          here. One is followed: {residueName(v1)}, {residueName(v2)},{' '}
          {residueName(v3)}.
        </p>
      </li>

      <li className={styles.step}>
        <Geometry />
        <p className={styles.title}>Labels and geometry</p>
        <p>
          The labels order the vertices L1, L2, L3, and θ is measured on the
          base, L1–L2. maxDist is the longest edge: here L2–L3, not the base.
        </p>
      </li>

      <li className={styles.step}>
        <KeyPanel />
        <p className={styles.title}>Classes and one key</p>
        <p>
          θ and maxDist are each binned into a class. The three labels and the
          two classes are encoded as one integer key.
        </p>
      </li>

      <li className={styles.step}>
        <Profiles />
        <p className={styles.title}>Count and compare</p>
        <p>
          A structure is described by which keys occur and how often. Structures
          are compared through the keys they share.
        </p>
      </li>
    </>
  )
}

/*
 * The followed triangle in numbers: the figure's companion, placed by the page
 * under a "Worked example" heading of its own (![](diagram:tsr-worked-example)),
 * so the heading sits in the page's outline and its "On this page" list where
 * the text puts it. The visible part is what a reader needs to check the
 * figure against; the encoding and the other triangles with the key are
 * optional, so they are disclosures.
 */
export function TsrWorkedExample() {
  const rows = [
    [
      'Vertices, in label order',
      [v1, v2, v3]
        .map((v, i) => `L${i + 1} ${residueName(v)} (label ${v.label})`)
        .join(', '),
    ],
    ['Base, L1–L2', `${example.base} Å`],
    ['L1–L3', `${example.edge13} Å`],
    ['L2–L3', `${example.edge23} Å, the longest edge, so maxDist`],
    ['θ', `${example.thetaRaw}° measured towards L2, folded to ${example.theta}°`],
    [
      'θ class',
      `${example.thetaClass} of ${T}: ${example.thetaClassRange[0]}° to under ${example.thetaClassRange[1]}°`,
    ],
    [
      'Distance class',
      `${example.distanceClass} of ${D}: ${example.distanceClassRange[0].toFixed(2)} to under ${example.distanceClassRange[1].toFixed(2)} Å`,
    ],
    ['Key', format.format(encodedKey)],
  ]

  return (
    <div className={styles.worked}>
      <p>
        The triangle followed in the figure, {residueName(v1)}–{residueName(v2)}–
        {residueName(v3)} of {example.structure} chain {example.chain}, as BioTSR{' '}
        {version} computes it.
      </p>

      <dl className={styles.facts}>
        {rows.map(([term, value]) => (
          <div key={term} className={styles.fact}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <p>
        The base is chosen by the vertex labels, so it need not be the longest
        edge, and here it is not: the base is {example.base} Å and maxDist is{' '}
        {example.maxDistance} Å.
      </p>
      <p>
        A key records the labels and the two classes, not the whole triangle.{' '}
        {example.keyFrequency} triangles in {example.structure} have this one: their
        θ lies between {one(thetaLow)}° and {one(thetaHigh)}° and their longest
        edges between {one(maxLow)} and {one(maxHigh)} Å, but their bases run from{' '}
        {one(baseLow)} to {one(baseHigh)} Å.
      </p>

      <details className={styles.more}>
        <summary className={styles.moreSummary}>How the key is encoded</summary>
        <div className={styles.moreBody}>
          <p>
            The key is one mixed-radix integer. The labels are digits of base {L}:{' '}
            <span className={styles.formula}>
              {v1.label - 1}·{L}² + {v2.label - 1}·{L} + {v3.label - 1} ={' '}
              {format.format(labelIndex)}
            </span>
            . That is weighted by the {D} distance classes and the {T} angle
            classes, and the two classes are added in, each counted from 0:{' '}
            <span className={styles.formula}>
              {format.format(labelIndex)}·{D}·{T} + {example.distanceClass - 1}·{T} +{' '}
              {example.thetaClass - 1} = {format.format(encodedKey)}
            </span>
            .
          </p>
        </div>
      </details>

      <details className={styles.more}>
        <summary className={styles.moreSummary}>
          All {example.keyFrequency} triangles with key {format.format(encodedKey)}
        </summary>
        <div className={styles.moreBody}>
          <div
            className={styles.scroll}
            tabIndex={0}
            role="group"
            aria-label="Table, scrolls horizontally"
          >
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Triangle (L1–L2–L3)</th>
                  <th scope="col">Base, L1–L2</th>
                  <th scope="col">L1–L3</th>
                  <th scope="col">L2–L3</th>
                  <th scope="col">maxDist</th>
                  <th scope="col">θ</th>
                </tr>
              </thead>
              <tbody>
                {sameKey.map((t) => (
                  <tr key={t.residues.join()}>
                    <th scope="row">{triangleName(t)}</th>
                    {t.edges.map((edge, i) => (
                      <td key={i}>{edge.toFixed(2)} Å</td>
                    ))}
                    <td>{t.maxDistance.toFixed(2)} Å</td>
                    <td>{t.theta.toFixed(1)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The first row is the triangle in the figure. The longest edge is a
            different edge in different rows, and the shapes differ; what the
            four share is their labels, their θ class and their distance class.
          </p>
        </div>
      </details>
    </div>
  )
}

function CompactSteps() {
  return (
    <>
      <li className={styles.step}>
        <Structure showPoints />
        <p className={styles.title}>Points</p>
        <p>
          One Cα atom per residue of ubiquitin ({example.structure}):{' '}
          {example.points} points.
        </p>
      </li>

      <li className={styles.step}>
        <Structure showPoints showTriangles />
        <p className={styles.title}>Triangles</p>
        <p>
          Every three points form a triangle: {format.format(example.triangles)}.
          One is followed: {residueName(v1)}, {residueName(v2)}, {residueName(v3)}.
        </p>
      </li>

      <li className={styles.step}>
        <Geometry />
        <p className={styles.title}>Labels and geometry</p>
        <p>
          Labels order the vertices; θ is measured on the base L1–L2. The longest
          edge, here L2–L3, gives maxDist.
        </p>
      </li>

      <li className={styles.step}>
        <KeyPanel />
        <p className={styles.title}>One key</p>
        <p>
          The labels, the θ class and the maxDist class are combined into one
          integer. A structure is described by its keys and their counts.
        </p>
      </li>
    </>
  )
}

export default function TsrOverview({ variant = 'full' }) {
  const compact = variant === 'compact'
  const captionId = `tsr-overview-caption-${variant}`

  return (
    <figure
      className={compact ? `${styles.figure} ${styles.compact}` : `${styles.figure} ${styles.full}`}
      aria-labelledby={captionId}
    >
      <ol className={styles.steps}>{compact ? <CompactSteps /> : <FullSteps />}</ol>

      <figcaption id={captionId} className={styles.caption}>
        <strong>
          {compact
            ? 'From a structure to TSR keys.'
            : 'From a structure to TSR keys, for one triangle of ubiquitin.'}
        </strong>{' '}
        Computed with BioTSR {version} (protein Cα TSR, {example.structure} chain{' '}
        {example.chain}). The structure is a 2-D projection; the triangle in the
        geometry step is drawn to scale
        {compact
          ? '.'
          : '. Step 6 is schematic. The worked example below gives the numbers.'}
      </figcaption>
    </figure>
  )
}
