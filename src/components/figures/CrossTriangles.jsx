import data from './crossExample.json'
import styles from './Figures.module.css'

/*
 * Cross TSR: which atoms take part, and which triangles are formed.
 *
 * The atoms and every number are a real BioTSR 1.0.0 run
 * (scripts/figures/cross-example.py): the atoms of each side that were in
 * contact, how many each side offered, and the triangle and key counts. Only
 * the drawing in the middle is a schematic, and the caption says so: it
 * shows the two kinds of triangle that are formed, each with atoms on both
 * sides, and the two that are not.
 *
 * `example` picks the run: the nucleotide–protein one (2AC0, also shown at a
 * 3.0 Å cutoff) or the ligand–protein one (3PTB). Sides are told apart by
 * shape as well as position — molecule atoms are circles, protein atoms
 * squares — and every count is in the text.
 */

const format = new Intl.NumberFormat('en-GB')
const ROLE = { nucleotide: 'Nucleotide', drug: 'Ligand', protein: 'Protein' }

/* "DG 8 OP1" -> "OP1"; "ARG 280 NH1" -> "Arg280 NH1". */
const atomName = (id, showResidue) => {
  const [residue, number, atom] = id.split(' ')
  return showResidue ? `${residue.charAt(0)}${residue.slice(1).toLowerCase()}${number} ${atom}` : atom
}

const choose2 = (n) => (n * (n - 1)) / 2

function Side({ role, offered, pool, atoms, residueName }) {
  const protein = role === 'protein'
  return (
    <div className={styles.side}>
      <p className={styles.sideTitle}>
        {protein ? 'Protein chain' : `${ROLE[role]} ${residueName}`}
      </p>
      <p className={styles.sideCount}>
        {pool} of {format.format(offered)} heavy atoms in contact
      </p>
      <ul className={styles.chips} data-shape={protein ? 'square' : 'circle'}>
        {atoms.map((id) => (
          <li key={id}>{atomName(id, protein)}</li>
        ))}
      </ul>
    </div>
  )
}

/* Two formed triangles and two that are not, drawn between the two sides. */
function Schematic() {
  const A = [
    [40, 40],
    [40, 100],
    [40, 160],
  ]
  const B = [
    [180, 30],
    [180, 95],
    [180, 160],
  ]
  const sq = (x, y) => <rect x={x - 7} y={y - 7} width="14" height="14" className={styles.atomB} />
  const ci = (x, y) => <circle cx={x} cy={y} r="7" className={styles.atomA} />
  return (
    <svg viewBox="0 0 220 200" className={styles.schematic} aria-hidden="true" focusable="false">
      <polygon points={`${A[0]} ${A[1]} ${B[0]}`} className={styles.formedOne} />
      <polygon points={`${A[2]} ${B[1]} ${B[2]}`} className={styles.formedTwo} />
      {A.map(([x, y]) => (
        <g key={`a${y}`}>{ci(x, y)}</g>
      ))}
      {B.map(([x, y]) => (
        <g key={`b${y}`}>{sq(x, y)}</g>
      ))}
      <text x="110" y="196" textAnchor="middle" className={styles.schematicLabel}>
        2 + 1 and 1 + 2 only
      </text>
    </svg>
  )
}

export default function CrossTriangles({ example = 'nucleotide' }) {
  const chosen = data.examples[example] ?? data.examples.nucleotide
  const [run, ...others] = chosen.runs
  /* BioTSR's side A is the molecule for some methods and the protein for
     others; the figure always puts the molecule on the left. */
  const molecule = run.roleA === 'protein' ? 'B' : 'A'
  const protein = molecule === 'A' ? 'B' : 'A'
  const side = (r, key) => ({
    role: r[`role${key}`],
    offered: r[`offered${key}`],
    pool: r[`pool${key}`],
    atoms: r[`atoms${key}`],
  })
  const sides = [side(run, molecule), side(run, protein)]
  const [m, p] = [sides[0].pool, sides[1].pool]
  const residueName = sides[0].atoms[0].split(' ').slice(0, 2).join(' ')
  const captionId = `cross-triangles-caption-${example}`

  return (
    <figure className={styles.figure} aria-labelledby={captionId}>
      <div className={styles.cross}>
        <Side {...sides[0]} residueName={residueName} />
        <Schematic />
        <Side {...sides[1]} residueName={residueName} />
      </div>

      <p className={styles.formula}>
        Every triangle has atoms on both sides: two {ROLE[sides[0].role].toLowerCase()} atoms
        and one protein atom, or one and two. With {m} and {p} atoms that is {m} × C({p}, 2) +{' '}
        {p} × C({m}, 2) = {m * choose2(p)} + {p * choose2(m)} ={' '}
        <strong>{format.format(run.triangles)} triangles</strong>, with{' '}
        {format.format(run.distinctKeys)} distinct keys. Triangles with all three atoms on one
        side are not formed.
      </p>

      {others.map((other) => {
        const [om, op] = [side(other, molecule), side(other, protein)]
        const sameMolecule = om.atoms.join() === sides[0].atoms.join()
        return (
          <p key={other.cutoff} className={styles.formula}>
            At a {other.cutoff.toFixed(1)} Å cutoff,{' '}
            {sameMolecule
              ? `the same ${om.pool} ${ROLE[om.role].toLowerCase()} atoms`
              : `${om.pool} ${ROLE[om.role].toLowerCase()} atoms`}{' '}
            and {op.pool} protein atoms are in contact, giving{' '}
            {format.format(other.triangles)} triangles: the cutoff decides which atoms
            become vertices.
          </p>
        )
      })}

      <figcaption id={captionId} className={styles.caption}>
        <strong>Cross TSR for {chosen.label}.</strong> Computed with BioTSR 1.0.0 at the
        reference {run.cutoff.toFixed(1)} Å contact cutoff; an atom is in contact when an atom of the
        other side lies within the cutoff of it. The atoms are those BioTSR selected; the
        drawing between them is schematic (circles: {ROLE[sides[0].role].toLowerCase()}{' '}
        atoms, squares: protein atoms).
      </figcaption>
    </figure>
  )
}
