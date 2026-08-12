import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '../app/App'
import {
  methods,
  publishedMethods,
  getPublishedMethod,
  buildMethod,
  formatCitation,
} from './index'
import { getVisibleNavigation } from '../app/navigation'
import { isRouteImplemented } from '../app/routeRegistry'
import { LEGACY_PATHS } from '../app/legacyPaths'
import { extractHeadings } from '../lib/toc'
import { setViewport } from '../test/viewport'

/*
 * The TSR-derived methods migrated out of the legacy site.
 *
 * Stage 7A brought the four single-molecule methods; Stage 7B added DrugTSR
 * and the amino-acid and nucleotide methods, which live in their own separate
 * packages rather than in TSR-Package.
 *
 * SSE-TSR was initially held as a draft because the legacy page cited the
 * amino acid grouping paper. Its own publication was later confirmed and it
 * went live by adding the citation and flipping `status` — no routing or
 * navigation change was needed.
 *
 * The draft safety model is exercised below against a synthetic draft rather
 * than a real page, so it stays covered no matter what is published.
 */

const PUBLISHED = [
  // Stage 7A
  'mirror-image',
  'size-filtering',
  'amino-acid-grouping',
  'sse-tsr',
  // Stage 7B
  'drug-tsr',
  'amino-acid',
  'nucleotide',
  'nucleotide-protein',
]

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('the migrated methods parse', () => {
  it.each(PUBLISHED)('%s is published and complete', (slug) => {
    const method = getPublishedMethod(slug)

    expect(method).toBeDefined()
    expect(method.status).toBe('published')
    expect(method.category).toBe('method')
    expect(method.group).toBeTruthy()
    expect(method.summary.length).toBeGreaterThan(30)
    expect(method.body.length).toBeGreaterThan(500)
  })

  it('gives each published method its expected route', () => {
    expect(getPublishedMethod('mirror-image').path).toBe('/methods/mirror-image')
    expect(getPublishedMethod('size-filtering').path).toBe(
      '/methods/size-filtering',
    )
    expect(getPublishedMethod('amino-acid-grouping').path).toBe(
      '/methods/amino-acid-grouping',
    )
    expect(getPublishedMethod('sse-tsr').path).toBe('/methods/sse-tsr')
    expect(getPublishedMethod('drug-tsr').path).toBe('/methods/drug-tsr')
    expect(getPublishedMethod('amino-acid').path).toBe('/methods/amino-acid')
    expect(getPublishedMethod('nucleotide').path).toBe('/methods/nucleotide')
    expect(getPublishedMethod('nucleotide-protein').path).toBe(
      '/methods/nucleotide-protein',
    )
  })

  it('uses each method’s own authoritative package', () => {
    /*
     * The nucleotide and amino-acid methods are separate repositories, not
     * part of TSR-Package. Collapsing them into the central package would
     * make every install and import instruction on those pages wrong.
     */
    const repo = (slug) => getPublishedMethod(slug).repositories[0].url

    expect(repo('drug-tsr')).toBe('https://github.com/pooryakhajouie/TSR-Package')
    expect(repo('amino-acid')).toBe(
      'https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE',
    )
    expect(repo('nucleotide')).toBe(
      'https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE',
    )
    expect(repo('nucleotide-protein')).toBe(
      'https://github.com/KrishnaRauniyar/Nucleotide-Protein',
    )
  })

  it('imports each package by its own name, not always tsr_package', () => {
    const body = (slug) => getPublishedMethod(slug).body

    expect(body('drug-tsr')).toContain('from tsr_package import DrugTSR')
    expect(body('amino-acid')).toContain(
      'from aminoacid_tsr_package.AminoAcid import AminoAcidProteinTSR',
    )
    expect(body('nucleotide')).toContain(
      'from nucleotide_tsr_package.Nucleotide import NucleotideTSR',
    )
    // Nucleotide–Protein is a pair of CLI scripts, so it has no import at all.
    expect(body('nucleotide-protein')).toContain('python drug_protein_3A.py')
    expect(body('nucleotide-protein')).not.toContain('import tsr_package')
  })

  it('does not repeat the aa_grouping mistake on DrugTSR', () => {
    /*
     * The legacy DrugTSR page carried a sentence about `aa_grouping` copied
     * from the amino acid grouping page. DrugTSR() has no such parameter.
     */
    expect(getPublishedMethod('drug-tsr').body).not.toMatch(/aa_grouping/)
  })

  it('keeps the Slurm scripts of the three HPC workflows intact', () => {
    for (const slug of ['amino-acid', 'nucleotide', 'nucleotide-protein']) {
      const slurm = getPublishedMethod(slug).slurm
      expect(slurm, `${slug} should have a slurm block`).toBeTruthy()
      expect(slurm.script.code).toContain('#SBATCH -t 72:00:00')
      expect(slurm.script.code.split('\n').length).toBeGreaterThan(10)
      expect(slurm.submit.code).toMatch(/^sbatch /)
    }

    // The two-step workflow must stay chained, in order.
    const cross = getPublishedMethod('nucleotide-protein').slurm.script.code
    expect(cross.indexOf('drug_protein_3A.py')).toBeLessThan(
      cross.indexOf('cross_key.py'),
    )
  })

  it('cites the confirmed SSE-TSR publication, not the legacy one', () => {
    const paper = getPublishedMethod('sse-tsr').paper

    expect(paper.doi).toBe('10.1109/TCBBIO.2026.3654047')
    expect(paper.url).toBe('https://doi.org/10.1109/TCBBIO.2026.3654047')
    expect(paper.journal).toMatch(/IEEE Transactions on Computational Biology/)
    expect(paper.year).toBe(2026)
    expect(paper.volume).toBe('23')
    expect(paper.issue).toBe('2')
    expect(paper.pages).toBe('694–703')

    // The legacy page reused the amino acid grouping DOI. It must be gone.
    expect(paper.doi).not.toBe('10.1016/j.compbiolchem.2021.107479')
  })

  it('formats the citation with volume, issue and pages', () => {
    expect(formatCitation(getPublishedMethod('sse-tsr').paper)).toBe(
      'IEEE Transactions on Computational Biology and Bioinformatics, 2026, 23(2), 694–703',
    )
    // Papers without those details still format cleanly.
    expect(formatCitation(getPublishedMethod('mirror-image').paper)).toBe(
      'Computational Biology and Chemistry, 2023',
    )
  })
})

describe('published methods are reachable', () => {
  beforeEach(() => setViewport('desktop'))

  it.each(PUBLISHED)('%s has a public route', (slug) => {
    expect(isRouteImplemented(`/methods/${slug}`)).toBe(true)
  })

  it.each(PUBLISHED)('%s renders its own page', (slug) => {
    const method = getPublishedMethod(slug)
    renderApp(method.path)

    expect(
      screen.getByRole('heading', { level: 1, name: method.title }),
    ).toBeInTheDocument()
  })

  it('places every published method in the group its content declares', () => {
    /*
     * Derived from the registry rather than a hard-coded list, so migrating a
     * further method does not silently make this assertion vacuous.
     */
    const menu = getVisibleNavigation().find((item) => item.id === 'methods')
    expect(menu, 'the TSR-Based Methods menu should exist').toBeDefined()

    for (const group of menu.groups) {
      const expected = publishedMethods
        .filter((m) => m.category === 'method' && m.group === group.id)
        .map((m) => m.slug)
        .sort()

      expect(group.items.map((item) => item.id).sort()).toEqual(expected)
    }

    // Every published `method` is in exactly one group, none dropped.
    const shown = menu.groups.flatMap((g) => g.items.map((i) => i.id)).sort()
    const all = publishedMethods
      .filter((m) => m.category === 'method')
      .map((m) => m.slug)
      .sort()
    expect(shown).toEqual(all)
  })

  it('keeps Amino Acid TSR and Amino Acid Grouping TSR distinct', () => {
    /*
     * Two different methods, two different packages, adjacent in the same
     * menu group. A slug or path collision would silently merge them.
     */
    const a = getPublishedMethod('amino-acid')
    const b = getPublishedMethod('amino-acid-grouping')

    expect(a.path).toBe('/methods/amino-acid')
    expect(b.path).toBe('/methods/amino-acid-grouping')
    expect(a.path).not.toBe(b.path)
    expect(a.repositories[0].url).not.toBe(b.repositories[0].url)
    expect(a.paper.doi).not.toBe(b.paper.doi)
  })

  it('shows the dropdown in the rendered header', async () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(
      within(nav).getByRole('button', { name: /TSR-Based Methods/ }),
    ).toBeInTheDocument()
  })
})

describe('the draft safety model still holds', () => {
  /*
   * Exercised against a synthetic draft rather than a real page. SSE-TSR used
   * to serve this purpose and is now published, so pinning the guarantee to a
   * specific slug would quietly stop testing anything the next time a page
   * goes live.
   */
  const draft = buildMethod(
    './methods/future-method.md',
    '---\ntitle: Future Method\nsummary: Not reviewed yet.\n---\n\n## Overview\n\nBody.\n',
  )

  it('treats a method with no status as a draft with no route', () => {
    expect(draft.status).toBe('draft')
    expect(draft.path).toBeNull()
    expect(isRouteImplemented('/methods/future-method')).toBe(false)
  })

  it('keeps a draft out of the navigation even when a route would exist', () => {
    const shown = getVisibleNavigation({
      methods: [draft],
      isAvailable: () => true,
    })
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((group) => group.items))
      .map((link) => link.id)

    expect(shown).not.toContain('future-method')
  })

  it('gives a draft no legacy alias', () => {
    /*
     * The alias table is keyed on slug and an alias is only emitted for a
     * published method, so a configured alias to a draft stays inert. SSE-TSR
     * demonstrated exactly this before it was published.
     */
    const aliasTargets = Object.values(LEGACY_PATHS)
    for (const slug of aliasTargets) {
      const method = methods.find((entry) => entry.slug === slug)
      if (method && method.status !== 'published') {
        expect(isRouteImplemented(method.path ?? `/methods/${slug}`)).toBe(false)
      }
    }
  })

  it('404s for an unknown method address', () => {
    renderApp('/methods/future-method')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })
})

describe('legacy aliases', () => {
  beforeEach(() => setViewport('desktop'))

  it.each([
    ['/mirror-image', 'Mirror-Image TSR'],
    ['/size-filtering', 'Size-Filtering TSR'],
    ['/aa-grouping', 'Amino Acid Grouping TSR'],
    ['/sse-tsr', 'SSE-TSR'],
    ['/drug-tsr', 'DrugTSR'],
    ['/aminoacid', 'Amino Acid TSR'],
    ['/nucleotide', 'Nucleotide TSR'],
    ['/nucleotide-protein', 'Nucleotide–Protein TSR'],
  ])('%s redirects to the migrated page', (legacyPath, title) => {
    renderApp(legacyPath)

    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeInTheDocument()
  })

  it('maps every alias to a slug that exists', () => {
    for (const [from, slug] of Object.entries(LEGACY_PATHS)) {
      expect(
        methods.some((method) => method.slug === slug),
        `${from} points at unknown slug "${slug}"`,
      ).toBe(true)
    }
  })
})

describe('content quality of every published method', () => {
  it('has a figure with meaningful alt text', () => {
    for (const method of publishedMethods.filter((m) => m.figure)) {
      expect(
        method.figure.alt.length,
        `${method.slug} alt text is too short to be useful`,
      ).toBeGreaterThan(40)
      // Guards against the legacy fault where SSE-TSR's figure was labelled
      // "Size Filtering Illustration Illustration".
      expect(method.figure.alt).not.toMatch(/illustration illustration/i)
    }
  })

  it('has table-of-contents ids that match its headings', () => {
    for (const method of methods) {
      const ids = method.headings.map((h) => h.id)
      expect(ids).toEqual(extractHeadings(method.body).map((h) => h.id))
      expect(new Set(ids).size, `${method.slug} has duplicate ids`).toBe(
        ids.length,
      )
    }
  })

  it('has structurally valid repository and publication URLs', () => {
    for (const method of methods) {
      for (const repo of method.repositories) {
        expect(() => new URL(repo.url)).not.toThrow()
        expect(repo.url.startsWith('https://')).toBe(true)
      }
      if (method.paper?.url) {
        expect(() => new URL(method.paper.url)).not.toThrow()
        expect(method.paper.url).toMatch(/^https:\/\/doi\.org\/10\./)
      }
    }
  })

  it('shares a DOI between methods only where that is intended', () => {
    /*
     * The legacy site reused the amino-acid-grouping DOI on SSE-TSR, so a
     * repeated DOI is worth catching. But sharing can be legitimate: one
     * Proteins 2025 paper covers both the nucleotide representation and the
     * DNA–p53 interaction work, and is correctly cited by both pages.
     *
     * Anything shared must therefore be listed here deliberately.
     */
    const INTENTIONALLY_SHARED = {
      '10.1002/prot.70005': ['nucleotide', 'nucleotide-protein'],
    }

    const bySlug = new Map()
    for (const method of publishedMethods) {
      if (!method.paper?.doi) continue
      const slugs = bySlug.get(method.paper.doi) ?? []
      bySlug.set(method.paper.doi, [...slugs, method.slug])
    }

    for (const [doi, slugs] of bySlug) {
      if (slugs.length === 1) continue
      expect(
        INTENTIONALLY_SHARED[doi]?.slice().sort(),
        `${doi} is cited by ${slugs.join(', ')} — intentional?`,
      ).toEqual(slugs.slice().sort())
    }
  })
})

describe('the existing TSR page is unaffected', () => {
  beforeEach(() => setViewport('desktop'))

  it('still renders at /tsr', () => {
    renderApp('/tsr')

    expect(
      screen.getByRole('heading', { level: 1, name: /Triangular Spatial/ }),
    ).toBeInTheDocument()
  })

  it('still appears in the navigation', () => {
    const visible = getVisibleNavigation()
    expect(visible.some((item) => item.id === 'tsr')).toBe(true)
  })
})

describe('no navigation link points at an unimplemented route', () => {
  it('holds across the whole rendered chrome', () => {
    setViewport('desktop')
    renderApp('/')

    const internal = Array.from(document.querySelectorAll('a[href^="/"]')).map(
      (anchor) => anchor.getAttribute('href'),
    )

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), `${href} has no route`).toBe(true)
    }
  })
})
