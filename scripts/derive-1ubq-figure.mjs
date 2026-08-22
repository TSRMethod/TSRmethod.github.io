/*
 * Turns the real 1UBQ structure into the small static figure the home page
 * draws.
 *
 * RUN BY HAND, NOT BY THE BUILD, and never by a visitor's browser:
 *
 *   node scripts/derive-1ubq-figure.mjs path/to/1UBQ.pdb
 *
 * It writes src/components/home/ubiquitin.js — about eighty numbers — and
 * that file is what ships. Nothing fetches RCSB at runtime, there is no PDB
 * parser in the bundle, and the coordinates cannot drift from the structure
 * they came from because they are not edited by hand.
 *
 * WHAT IT DOES
 *
 *   1. Reads the Cα atom of every residue in chain A: 76 points, the
 *      backbone trace of ubiquitin.
 *   2. Centres them and finds the two directions the molecule is widest in
 *      (the leading eigenvectors of the coordinate covariance), then projects
 *      onto those. That is the view that shows the most of the fold — the
 *      β-sheet across the front and the helix behind it — rather than an
 *      arbitrary axis-aligned one, and it is derived rather than chosen, so
 *      re-running this on another structure gives its best view too.
 *   3. Fits the projection to the figure's 600×400 viewBox.
 *   4. Picks the residue triplets the animation draws as TSR triangles,
 *      preferring genuinely scalene ones — see pickTriplets.
 *
 * Source: RCSB PDB entry 1UBQ (Vijay-Kumar, Bugg & Cook, 1987), the 1.8 Å
 * refined structure of ubiquitin.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = resolve(root, 'src/components/home/ubiquitin.js')

/* The drawing area, matching the viewBox the component declares. */
const WIDTH = 600
const HEIGHT = 400
const PADDING = 26

/** Every Cα in chain A, in file order, as [x, y, z] in ångströms. */
function readAlphaCarbons(pdb) {
  const points = []

  for (const line of pdb.split('\n')) {
    if (!line.startsWith('ATOM')) continue
    if (line.slice(12, 16).trim() !== 'CA') continue
    if (line.slice(21, 22) !== 'A') continue
    /* Alternate locations: take the first only, so a residue modelled twice
       does not put two points on top of each other. */
    const altLoc = line.slice(16, 17).trim()
    if (altLoc !== '' && altLoc !== 'A') continue

    points.push([
      Number(line.slice(30, 38)),
      Number(line.slice(38, 46)),
      Number(line.slice(46, 54)),
    ])
  }

  return points
}

const subtract = (a, b) => a.map((value, i) => value - b[i])
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0)
const norm = (v) => Math.sqrt(dot(v, v))
const scale = (v, k) => v.map((value) => value * k)

function centroid(points) {
  const sum = points.reduce(
    (acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]],
    [0, 0, 0],
  )
  return scale(sum, 1 / points.length)
}

/** 3×3 covariance of a centred point cloud. */
function covariance(points) {
  const m = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  for (const p of points) {
    for (let i = 0; i < 3; i += 1) {
      for (let j = 0; j < 3; j += 1) m[i][j] += p[i] * p[j]
    }
  }
  return m.map((row) => row.map((value) => value / points.length))
}

const multiply = (m, v) => m.map((row) => dot(row, v))

/**
 * The dominant eigenvector, by power iteration.
 *
 * Enough for this: the covariance of a point cloud is symmetric positive
 * semi-definite, its leading eigenvalue is well separated here, and fifty
 * iterations converge far past the precision a 600-unit drawing needs.
 */
function principalAxis(m, avoid = []) {
  let v = [0.577, 0.577, 0.577]

  for (let step = 0; step < 200; step += 1) {
    let next = multiply(m, v)
    /* Deflate against axes already taken, so the second call returns the
       next direction rather than the first one again. */
    for (const axis of avoid) next = subtract(next, scale(axis, dot(next, axis)))
    const length = norm(next)
    if (length < 1e-9) return v
    v = scale(next, 1 / length)
  }

  return v
}

/**
 * Do two backbone segments cross when drawn flat?
 *
 * Used to choose the viewing direction. A projection is not judged on how
 * much of the molecule it spreads out but on how few times the chain crosses
 * itself, because a trace that crosses itself twenty times reads as a tangle
 * however wide it is — and the point of showing a protein at all is that a
 * visitor recognises one.
 */
function segmentsCross(p1, p2, p3, p4) {
  const d = (a, b, c) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

  const d1 = d(p3, p4, p1)
  const d2 = d(p3, p4, p2)
  const d3 = d(p1, p2, p3)
  const d4 = d(p1, p2, p4)

  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))
}

function crossings(flat) {
  let count = 0
  for (let i = 0; i < flat.length - 1; i += 1) {
    /* Skip the neighbouring segment: consecutive bonds share an endpoint. */
    for (let j = i + 2; j < flat.length - 1; j += 1) {
      if (segmentsCross(flat[i], flat[i + 1], flat[j], flat[j + 1])) count += 1
    }
  }
  return count
}

/**
 * Projects the structure onto the pair of principal axes that produces the
 * most legible flat view, and fits it to the viewBox.
 *
 * The three principal axes give three candidate views. The widest of them —
 * the first two axes, which is what a plain PCA projection gives you — turned
 * ubiquitin into a ball of string; the least self-overlapping one shows the
 * fold. Which pair wins is measured, not assumed, so this stays true for
 * whatever structure is passed in.
 */
function project(points) {
  const centre = centroid(points)
  const centred = points.map((p) => subtract(p, centre))
  const cov = covariance(centred)

  const axis1 = principalAxis(cov)
  const axis2 = principalAxis(cov, [axis1])
  const axis3 = principalAxis(cov, [axis1, axis2])

  const candidates = [
    { name: 'axes 1×2', pair: [axis1, axis2] },
    { name: 'axes 1×3', pair: [axis1, axis3] },
    { name: 'axes 2×3', pair: [axis2, axis3] },
  ].map((candidate) => {
    const [u, v] = candidate.pair
    const flat = centred.map((p) => [dot(p, u), dot(p, v)])
    return { ...candidate, flat, crossings: crossings(flat) }
  })

  candidates.sort((a, b) => a.crossings - b.crossings)
  for (const candidate of candidates) {
    console.log(`  ${candidate.name}: ${candidate.crossings} self-crossings`)
  }

  const chosen = candidates[0]
  const flat = chosen.flat
  console.log(`  chosen: ${chosen.name}`)

  /*
   * Depth along the axis that was projected away, normalised to 0…1.
   *
   * This is what lets a flat drawing read as a three-dimensional object: the
   * parts of the chain nearer the viewer are drawn a little stronger than the
   * parts behind them. Without it a Cα trace of a globular fold is a ball of
   * string; with it, the front of the molecule comes forward.
   */
  const depthAxis = [axis1, axis2, axis3].find(
    (axis) => !chosen.pair.includes(axis),
  )
  const depths = centred.map((p) => dot(p, depthAxis))
  const minDepth = Math.min(...depths)
  const maxDepth = Math.max(...depths)
  const depth = depths.map((d) => round((d - minDepth) / (maxDepth - minDepth)))

  const xs = flat.map((p) => p[0])
  const ys = flat.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const factor = Math.min(
    (WIDTH - 2 * PADDING) / (maxX - minX),
    (HEIGHT - 2 * PADDING) / (maxY - minY),
  )

  const offsetX = (WIDTH - (maxX - minX) * factor) / 2
  const offsetY = (HEIGHT - (maxY - minY) * factor) / 2

  return {
    points: flat.map(([x, y]) => [
      round((x - minX) * factor + offsetX),
      /* SVG y grows downwards; flipping keeps the fold the way up it is drawn
         in the literature. */
      round(HEIGHT - ((y - minY) * factor + offsetY)),
    ]),
    depth,
  }
}

const round = (value) => Math.round(value * 10) / 10

/**
 * A smooth backbone through the Cα trace, as one SVG path.
 *
 * Catmull-Rom converted to cubic Béziers: it passes exactly through every
 * α-carbon — so the curve is the structure, not an impression of it — while
 * reading as the smooth ribbon a viewer expects rather than a 76-segment
 * polyline.
 */
function backbonePath(points, only = null) {
  if (points.length < 2) return ''

  const parts = []
  let penDown = false

  for (let i = 0; i < points.length - 1; i += 1) {
    /* `only` selects a subset of segments — the near half of the chain — and
       lifts the pen across the gaps, so one path can draw several runs. */
    if (only && !only(i)) {
      penDown = false
      continue
    }

    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]

    if (!penDown) {
      parts.push(`M${p1[0]},${p1[1]}`)
      penDown = true
    }

    const c1 = [round(p1[0] + (p2[0] - p0[0]) / 6), round(p1[1] + (p2[1] - p0[1]) / 6)]
    const c2 = [round(p2[0] - (p3[0] - p1[0]) / 6), round(p2[1] - (p3[1] - p1[1]) / 6)]

    parts.push(`C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`)
  }

  return parts.join('')
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

/**
 * The residue triplets drawn as TSR triangles.
 *
 * Chosen for what TSR itself cares about: three residues far enough apart in
 * the chain to be a real spatial relationship rather than three consecutive
 * backbone neighbours, close enough together on screen to read as one shape,
 * and — the point of the method — with three clearly different side lengths.
 * A key is distinctive because the triangle is scalene; an equilateral one
 * would illustrate the wrong idea.
 */
function pickTriplets(flat, count = 3) {
  const n = flat.length
  const candidates = []

  /*
   * Only the right of the figure is actually on show: the layer that holds it
   * is masked away towards the text so the heading stays readable. A triangle
   * drawn across the left of the fold is a triangle nobody sees, so the
   * search is limited to the region the page really displays.
   */
  const VISIBLE_FROM = 215

  for (let a = 0; a < n; a += 1) {
    if (flat[a][0] < VISIBLE_FROM) continue
    for (let b = a + 6; b < n; b += 1) {
      if (flat[b][0] < VISIBLE_FROM) continue
      for (let c = b + 6; c < n; c += 1) {
        if (flat[c][0] < VISIBLE_FROM) continue
        const sides = [
          distance(flat[a], flat[b]),
          distance(flat[b], flat[c]),
          distance(flat[a], flat[c]),
        ].sort((x, y) => x - y)

        if (sides[0] < 60) continue /* too small to read */
        /*
         * An upper bound as well as a lower one. Without it the best-scoring
         * triangles were chords right across the molecule — three residues
         * that happen to be far apart, drawn as lines over the whole fold.
         * A TSR triangle should sit inside the structure and look like a
         * relationship between parts of it.
         */
        if (sides[2] > 210) continue

        const scalene = sides[2] / sides[0]
        const middle = sides[1] / sides[0]

        /*
         * Scalene, but not a splinter. Sorting purely on "most unequal"
         * produced triangles with one 70-unit side against a 320-unit one —
         * shapes that read as a bent line rather than as a triangle. The
         * window below asks for sides that are clearly different and a
         * smallest angle wide enough to see, which is what a triangle drawn
         * between three residues of a real fold usually looks like anyway.
         */
        if (scalene < 1.45 || scalene > 2.4) continue
        /*
         * All three sides mutually different, not merely the extremes: a
         * ratio of 1 : 1.45 : 1.45 satisfies "longest well clear of shortest"
         * while being an isosceles triangle, which is the symmetry this is
         * supposed to avoid.
         */
        if (middle < 1.18) continue
        if (sides[2] / sides[1] < 1.15) continue

        /* Law of cosines on the shortest side gives the smallest angle. */
        const smallestAngle =
          (Math.acos(
            (sides[1] ** 2 + sides[2] ** 2 - sides[0] ** 2) /
              (2 * sides[1] * sides[2]),
          ) *
            180) /
          Math.PI
        if (smallestAngle < 25) continue

        /* Heron's formula: bigger triangles read better at this scale. */
        const s = (sides[0] + sides[1] + sides[2]) / 2
        const area = Math.sqrt(
          s * (s - sides[0]) * (s - sides[1]) * (s - sides[2]),
        )

        candidates.push({ residues: [a, b, c], scalene, middle, sides, area })
      }
    }
  }

  candidates.sort((x, y) => y.area - x.area)

  /* Spread the choices over the chain so the animation moves around the
     structure instead of redrawing the same corner. */
  const chosen = []
  for (const candidate of candidates) {
    const tooClose = chosen.some((picked) =>
      picked.residues.some((r) =>
        candidate.residues.some((s) => Math.abs(r - s) < 4),
      ),
    )
    if (tooClose) continue
    chosen.push(candidate)
    if (chosen.length === count) break
  }

  return chosen
}

/* ------------------------------------------------------------------------ */

const source = process.argv[2]
if (!source) {
  console.error('usage: node scripts/derive-1ubq-figure.mjs <path to 1UBQ.pdb>')
  process.exit(1)
}

const alphaCarbons = readAlphaCarbons(readFileSync(source, 'utf8'))
if (alphaCarbons.length < 50) {
  console.error(`only ${alphaCarbons.length} Cα atoms found — is that a 1UBQ file?`)
  process.exit(1)
}

const projection = project(alphaCarbons)
const flat = projection.points
const depth = projection.depth
const triplets = pickTriplets(flat)

/* A bond counts as "near" when both of its residues are in the front half. */
const median = [...depth].sort((a, b) => a - b)[Math.floor(depth.length / 2)]
const isNear = (i) => depth[i] >= median && depth[i + 1] >= median

/* Every fourth residue, plus every triangle vertex: enough points to read as
   a chain of residues, few enough to leave the fold itself legible. */
const shown = new Set(flat.map((_, i) => i).filter((i) => i % 4 === 0))
for (const triplet of triplets) for (const r of triplet.residues) shown.add(r)

const residues = [...shown].sort((a, b) => a - b)

const output = `/*
 * The home page figure, derived from the real structure of ubiquitin.
 *
 * GENERATED — do not edit by hand. Regenerate with:
 *
 *   node scripts/derive-1ubq-figure.mjs <path to 1UBQ.pdb>
 *
 * Source: RCSB PDB entry 1UBQ, ubiquitin refined at 1.8 Å (Vijay-Kumar, Bugg
 * & Cook, 1987). ${alphaCarbons.length} α-carbons, projected onto the two
 * directions the molecule is widest in and fitted to a ${WIDTH}×${HEIGHT}
 * viewBox. The script explains every step; this file is only its output.
 */

/** The Cα trace as one smooth path, passing through every α-carbon. */
export const BACKBONE = '${backbonePath(flat)}'

/**
 * The runs of that trace nearest the viewer, as a second path.
 *
 * Drawn over the first, slightly stronger: the depth cue that stops a flat
 * Cα trace of a globular fold reading as a ball of string.
 */
export const BACKBONE_NEAR = '${backbonePath(flat, isNear)}'

/** Every α-carbon, in chain order: [x, y] in viewBox units. */
export const ALPHA_CARBONS = ${JSON.stringify(flat)}

/** How near the viewer each α-carbon is, 0 (behind) to 1 (in front). */
export const DEPTH = ${JSON.stringify(depth)}

/** The subset drawn as visible residue points — indices into ALPHA_CARBONS. */
export const RESIDUE_POINTS = ${JSON.stringify(residues)}

/**
 * The residue triplets the animation draws as TSR triangles. \`residues\` are
 * indices into ALPHA_CARBONS, so a triangle's corners are the same points the
 * figure already draws — the geometry cannot disagree with itself.
 */
export const TRIPLETS = ${JSON.stringify(
  triplets.map((t) => ({
    residues: t.residues,
    perimeter: Math.round(t.sides.reduce((sum, side) => sum + side, 0)),
  })),
)}
`

writeFileSync(OUTPUT, output)

console.log(`Cα atoms:        ${alphaCarbons.length}`)
console.log(`residue points:  ${residues.length}`)
console.log(`triplets:`)
for (const t of triplets) {
  const sides = t.sides.map((s) => Math.round(s))
  console.log(
    `  residues ${t.residues.map((r) => r + 1).join(', ')} — sides ${sides.join(' / ')} (ratio 1 : ${(
      t.sides[1] / t.sides[0]
    ).toFixed(2)} : ${t.scalene.toFixed(2)})`,
  )
}
console.log(`written: ${OUTPUT}`)
