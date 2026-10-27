import { ALPHA_CARBONS, BACKBONE } from '../home/ubiquitin'
import overview from './tsrOverviewExample.json'
import example from './pointChoiceExample.json'
import styles from './Figures.module.css'

/*
 * Cα or atoms: the two ways a TSR method chooses its points, on one residue.
 *
 * Both panels are real. The left is the ubiquitin trace the home page and
 * /tsr draw (scripts/derive-1ubq-figure.mjs), with Leu15's Cα marked; its
 * counts are the protein Cα run behind the TSR overview. The right is Leu15's
 * eight heavy atoms as BioTSR's amino-acid atomic method read them, projected
 * flat by scripts/figures/point-choice-example.py, with BioTSR's element
 * labels. Bonds are drawn only so the residue is recognisable; TSR does not
 * use them, and the caption says so.
 *
 * Elements are told apart by shape as well as by name: carbon a circle,
 * nitrogen a square, oxygen a diamond.
 */

const format = new Intl.NumberFormat('en-GB')
const LEU15 = ALPHA_CARBONS[example.number - 1]

/* Leucine's bonds between heavy atoms, for orientation only. */
const BONDS = [
  ['N', 'CA'],
  ['CA', 'C'],
  ['C', 'O'],
  ['CA', 'CB'],
  ['CB', 'CG'],
  ['CG', 'CD1'],
  ['CG', 'CD2'],
]

const SCALE = 46
const xs = example.atoms.map((a) => a.xy[0])
const ys = example.atoms.map((a) => a.xy[1])
const PAD = 44
const toSvg = ([x, y]) => [PAD + (x - Math.min(...xs)) * SCALE, PAD + (Math.max(...ys) - y) * SCALE]
const WIDTH = PAD * 2 + (Math.max(...xs) - Math.min(...xs)) * SCALE
const HEIGHT = PAD * 2 + (Math.max(...ys) - Math.min(...ys)) * SCALE
const position = Object.fromEntries(example.atoms.map((a) => [a.name, toSvg(a.xy)]))

const elements = [...new Set(example.atoms.map((a) => `${a.element} ${a.label}`))].join(', ')

function Atom({ atom }) {
  const [x, y] = position[atom.name]
  const r = 9
  const shape =
    atom.element === 'N' ? (
      <rect x={x - r} y={y - r} width={r * 2} height={r * 2} className={styles.atomN} />
    ) : atom.element === 'O' ? (
      <polygon
        points={`${x},${y - r - 2} ${x + r + 2},${y} ${x},${y + r + 2} ${x - r - 2},${y}`}
        className={styles.atomO}
      />
    ) : (
      <circle cx={x} cy={y} r={r} className={styles.atomC} />
    )
  return (
    <g>
      {shape}
      {/* Upper right of the atom, clear of the bond lines through its centre. */}
      <text x={x + 12} y={y - 9} textAnchor="start" className={styles.atomLabel}>
        {atom.name}
      </text>
    </g>
  )
}

export default function PointChoice() {
  return (
    <figure className={styles.figure} aria-labelledby="point-choice-caption">
      <ol className={styles.panels}>
        <li className={styles.panel}>
          <svg viewBox="20 10 560 380" className={styles.drawing} aria-hidden="true" focusable="false">
            <path d={BACKBONE} className={styles.traceFaint} />
            {ALPHA_CARBONS.map(([x, y], index) => (
              <circle key={index} cx={x} cy={y} r="5.5" className={styles.point} />
            ))}
            <circle cx={LEU15[0]} cy={LEU15[1]} r="13" className={styles.marked} />
          </svg>
          <p className={styles.panelTitle}>Cα methods: one point per residue</p>
          <p>
            Ubiquitin chain A gives {overview.points} points and{' '}
            {format.format(overview.triangles)} triangles. Leu{example.number} is one
            of the points, ringed.
          </p>
        </li>

        <li className={styles.panel}>
          <svg
            viewBox={`0 0 ${WIDTH.toFixed(0)} ${HEIGHT.toFixed(0)}`}
            className={styles.drawing}
            aria-hidden="true"
            focusable="false"
          >
            {BONDS.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={position[a][0]}
                y1={position[a][1]}
                x2={position[b][0]}
                y2={position[b][1]}
                className={styles.bond}
              />
            ))}
            {example.atoms.map((atom) => (
              <Atom key={atom.name} atom={atom} />
            ))}
          </svg>
          <p className={styles.panelTitle}>Atomic methods: every heavy atom</p>
          <p>
            Leu{example.number}’s {example.atoms.length} heavy atoms, each labelled by its
            element ({elements}), form {example.triangles} triangles with{' '}
            {example.distinctKeys} distinct keys.
          </p>
        </li>
      </ol>
      <figcaption id="point-choice-caption" className={styles.caption}>
        <strong>The same residue, as one point or as its atoms.</strong> Computed with
        BioTSR 1.0.0 on {example.structure} chain {example.chain}. Both drawings are flat
        projections; bonds are drawn for orientation only, and TSR does not use them.
        Carbon is a circle, nitrogen a square and oxygen a diamond.
      </figcaption>
    </figure>
  )
}
