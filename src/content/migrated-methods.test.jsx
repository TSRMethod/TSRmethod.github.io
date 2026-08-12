import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '../app/App'
import { methods, publishedMethods, getPublishedMethod } from './index'
import { getVisibleNavigation } from '../app/navigation'
import { isRouteImplemented } from '../app/routeRegistry'
import { LEGACY_PATHS } from '../app/legacyPaths'
import { extractHeadings } from '../lib/toc'
import { setViewport } from '../test/viewport'

/*
 * The first group of TSR-derived methods migrated out of the legacy site.
 *
 * Three are published; SSE-TSR is held as a draft because its citation is
 * unresolved. These tests exist mainly to prove that the draft really is
 * invisible — a page whose science has not been signed off must not be
 * reachable by any route, alias or menu.
 */

const PUBLISHED = ['mirror-image', 'size-filtering', 'amino-acid-grouping']
const DRAFT = ['sse-tsr']

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

  it.each(DRAFT)('%s parses but stays draft', (slug) => {
    const method = methods.find((entry) => entry.slug === slug)

    expect(method).toBeDefined()
    expect(method.status).toBe('draft')
    expect(method.body).toMatch(/secondary structure/i)
  })

  it('gives each published method its expected route', () => {
    expect(getPublishedMethod('mirror-image').path).toBe('/methods/mirror-image')
    expect(getPublishedMethod('size-filtering').path).toBe(
      '/methods/size-filtering',
    )
    expect(getPublishedMethod('amino-acid-grouping').path).toBe(
      '/methods/amino-acid-grouping',
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

  it('lists all three under One Molecule in the navigation', () => {
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

describe('the draft stays invisible', () => {
  beforeEach(() => setViewport('desktop'))

  it('has no public route', () => {
    expect(isRouteImplemented('/methods/sse-tsr')).toBe(false)
  })

  it('404s when its address is typed', () => {
    renderApp('/methods/sse-tsr')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('is absent from the navigation', () => {
    const shown = getVisibleNavigation()
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((group) => group.items))
      .map((link) => link.id)

    expect(shown).not.toContain('sse-tsr')
  })

  it('gets no legacy alias while it is draft', () => {
    // The alias is configured, and must stay inert until publication.
    expect(LEGACY_PATHS['/sse-tsr']).toBe('sse-tsr')
    expect(isRouteImplemented('/sse-tsr')).toBe(false)
  })

  it('404s on its legacy alias too', () => {
    renderApp('/sse-tsr')

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
