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
 * The first group of TSR-derived methods migrated out of the legacy site.
 *
 * All four are published. SSE-TSR was initially held as a draft because the
 * legacy page cited the amino acid grouping paper; its own publication has
 * since been confirmed (IEEE TCBBIO, 2026) and it went live by adding the
 * citation and flipping `status` — no routing or navigation change.
 *
 * The draft safety model is still exercised below, against a synthetic draft
 * rather than a real page, so it stays covered no matter what is published.
 */

const PUBLISHED = [
  'mirror-image',
  'size-filtering',
  'amino-acid-grouping',
  'sse-tsr',
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
    expect(method.group).toBe('one-molecule')
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

  it('lists all four under One Molecule in the navigation', () => {
    const visible = getVisibleNavigation()
    const menu = visible.find((item) => item.id === 'methods')

    expect(menu, 'the TSR-Based Methods menu should now exist').toBeDefined()

    const group = menu.groups.find((g) => g.id === 'one-molecule')
    expect(group.items.map((item) => item.id).sort()).toEqual(
      [...PUBLISHED].sort(),
    )
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

  it('cites a different paper on each published method', () => {
    /*
     * The legacy site reused the amino-acid-grouping DOI on SSE-TSR. Any
     * repeat of a DOI across two published methods is worth a second look.
     */
    const dois = publishedMethods
      .map((method) => method.paper?.doi)
      .filter(Boolean)

    expect(new Set(dois).size).toBe(dois.length)
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
