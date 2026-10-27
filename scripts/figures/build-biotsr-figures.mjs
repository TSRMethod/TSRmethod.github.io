/*
 * Builds the two BioTSR reference figures shown on /software.
 *
 * RUN BY HAND, NOT BY THE BUILD:
 *
 *   node scripts/figures/build-biotsr-figures.mjs
 *       redraws both SVGs from the data file below;
 *
 *   node scripts/figures/build-biotsr-figures.mjs --from path/to/CAPABILITY_MATRIX.md
 *       first rereads the data from BioTSR's released capability matrix
 *       (docs/CAPABILITY_MATRIX.md at the release tag), then redraws.
 *
 * Writes:
 *   scripts/figures/data/biotsr-1.0.0-capabilities.json
 *   public/images/figures/biotsr-1.0.0-capability-matrix.svg
 *   public/images/figures/biotsr-1.0.0-architecture.svg
 *
 * WHY A SCRIPT. The capability figure is a picture of a table BioTSR
 * generates from its own method registry, so its cells are read from that
 * table rather than typed: a method gaining or losing a modifier in a later
 * release changes the figure when this is rerun, and cannot be mistyped. The
 * architecture figure is a diagram, so its words are written here — each one
 * checked against the released documentation — and the script only lays them
 * out. Both are plain SVG with the site's colours and no external fonts or
 * images, so they stay editable and render the same wherever they are opened.
 *
 * Every distinction is made by a symbol or a word as well as a colour.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DATA = resolve(root, 'scripts/figures/data/biotsr-1.0.0-capabilities.json')
const OUT = resolve(root, 'public/images/figures')
const VERSION = '1.0.0'

/* The site's tokens (src/styles/tokens.css). An <img> cannot read CSS
   variables, so the values are repeated here, once. */
const C = {
  primary: '#0056b3',
  primaryDark: '#003d80',
  primaryLight: '#e8f1fb',
  text: '#1f2933',
  muted: '#52606d',
  border: '#d5dce4',
  borderStrong: '#9aa5b1',
  surface: '#f7f9fc',
  raised: '#eef2f7',
  white: '#ffffff',
}
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

/* ------------------------------------------------------------------ *
 * Data: the released capability matrix, as JSON
 * ------------------------------------------------------------------ */

/* Display names and family order: the four groups BioTSR's README uses. */
const FAMILIES = [
  { id: 'calpha', label: 'Protein Cα', methods: ['protein', 'aa_selection'] },
  {
    id: 'atomic-protein',
    label: 'Atomic — protein',
    methods: ['amino_acid_atomic', 'amino_acid_atom_selection', 'aa_ind', 'aa_ind_mix', 'aa_ind_specific'],
  },
  {
    id: 'atomic-other',
    label: 'Atomic — ligand, carbohydrate, nucleotide',
    methods: [
      'drug', 'drug_atom_selection', 'carbohydrate', 'carbohydrate_chain',
      'carbohydrate_atom_selection', 'nucleotide', 'nucleotide_chain', 'nucleotide_atom_selection',
    ],
  },
  {
    id: 'cross',
    label: 'Cross TSR',
    note: 'every triangle has vertices on both named sides',
    methods: [
      'drug_protein_cross', 'carbohydrate_protein_cross', 'nucleotide_protein_cross',
      'protein_protein_cross', 'protein_protein_calpha_cross',
    ],
  },
]

const DISPLAY = {
  protein: 'Protein Cα',
  aa_selection: 'Selected residues',
  amino_acid_atomic: 'Amino-acid atomic',
  amino_acid_atom_selection: 'Amino-acid atom selection',
  aa_ind: 'Amino-acid type',
  aa_ind_mix: 'Amino-acid types, mixed',
  aa_ind_specific: 'Specific amino acids',
  drug: 'Drug (ligand)',
  drug_atom_selection: 'Drug atom selection',
  carbohydrate: 'Carbohydrate',
  carbohydrate_chain: 'Carbohydrate chain',
  carbohydrate_atom_selection: 'Carbohydrate atom selection',
  nucleotide: 'Nucleotide',
  nucleotide_chain: 'Nucleotide chain',
  nucleotide_atom_selection: 'Nucleotide atom selection',
  drug_protein_cross: 'Drug–protein',
  carbohydrate_protein_cross: 'Carbohydrate–protein',
  nucleotide_protein_cross: 'Nucleotide–protein',
  protein_protein_cross: 'Protein–protein',
  protein_protein_calpha_cross: 'Protein–protein, Cα',
}

/** Parse the two tables of the released CAPABILITY_MATRIX.md. */
function parseMatrix(markdown) {
  const rows = (header) => {
    const start = markdown.indexOf(header)
    if (start === -1) throw new Error(`table not found: ${header}`)
    const lines = markdown.slice(start).split('\n').slice(2)
    const end = lines.findIndex((line) => !line.startsWith('|'))
    return lines
      .slice(0, end === -1 ? undefined : end)
      .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim().replace(/`/g, '')))
  }
  const totalLine = /\*\*(\d+) methods\*\*/.exec(markdown)
  const capability = rows('| method | family | vertices | cross |')
  const scopes = Object.fromEntries(
    rows('| method | standard profile | label scheme |').map((r) => [r[0], { radix: Number(r[3]), scope: r[4] }]),
  )
  const yes = (cell) => cell === 'yes'
  const methods = capability.map((r) => ({
    id: r[0],
    family: r[1],
    vertices: r[2] === 'Cα' ? 'calpha' : 'atom',
    cross: yes(r[3]),
    aaGrouping: yes(r[4]),
    mirror: yes(r[5]),
    sizeFilter: yes(r[6]),
    sse: yes(r[7]),
    labelRadix: scopes[r[0]].radix,
    scope: scopes[r[0]].scope,
  }))
  if (Number(totalLine?.[1]) !== methods.length) {
    throw new Error(`matrix says ${totalLine?.[1]} methods, table has ${methods.length}`)
  }
  return {
    source: `BioTSR v${VERSION}, docs/CAPABILITY_MATRIX.md`,
    methods,
  }
}

function loadData() {
  const fromIndex = process.argv.indexOf('--from')
  if (fromIndex !== -1) {
    const data = parseMatrix(readFileSync(process.argv[fromIndex + 1], 'utf8'))
    mkdirSync(dirname(DATA), { recursive: true })
    writeFileSync(DATA, `${JSON.stringify(data, null, 2)}\n`)
    console.log(`wrote ${DATA.replace(`${root}/`, '')}`)
    return data
  }
  return JSON.parse(readFileSync(DATA, 'utf8'))
}

/* ------------------------------------------------------------------ *
 * SVG helpers
 * ------------------------------------------------------------------ */

const esc = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function text(x, y, content, { size = 13, weight = 400, fill = C.text, anchor = 'start', family = FONT, style = '' } = {}) {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${style ? ` font-style="${style}"` : ''}>${esc(content)}</text>`
}

/* Wrap to an approximate width: system sans averages ~0.53em per character. */
function wrap(content, width, size) {
  const max = Math.max(8, Math.floor(width / (size * 0.53)))
  const lines = []
  let line = ''
  for (const word of content.split(' ')) {
    if (line && `${line} ${word}`.length > max) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

function paragraph(x, y, content, width, { size = 12.5, lineHeight = 1.4, ...options } = {}) {
  const lines = wrap(content, width, size)
  const svg = lines.map((line, i) => text(x, y + i * size * lineHeight, line, { size, ...options })).join('')
  return { svg, height: lines.length * size * lineHeight }
}

const rect = (x, y, w, h, { fill = C.white, stroke = C.border, rx = 8, dash = '' } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.25"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`

const svgDoc = (width, height, title, desc, body) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="title desc">
<title id="title">${esc(title)}</title>
<desc id="desc">${esc(desc)}</desc>
<rect width="${width}" height="${height}" fill="${C.white}"/>
${body}
</svg>
`

/* ------------------------------------------------------------------ *
 * Figure: methods and capabilities
 * ------------------------------------------------------------------ */

function capabilityFigure(data) {
  const byId = Object.fromEntries(data.methods.map((m) => [m.id, m]))
  const W = 960
  const left = 32
  const cols = [
    { key: 'vertices', label: ['Vertices'], x: 430 },
    { key: 'scope', label: ['Scope'], x: 530 },
    { key: 'aaGrouping', label: ['AA', 'grouping'], x: 640 },
    { key: 'sse', label: ['SSE', 'annotation'], x: 725 },
    { key: 'mirror', label: ['Mirror', 'images'], x: 810 },
    { key: 'sizeFilter', label: ['Size', 'filter'], x: 895 },
  ]
  const ROW = 34
  let y = 44
  let body = ''

  body += text(left, y, `BioTSR ${VERSION}: methods and capabilities`, { size: 22, weight: 700, fill: C.primary })
  y += 24
  body += text(left, y, `${data.methods.length} methods in four families, read from the capability matrix released with BioTSR ${VERSION}. Every method runs under one standard profile.`, { size: 13, fill: C.muted })
  y += 34

  // Column headers.
  body += text(left, y + 14, 'Method', { size: 12, weight: 700, fill: C.muted })
  body += text(left, y + 30, 'command-line name', { size: 11, fill: C.muted, family: MONO })
  for (const col of cols) {
    col.label.forEach((line, i) =>
      (body += text(col.x, y + 14 + i * 15, line, { size: 12, weight: 700, fill: C.muted, anchor: 'middle' })),
    )
  }
  y += 42
  body += `<line x1="${left}" y1="${y}" x2="${W - left}" y2="${y}" stroke="${C.borderStrong}" stroke-width="1.5"/>`

  const cell = (method, key, cx, cy) => {
    if (key === 'vertices') {
      return text(cx, cy + 4, method.vertices === 'calpha' ? 'Cα' : 'atoms', { size: 12.5, weight: 600, anchor: 'middle' })
    }
    if (key === 'scope') {
      const label = { pooled: 'pooled', per_entity: 'per residue', cross_two_sided: 'two sides' }[method.scope]
      return text(cx, cy + 4, label, { size: 12.5, anchor: 'middle', fill: method.scope === 'cross_two_sided' ? C.primaryDark : C.text, weight: method.scope === 'cross_two_sided' ? 600 : 400 })
    }
    return method[key]
      ? `<circle cx="${cx}" cy="${cy}" r="7" fill="${C.primary}"/><path d="M${cx - 3.5},${cy} l2.5,2.6 l4.5,-5" fill="none" stroke="${C.white}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<line x1="${cx - 6}" y1="${cy}" x2="${cx + 6}" y2="${cy}" stroke="${C.borderStrong}" stroke-width="2" stroke-linecap="round"/>`
  }

  for (const family of FAMILIES) {
    y += 30
    const count = `${family.methods.length} method${family.methods.length > 1 ? 's' : ''}${family.note ? ` · ${family.note}` : ''}`
    // One <text> with a <tspan>, so the count follows the label wherever the
    // label's real width ends, in any font.
    body += `<text x="${left}" y="${y}" font-family="${FONT}" font-size="14" font-weight="700" fill="${C.primary}">${esc(family.label)}<tspan font-size="12.5" font-weight="400" fill="${C.muted}"> · ${esc(count)}</tspan></text>`
    y += 8
    family.methods.forEach((id, index) => {
      const method = byId[id]
      if (!method) throw new Error(`no matrix row for ${id}`)
      const top = y
      if (index % 2 === 0) body += `<rect x="${left}" y="${top}" width="${W - 2 * left}" height="${ROW}" fill="${C.surface}"/>`
      body += text(left + 10, top + 15, DISPLAY[id], { size: 13, weight: 600 })
      body += text(left + 10, top + 29, id, { size: 11, fill: C.muted, family: MONO })
      for (const col of cols) body += cell(method, col.key, col.x, top + ROW / 2)
      y += ROW
    })
  }

  y += 14
  body += `<line x1="${left}" y1="${y}" x2="${W - left}" y2="${y}" stroke="${C.borderStrong}" stroke-width="1.5"/>`
  y += 26
  // Legend.
  body += `<circle cx="${left + 7}" cy="${y - 4}" r="7" fill="${C.primary}"/><path d="M${left + 3.5},${y - 4} l2.5,2.6 l4.5,-5" fill="none" stroke="${C.white}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
  body += text(left + 22, y, 'supported', { size: 12.5 })
  body += `<line x1="${left + 112}" y1="${y - 4}" x2="${left + 124}" y2="${y - 4}" stroke="${C.borderStrong}" stroke-width="2" stroke-linecap="round"/>`
  body += text(left + 132, y, 'not offered by this method (refused with an error)', { size: 12.5 })
  y += 24
  const notes = [
    'Vertices: Cα points are labelled by residue — the 20 standard amino acids and 11 modified residues — at radix 30; heavy atoms by element, at radix 112.',
    'Scope: pooled is one calculation over the whole selection; per residue is one calculation for each selected residue; two sides is a cross calculation.',
    'SSE annotation labels each Cα triangle with one of 18 secondary-structure categories and changes no key. AA grouping is defined over amino-acid labels.',
    'Size filtering keeps triangles whose longest edge is below a cutoff. Cross methods also take a contact cutoff that decides which points take part.',
  ]
  for (const note of notes) {
    const p = paragraph(left, y, note, W - 2 * left, { size: 12, fill: C.muted })
    body += p.svg
    y += p.height + 4
  }
  y += 12

  const title = `BioTSR ${VERSION}: methods and capabilities`
  const desc =
    'Table of the 20 BioTSR methods in four families, with their vertex type, scope and supported options: ' +
    'AA grouping and SSE annotation for the two protein Cα methods; mirror images for all Cα and atomic ' +
    'single-structure methods; size filtering for every method.'
  return svgDoc(W, Math.ceil(y), title, desc, body)
}

/* ------------------------------------------------------------------ *
 * Figure: how BioTSR is organised
 * ------------------------------------------------------------------ */

function architectureFigure() {
  const W = 1000
  let body = ''
  body += text(32, 44, `How BioTSR ${VERSION} is organised`, { size: 22, weight: 700, fill: C.primary })
  body += text(32, 68, 'One package, one command line and one shared core for every TSR method family.', { size: 13, fill: C.muted })

  /* A titled box with a list of [heading, text] items. Returns its height. */
  function box(x, y, w, title, items, { fill = C.white, stroke = C.border, titleFill = C.primary, dash = '' } = {}) {
    let inner = text(x + 16, y + 26, title, { size: 14, weight: 700, fill: titleFill })
    let cy = y + 48
    for (const [heading, content, mono] of items) {
      if (heading) {
        inner += text(x + 16, cy, heading, { size: 12.5, weight: 700, family: mono ? MONO : FONT })
        cy += 17
      }
      if (content) {
        const p = paragraph(x + 16, cy, content, w - 32, { size: 12, fill: C.muted })
        inner += p.svg
        cy += p.height
      }
      cy += 8
    }
    const h = cy - y + 4
    return { svg: rect(x, y, w, h, { fill, stroke, dash }) + inner, h }
  }

  const arrow = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.borderStrong}" stroke-width="2" marker-end="url(#arrow)"/>`

  body += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${C.borderStrong}"/></marker></defs>`

  // Column 1: inputs and interfaces.
  const inputs = box(32, 96, 270, '1 · Inputs', [
    ['Structures', 'PDB-format files, your own or downloaded from the RCSB with biotsr fetch: each file checked, cached and reported. Model 1 only; mmCIF is not read.'],
    ['Requests', 'One biotsr run, or a CSV manifest run by biotsr batch, one row per calculation. Every request names its chain.'],
  ])
  body += inputs.svg
  const interfacesY = 96 + inputs.h + 20
  const interfaces = box(32, interfacesY, 270, '2 · Two interfaces, one core', [
    ['Command line', 'run · batch · fetch · describe · analyze common-keys. Batches run rows in parallel with --jobs, using joblib from the standard installation.'],
    ['Python API', 'biotsr.analyze, analyze_cross, batch.run, load_result and biotsr.analysis.'],
  ])
  body += interfaces.svg

  // Column 2: the core.
  const coreX = 330
  const coreW = 330
  const steps = [
    ['Read the structure', 'strict PDB reading; problems in the selection are refused, not guessed'],
    ['Select points', 'Cα atoms, heavy atoms, or the points of two named sides'],
    ['Form candidate triangles', 'every triple of the points; cross methods only triples that span both sides'],
    ['Order the vertices', 'by label, with edge lengths breaking ties'],
    ['Measure', 'θ from the median of the base edge, folded to 0–90°; the longest edge'],
    ['Bin', '29 angle classes; 35 Cα or 18 atomic distance classes'],
    ['Encode', 'one integer key from the three labels and two classes'],
  ]
  let sy = 96
  let core = text(coreX + 16, sy + 26, '3 · Shared TSR core', { size: 14, weight: 700, fill: C.primary })
  const profileNote = paragraph(coreX + 16, sy + 44, 'One standard profile per method; there are no compatibility profiles.', coreW - 32, { size: 12, fill: C.muted })
  core += profileNote.svg
  sy += 50 + profileNote.height
  steps.forEach(([heading, content], index) => {
    const p = paragraph(coreX + 28, sy + 36, content, coreW - 56, { size: 11.5, fill: C.muted })
    const h = 26 + p.height + 8
    core += rect(coreX + 14, sy, coreW - 28, h, { fill: C.white, stroke: C.border, rx: 6 })
    core += text(coreX + 28, sy + 20, `${index + 1}. ${heading}`, { size: 12.5, weight: 700 })
    core += p.svg
    sy += h
    if (index < steps.length - 1) {
      core += arrow(coreX + coreW / 2, sy, coreX + coreW / 2, sy + 12)
      sy += 14
    }
  })
  sy += 16
  body += rect(coreX, 96, coreW, sy - 96, { fill: C.primaryLight, stroke: C.primary }) + core

  // Column 3: modifiers, results, analysis.
  const rightX = 688
  const rightW = 280
  const modifiers = box(rightX, 96, rightW, 'Modifiers: options, not programs', [
    ['AA grouping', 'Cα methods'],
    ['SSE annotation', 'Cα methods; labels triangles, changes no key'],
    ['Mirror images', 'Cα and atomic methods, not cross'],
    ['Size filter', 'every method'],
    ['Contact cutoff', 'cross methods'],
  ], { dash: '6 4', fill: C.surface })
  body += modifiers.svg
  const resultsY = 96 + modifiers.h + 20
  const results = box(rightX, resultsY, rightW, '4 · Results', [
    ['Four files, one prefix', '.keys, .triplets (optional), .meta.json, and .run.json, written last so an interrupted run never looks complete.'],
    ['Two fingerprints', 'what the keys mean (KeySpace) and how the triangles were drawn (SamplingProfile). Results whose keys mean different things are never compared.'],
  ])
  body += results.svg
  const analysisY = resultsY + results.h + 20
  const analysis = box(rightX, analysisY, rightW, '5 · Analysis', [
    ['Command line', 'common keys'],
    ['Python', 'feature matrices, common keys, five similarity measures, average-linkage clustering; the clustered heat map with the plot extra'],
  ])
  body += analysis.svg

  // Arrows between columns.
  body += arrow(302, 150, coreX - 4, 150)
  body += arrow(302, interfacesY + 40, coreX - 4, interfacesY + 40)
  // Modifiers act inside the core; results leave it. Both drawn level, so no
  // arrow crosses any text.
  body += arrow(rightX, 96 + modifiers.h / 2, coreX + coreW + 4, 96 + modifiers.h / 2)
  body += arrow(coreX + coreW, resultsY + 40, rightX - 4, resultsY + 40)
  body += arrow(rightX + rightW / 2, resultsY + results.h, rightX + rightW / 2, analysisY - 4)

  const bottom = Math.max(sy, analysisY + analysis.h, interfacesY + interfaces.h) + 28
  body += text(32, bottom, `Linux and macOS · CPython 3.9–3.13 · Windows is not supported. BioTSR does not reproduce the outputs of the earlier TSR programs key for key.`, { size: 12, fill: C.muted })

  const title = `How BioTSR ${VERSION} is organised`
  const desc =
    'Inputs (PDB-format structures and run or batch requests) reach one shared TSR core through the command line ' +
    'or the Python API. The core reads, selects points, forms triangles, orders vertices, measures, bins and ' +
    'encodes keys under one standard profile per method, with modifiers as options. Results are four files with ' +
    'two fingerprints; analysis offers common keys on the command line and similarity and clustering in Python.'
  return svgDoc(W, bottom + 24, title, desc, body)
}

const data = loadData()
mkdirSync(OUT, { recursive: true })
const outputs = {
  [`biotsr-${VERSION}-capability-matrix.svg`]: capabilityFigure(data),
  [`biotsr-${VERSION}-architecture.svg`]: architectureFigure(),
}
for (const [name, svg] of Object.entries(outputs)) {
  writeFileSync(resolve(OUT, name), svg)
  console.log(`wrote public/images/figures/${name}`)
}
