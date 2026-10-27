import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { softwareRelease, publications } from './index'

/*
 * What the site may say about BioTSR, checked against the release record.
 *
 * Narrow on purpose. These look for specific claims about BioTSR, not for
 * words: "planned", "DOI" and "Windows" are ordinary words that appear
 * legitimately elsewhere — publication DOIs, research plans, the remaining
 * historical walk-throughs — and banning them site-wide would be both wrong
 * and the first test someone deletes.
 */

const root = process.cwd()
const contentDir = resolve(root, 'src/content')

/** Every content file, as [relative path, text]. */
function contentFiles(dir = contentDir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return contentFiles(path)
    if (!/\.(md|json)$/.test(entry.name)) return []
    return [[path.replace(`${root}/`, ''), readFileSync(path, 'utf8')]]
  })
}

const FILES = [
  ...contentFiles(),
  ['index.html', readFileSync(resolve(root, 'index.html'), 'utf8')],
]

/* The files that are about BioTSR itself. */
const BIOTSR_FILES = FILES.filter(([path, text]) =>
  /software\/|repositories\/biotsr\.json/.test(path) || /\bbiotsr\b/i.test(text),
)

const { version, tag } = softwareRelease

function matches(pattern) {
  return FILES.flatMap(([path, text]) =>
    [...text.matchAll(pattern)].map((match) => ({ path, match })),
  )
}

describe('no stale claims about the software', () => {
  it('no longer says a consolidated package is planned', () => {
    const stale = /consolidated package|single,? consolidated|package is planned|planned package|until it exists/i
    for (const [path, text] of FILES) {
      expect(text, path).not.toMatch(stale)
    }
  })
})

describe('version-specific commands and links agree with the release', () => {
  it('pins every BioTSR install to the released version', () => {
    const installs = matches(/pip install\s+"?biotsr(\[[a-z,]+\])?([^"\s]*)"?/g)
    expect(installs.length).toBeGreaterThan(3)

    for (const { path, match } of installs) {
      expect(match[2], `${path}: ${match[0]}`).toBe(`==${version}`)
    }
  })

  it('pins every install from GitHub to the release tag', () => {
    for (const { path, match } of matches(/git\+https:\/\/github\.com\/TSRMethod\/BioTSR@(\S+?)"/g)) {
      expect(match[1], path).toBe(tag)
    }
    for (const { path, match } of matches(/git clone --branch (\S+) https:\/\/github\.com\/TSRMethod\/BioTSR/g)) {
      expect(match[1], path).toBe(tag)
    }
  })

  it('links BioTSR documentation at the release tag, never at main', () => {
    const links = matches(/https:\/\/github\.com\/TSRMethod\/BioTSR\/(blob|tree)\/([^/\s)]+)/g)
    expect(links.length).toBeGreaterThan(10)

    for (const { path, match } of links) {
      expect(match[2], `${path}: ${match[0]}`).toBe(tag)
    }
  })

  it('links the release and PyPI pages of the released version only', () => {
    for (const { path, match } of matches(/BioTSR\/releases\/tag\/([^\s)"]+)/g)) {
      expect(match[1], path).toBe(tag)
    }
    for (const { path, match } of matches(/pypi\.org\/project\/biotsr\/([^/\s)"]*)/g)) {
      expect(match[1], path).toBe(version)
    }
  })

  it('names the released version wherever it names one', () => {
    for (const [path, text] of BIOTSR_FILES) {
      for (const match of text.matchAll(/BioTSR (\d+\.\d+\.\d+)/g)) {
        expect(match[1], path).toBe(version)
      }
    }
  })
})

describe('no BioTSR DOI is presented', () => {
  it('shows no DOI, Zenodo record or placeholder for the software', () => {
    /*
     * Only the text about the software: the software pages, the BioTSR
     * record, and the software blocks of the home and page copy. The
     * publications intro rightly says each paper is linked by its DOI.
     */
    const pick = (file, key) =>
      JSON.stringify(JSON.parse(readFileSync(resolve(contentDir, file), 'utf8'))[key])
    const softwareText = [
      ...FILES.filter(([path]) => /software\/|repositories\/biotsr\.json/.test(path)),
      ['pages.json → software', pick('pages.json', 'software')],
      ['home.json → software', pick('home.json', 'software')],
    ]
    for (const [path, text] of softwareText) {
      expect(text, path).not.toMatch(/\bdoi\b|zenodo|10\.5281/i)
    }
  })

  it("leaves the publications' DOIs alone", () => {
    expect(publications.filter((p) => p.doi).length).toBeGreaterThan(5)
  })
})

describe('no unsupported claim about what BioTSR runs or where', () => {
  /* The commands the released command line has. */
  const COMMANDS = ['run', 'batch', 'fetch', 'describe', 'analyze', 'methods', '--version']

  it('uses only commands the released command line has', () => {
    for (const { path, match } of matches(/`?\bbiotsr ([a-z-]+)/g)) {
      if (!/software\/|methods\/|analysis\/|home\.json|pages\.json/.test(path)) continue
      expect(COMMANDS, `${path}: ${match[0]}`).toContain(match[1])
    }
    // The one analysis on the command line is common keys.
    for (const { path, match } of matches(/biotsr analyze ([a-z-]+)/g)) {
      expect(match[1], path).toBe('common-keys')
    }
  })

  /* `biotsr methods` at 1.0.0: the twenty method names. */
  const METHODS = [
    'aa_ind', 'aa_ind_mix', 'aa_ind_specific', 'aa_selection', 'amino_acid_atom_selection',
    'amino_acid_atomic', 'carbohydrate', 'carbohydrate_atom_selection', 'carbohydrate_chain',
    'carbohydrate_protein_cross', 'drug', 'drug_atom_selection', 'drug_protein_cross',
    'nucleotide', 'nucleotide_atom_selection', 'nucleotide_chain', 'nucleotide_protein_cross',
    'protein', 'protein_protein_calpha_cross', 'protein_protein_cross',
  ]

  /*
   * The options of `biotsr run`, `batch`, `fetch` and `analyze common-keys` at
   * 1.0.0, read from their --help. A flag outside this list in a page's
   * command is either a typo or an option the release does not have.
   */
  const FLAGS = new Set(
    ('aa-grouping allow-mixed-processing allow-partial atom-selection atoms chain chain-2 ' +
      'contact-cutoff contact-filter download-missing dry-run entity-id entity-name ' +
      'entity-names from-results group-by if-exists jobs manifest method mirror no-triplets ' +
      'output pdb pdb-dir residue residue-name residue-types residues sample-id size-filter sse')
      .split(' ')
      .map((flag) => `--${flag}`),
  )

  /* Every `biotsr …` command in a fenced block of the method and software pages. */
  const commands = FILES.filter(([path]) => /software\/|methods\/|analysis\//.test(path))
    .flatMap(([path, text]) =>
      [...text.matchAll(/```bash\n([\s\S]*?)```/g)].flatMap((block) =>
        block[1]
          .split('\n')
          .filter((line) => /^biotsr (run|batch|fetch|analyze)/.test(line))
          .map((line) => ({ path, line })),
      ),
    )

  it('names only methods the release has', () => {
    expect(commands.length).toBeGreaterThan(10)
    for (const { path, line } of commands) {
      const method = line.match(/--method (\S+)/)?.[1]
      if (method) expect(METHODS, `${path}: ${line}`).toContain(method)
    }
  })

  it('uses only options the release has', () => {
    for (const { path, line } of commands) {
      for (const [flag] of line.matchAll(/--[a-z][a-z0-9-]*/g)) {
        expect(FLAGS.has(flag), `${path}: ${flag} in ${line}`).toBe(true)
      }
    }
  })

  it('offers each modifier only on the methods that take it', () => {
    /* From the capability matrix: grouping and SSE on the two Cα methods,
       mirror on every method that is not a cross, size filtering on all. */
    const CALPHA = ['protein', 'aa_selection']
    for (const { path, line } of commands) {
      const method = line.match(/--method (\S+)/)?.[1]
      if (!method) continue
      if (/--aa-grouping|--sse/.test(line)) expect(CALPHA, `${path}: ${line}`).toContain(method)
      if (/--mirror/.test(line)) expect(method, `${path}: ${line}`).not.toMatch(/_cross$/)
      if (/--contact-cutoff/.test(line)) expect(method, `${path}: ${line}`).toMatch(/_cross$/)
    }
  })

  it('mentions Windows, in the BioTSR pages, only to say it is not supported', () => {
    for (const [path, text] of FILES.filter(([p]) => /software\/|biotsr\.json/.test(p))) {
      for (const match of text.replace(/\s+/g, ' ').matchAll(/[^.]*Windows[^.]*\./g)) {
        expect(match[0], path).toMatch(/Windows is not supported/)
      }
    }
  })

  it('never offers similarity or clustering on the command line', () => {
    for (const [path, text] of BIOTSR_FILES) {
      expect(text, path).not.toMatch(/biotsr (similarity|cluster|clustermap|heatmap)\b/i)
    }
  })
})
