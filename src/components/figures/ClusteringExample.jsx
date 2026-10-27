import data from './clusteringExample.json'
import styles from './Figures.module.css'

/*
 * From keys to a clustered heat map, for the 22 nucleotides of 1BNA.
 *
 * Everything drawn is BioTSR 1.0.0's own result, written by
 * scripts/figures/clustering-example.py from tutorial 08: the generalized
 * Jaccard distances, the 21 average-linkage merges with their heights, and
 * the leaf order the heat map follows. The page computes nothing but
 * positions.
 *
 * Two things the figure is careful not to say. It draws no cluster boxes and
 * names no number of clusters: BioTSR's result is the tree, which describes
 * groupings at every height, and a flat cut is a separate choice with a rule
 * stated in advance. And the observed bases are printed beside the rows only
 * to be read against the tree; the tree was built from the distances alone.
 * The one sentence about how the bases fall is counted from the merges here,
 * not copied from the tutorial, so it cannot drift from the data.
 */

const n = data.leaves.length
const CELL = 15
const DEND = 130
const GAP = 6
const LABEL = 40
const TOP = 8
const MAP_X = DEND + GAP
const MAP_SIZE = n * CELL
const WIDTH = MAP_X + MAP_SIZE + GAP + LABEL
const LEGEND_Y = TOP + MAP_SIZE + 22
const HEIGHT = LEGEND_Y + 40

const rowOf = Object.fromEntries(data.leaves.map((leaf, index) => [leaf.id, index]))
const maxHeight = Math.max(...data.merges.map((m) => m.height))
const xOf = (height) => DEND - (height / maxHeight) * (DEND - 6)

/* Each node's position: leaves by row, merges midway between their children. */
const nodes = data.sampleOrder.map((id) => ({ y: TOP + (rowOf[id] + 0.5) * CELL, height: 0, bases: new Set([data.leaves[rowOf[id]].base]) }))
for (const merge of data.merges) {
  const [left, right] = [nodes[merge.left], nodes[merge.right]]
  nodes.push({
    y: (left.y + right.y) / 2,
    height: merge.height,
    bases: new Set([...left.bases, ...right.bases]),
    left,
    right,
  })
}
const internal = nodes.slice(n)

/* How many of the first merges join residues of a single base. */
let sameBase = 0
while (sameBase < internal.length && internal[sameBase].bases.size === 1) sameBase += 1
const sameBaseHeight = internal[sameBase - 1]?.height

/* "DA ×4, DG ×8, …": the observed bases down the rows. */
const runs = []
for (const leaf of data.leaves) {
  const last = runs.at(-1)
  if (last && last.base === leaf.base) last.count += 1
  else runs.push({ base: leaf.base, count: 1 })
}
const rowSummary = runs.map((r) => `${r.base} ×${r.count}`).join(', ')

const shade = (distance) =>
  `color-mix(in srgb, var(--color-primary) ${Math.round((1 - distance) * 100)}%, var(--color-background))`

export default function ClusteringExample() {
  const description =
    `Heat map of the generalized Jaccard distances between the ${n} nucleotides of ` +
    `${data.structure}, with the average-linkage tree on the left. Rows, top to bottom, ` +
    `are ${rowSummary}.`

  return (
    <figure className={styles.figure} aria-labelledby="clustering-example-caption">
      <div className={styles.scrollFigure}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.heatmap} role="img" aria-label={description}>
          {internal.map((node, index) => (
            <g key={index} className={styles.tree}>
              <line x1={xOf(node.height)} y1={node.left.y} x2={xOf(node.height)} y2={node.right.y} />
              <line x1={xOf(node.left.height)} y1={node.left.y} x2={xOf(node.height)} y2={node.left.y} />
              <line x1={xOf(node.right.height)} y1={node.right.y} x2={xOf(node.height)} y2={node.right.y} />
            </g>
          ))}

          {data.distance.map((row, i) =>
            row.map((distance, j) => (
              <rect
                key={`${i}-${j}`}
                x={MAP_X + j * CELL}
                y={TOP + i * CELL}
                width={CELL}
                height={CELL}
                style={{ fill: shade(distance) }}
              />
            )),
          )}

          {data.leaves.map((leaf, index) => (
            <text
              key={leaf.id}
              x={MAP_X + MAP_SIZE + GAP}
              y={TOP + (index + 0.5) * CELL + 4}
              className={styles.rowLabel}
            >
              {leaf.base}
            </text>
          ))}

          <defs>
            <linearGradient id="distance-scale">
              <stop offset="0" style={{ stopColor: shade(0) }} />
              <stop offset="1" style={{ stopColor: shade(1) }} />
            </linearGradient>
          </defs>
          <rect x={MAP_X} y={LEGEND_Y} width={MAP_SIZE} height="10" fill="url(#distance-scale)" className={styles.scale} />
          <text x={MAP_X} y={LEGEND_Y + 26} className={styles.scaleLabel}>0</text>
          <text x={MAP_X + MAP_SIZE / 2} y={LEGEND_Y + 26} textAnchor="middle" className={styles.scaleLabel}>
            generalized Jaccard distance
          </text>
          <text x={MAP_X + MAP_SIZE} y={LEGEND_Y + 26} textAnchor="end" className={styles.scaleLabel}>1</text>
        </svg>
      </div>

      <figcaption id="clustering-example-caption" className={styles.caption}>
        <strong>Keys, distances and the tree, for the {n} nucleotides of {data.structure}.</strong>{' '}
        Computed with BioTSR 1.0.0, following its tutorial 08: one sample per residue
        ({new Intl.NumberFormat('en-GB').format(data.distinctKeys)} distinct keys between them),
        generalized Jaccard distances, average linkage. Darker cells are more similar
        residues; rows and columns follow the tree. The base of each residue is printed
        beside its row afterwards, for comparison; the tree was built from the distances
        alone. In this one structure the first {sameBase} of the {internal.length} merges,
        up to a distance of {sameBaseHeight?.toFixed(2)}, each join residues of the same base.
        No number of clusters was chosen: the result is the tree itself.
      </figcaption>
    </figure>
  )
}
