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
  softwarePages,
} from './index'
import { getVisibleNavigation, getContentGroups } from '../app/navigation'
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

  it('lists BioTSR first, then each method’s own earlier implementation', () => {
    /*
     * The nucleotide and amino-acid methods were first published in separate
     * repositories, not in TSR-Package. Collapsing them into the central
     * package would point their earlier-implementation links at the wrong
     * code.
     */
    const repos = (slug) => getPublishedMethod(slug).repositories.map((r) => r.url)
    const BIOTSR = 'https://github.com/TSRMethod/BioTSR'

    for (const [slug, earlier] of [
      ['drug-tsr', 'https://github.com/pooryakhajouie/TSR-Package'],
      ['amino-acid', 'https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE'],
      ['nucleotide', 'https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE'],
      ['nucleotide-protein', 'https://github.com/KrishnaRauniyar/Nucleotide-Protein'],
      ['amino-acid-grouping', 'https://github.com/pooryakhajouie/TSR-Package'],
      ['mirror-image', 'https://github.com/pooryakhajouie/TSR-Package'],
      ['size-filtering', 'https://github.com/pooryakhajouie/TSR-Package'],
      ['sse-tsr', 'https://github.com/pooryakhajouie/TSR-Package'],
    ]) {
      expect(repos(slug), slug).toEqual([BIOTSR, earlier])
    }
  })

  it('gives each method a BioTSR command and its earlier implementation, once', () => {
    for (const slug of PUBLISHED) {
      const method = getPublishedMethod(slug)
      const headings = method.headings.map((h) => h.text)
      expect(headings, slug).toContain('Run it with BioTSR')
      expect(method.body, slug).toMatch(/```bash\n(python -m pip install "biotsr==1\.0\.0"\n)?biotsr (fetch|run|batch)/)

      /* The earlier implementation is described on its source-code card, and
         not again in a section of its own just above it. */
      expect(headings, slug).not.toContain('Earlier implementation')
      expect(method.body, slug).not.toMatch(/kept unchanged for provenance/)
      const earlier = method.repositories.filter((r) => r.name !== 'BioTSR')
      expect(earlier.length, slug).toBeGreaterThan(0)
      for (const repository of earlier) {
        expect(repository.description, slug).toMatch(/kept unchanged for provenance/)
      }
    }
  })

  it('no longer carries the earlier packages’ installation walk-throughs', () => {
    for (const slug of PUBLISHED) {
      const body = getPublishedMethod(slug).body
      expect(body, slug).not.toMatch(/^## Installation$/m)
      expect(body, slug).not.toMatch(/git clone https:\/\/github\.com\/(pooryakhajouie|KrishnaRauniyar)/)
      expect(body, slug).not.toMatch(/tsrenv\\Scripts\\activate/)
      expect(body, slug).not.toMatch(/from (tsr_package|aminoacid_tsr_package|nucleotide_tsr_package)/)
      expect(getPublishedMethod(slug).slurm, slug).toBeNull()
    }
  })

  it('does not repeat the aa_grouping mistake on DrugTSR', () => {
    /*
     * The legacy DrugTSR page carried a sentence about `aa_grouping` copied
     * from the amino acid grouping page. DrugTSR() has no such parameter.
     */
    expect(getPublishedMethod('drug-tsr').body).not.toMatch(/aa_grouping/)
  })

  it('does not present the DNA–p53 paper as the cross-key method’s publication', () => {
    const page = getPublishedMethod('nucleotide-protein')

    // No "Read the paper" link: the method has not been published.
    expect(page.paper).toBeNull()
    expect(page.body).toMatch(/has not been described in a\s+publication/)
    expect(page.body).toContain('https://github.com/KrishnaRauniyar/Nucleotide-Protein')
    // The DNA–p53 paper stays, as related research. What the paper says, what
    // the authors confirm and what is unpublished are kept apart, and the
    // page does not claim the study had nothing to do with cross-key code.
    expect(page.headings.map(({ id }) => id)).toContain('related-research')
    expect(page.body).toContain('https://doi.org/10.1002/prot.70005')
    const text = page.body.replace(/\s+/g, ' ')
    expect(text).toMatch(/The paper does not describe cross keys\./)
    expect(text).toMatch(/The authors confirm that the study's raw data were generated with Krishna Rauniyar's cross-key code/)
    expect(text).toMatch(/cross-key method has not been published/)
    expect(text).not.toMatch(/did not build cross keys|without cross keys|did not use cross keys/)
  })

  it('keeps DrugTSR’s historical settings apart from BioTSR’s', () => {
    const text = getPublishedMethod('drug-tsr').body.replace(/\s+/g, ' ')
    const history = text.slice(text.indexOf("### Earlier settings and BioTSR's"))
    expect(history).toMatch(/by its Cα atoms and by all of its atoms/)
    expect(history).toMatch(/between 3 and 5 Å, most often 3\.5 Å/)
    // Nothing assigned that the evidence does not give.
    expect(history).toMatch(/does not say which cutoff a particular published figure used/)
    expect(history).toMatch(/only the atoms within the cutoff or every atom of the residues/)
    expect(history).toMatch(/BioTSR 1\.0\.0's settings are its own, not a record of earlier work/)
  })

  it('points HPC users at BioTSR’s Slurm examples instead of the old scripts', () => {
    for (const slug of ['amino-acid', 'nucleotide', 'nucleotide-protein']) {
      expect(getPublishedMethod(slug).body, slug).toContain(
        'https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc',
      )
    }
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

  it.each(PUBLISHED)('%s renders its own page', async (slug) => {
    const method = getPublishedMethod(slug)
    renderApp(method.path)

    /* `find` rather than `get`: MethodPage is code-split, so it arrives on a
       later tick than the route that renders it. */
    expect(
      await screen.findByRole('heading', { level: 1, name: method.title }),
    ).toBeInTheDocument()
  })

  it('places every published method in the group its content declares', () => {
    /*
     * Derived from the registry rather than a hard-coded list, so migrating a
     * further method does not silently make this assertion vacuous.
     */
    const menu = getVisibleNavigation().find((item) => item.id === 'research')
    expect(menu, 'the Methods & research menu should exist').toBeDefined()

    const [methodGroup] = menu.groups
    expect(methodGroup.label).toBe('Scientific methods')

    // Every published `method` is in the group, none dropped, none twice.
    const shown = methodGroup.items.map((i) => i.id).sort()
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
    // Their earlier implementations were different packages.
    expect(a.repositories[1].url).not.toBe(b.repositories[1].url)
    expect(a.paper.doi).not.toBe(b.paper.doi)
  })

  it('shows the dropdown in the rendered header', async () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(
      within(nav).getByRole('button', { name: 'Methods & research' }),
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

  it('404s for an unknown method address', async () => {
    renderApp('/methods/future-method')

    expect(
      await screen.findByRole('heading', { level: 1, name: /page not found/i }),
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
  ])('%s redirects to the migrated page', async (legacyPath, title) => {
    renderApp(legacyPath)

    expect(
      await screen.findByRole('heading', { level: 1, name: title }),
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
     * repeated DOI is worth catching. Sharing can be legitimate, so anything
     * shared must be listed here deliberately. Nothing is at present: the
     * Proteins 2025 DNA–p53 paper is Nucleotide TSR's publication, and only
     * related research for Nucleotide–Protein TSR, whose cross-key method is
     * unpublished.
     */
    const INTENTIONALLY_SHARED = {}

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

  it('still renders at /tsr', async () => {
    renderApp('/tsr')

    expect(
      await screen.findByRole('heading', { level: 1, name: /Triangular Spatial/ }),
    ).toBeInTheDocument()
  })

  it('is the navigation’s first entry after Home, Understand TSR', () => {
    expect(getVisibleNavigation()[1]).toMatchObject({ id: 'science', to: '/tsr' })
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

describe('what a key is, stated accurately', () => {
  /*
   * A key encodes a triangle's labels and its angle and distance classes, so
   * different triangles can share one, and a structure is its distinct keys
   * and their frequencies. "Unique" is right for distinct values: "the set of
   * unique integer keys", or the `n_unique_keys` column. What must not appear
   * is a claim that each triangle receives a key no other triangle has.
   * Text inside quotation marks is a quotation, and is left alone.
   */
  const ONE_KEY_PER_TRIANGLE = [
    /\b(?:each|every) triangle (?:receives|gets|is (?:given|assigned)|has) (?:a|its own) (?:unique|different|distinct) (?:integer |TSR )?key/i,
    /\b(?:unique|different|distinct) (?:integer |TSR )?key (?:for|to) (?:each|every) triangle/i,
    /\bno two triangles (?:share|have|receive) (?:a |the same )?(?:integer |TSR )?key/i,
    /\bkeys? (?:that|which) uniquely identif(?:y|ies) (?:a|each|every|the) triangle/i,
  ]
  const misstatesKeys = (text) => {
    const unquoted = text.replace(/\s+/g, ' ').replace(/“[^”]*”/g, '“”')
    return ONE_KEY_PER_TRIANGLE.some((pattern) => pattern.test(unquoted))
  }

  it('tells a claim of one key per triangle from distinct-value wording', () => {
    for (const text of [
      'Each triangle receives a unique key.',
      'Every triangle is assigned its own distinct\nkey.',
      'a different key for each triangle',
      'No two triangles share a key.',
      'keys that uniquely identify each triangle',
    ]) {
      expect(misstatesKeys(text), text).toBe(true)
    }
    for (const text of [
      'A structure is the set of unique integer keys and their frequencies.',
      'Its 70,300 triangles give 45,349 unique keys.',
      'The keys are unique integers.',
      '`n_unique_keys` is the number of distinct keys.',
      'Different triangles can share a key.',
      'The paper writes that “each triangle receives a unique key” (Kondra et al., 2021).',
    ]) {
      expect(misstatesKeys(text), text).toBe(false)
    }
  })

  it('never says each triangle receives a key of its own', () => {
    const pages = [...publishedMethods, ...Object.values(softwarePages)]
    for (const page of pages) {
      for (const text of [page.summary, page.body]) {
        expect(misstatesKeys(text ?? ''), page.slug).toBe(false)
      }
    }
  })

  it('says on /tsr that triangles can share a key, and how a structure is represented', () => {
    const tsr = getPublishedMethod('tsr')
    expect(tsr.summary).toMatch(/distinct keys and how often each occurs/)
    expect(tsr.body).toMatch(/different triangles can share a key/)
    expect(tsr.body).toMatch(/receive the same key/)
  })
})

describe('method groups', () => {
  it('files Nucleotide–Protein TSR with the two-molecule methods, once', () => {
    const byLabel = Object.fromEntries(
      getContentGroups('method').map((group) => [group.label, group.methods.map((m) => m.slug)]),
    )
    expect(byLabel['Two-molecule methods']).toEqual(['drug-tsr', 'nucleotide-protein'])
    expect(byLabel['Nucleotide methods']).toEqual(['nucleotide'])

    // The menu lists it once, after the single-molecule methods.
    const research = getVisibleNavigation().find((item) => item.id === 'research')
    const methodsMenu = research.groups.find((group) => group.id === 'scientific-methods')
    const paths = methodsMenu.items.map((item) => item.to)
    expect(paths.filter((to) => to === '/methods/nucleotide-protein')).toHaveLength(1)
    expect(paths.slice(-3)).toEqual([
      '/methods/nucleotide',
      '/methods/drug-tsr',
      '/methods/nucleotide-protein',
    ])
  })
})
