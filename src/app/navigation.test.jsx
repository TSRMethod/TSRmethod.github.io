import { describe, it, expect } from 'vitest'
import { getVisibleNavigation, navigationSkeleton } from './navigation'
import { isRouteImplemented } from './routeRegistry'
import { methods, publishedMethods } from '../content'

/*
 * These tests enforce the two independent gates on a navigation link:
 * scientific approval (content `status`) and technical availability (the
 * route exists). Both must pass. Neither may stand in for the other.
 */

const method = (over = {}) => ({
  slug: 'mirror-image',
  title: 'Mirror-Image TSR',
  shortTitle: null,
  category: 'method',
  group: 'one-molecule',
  path: '/methods/mirror-image',
  status: 'published',
  ...over,
})

const skeleton = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'publications', label: 'Publications', to: '/publications' },
  {
    id: 'methods',
    label: 'TSR-Based Methods',
    groups: [{ id: 'one-molecule-menu', label: 'One Molecule', sources: ['one-molecule'] }],
  },
]

const allRoutesExist = () => true

describe('technical availability gate', () => {
  it('hides a link whose route is not implemented', () => {
    const visible = getVisibleNavigation({
      skeleton,
      methods: [],
      isAvailable: (path) => path === '/',
    })

    expect(visible.map((item) => item.id)).toEqual(['home'])
  })

  it('shows a link once its route exists', () => {
    const visible = getVisibleNavigation({
      skeleton,
      methods: [],
      isAvailable: (path) => ['/', '/publications'].includes(path),
    })

    expect(visible.map((item) => item.id)).toEqual(['home', 'publications'])
  })

  it('drops a dropdown when none of its items have routes yet', () => {
    const visible = getVisibleNavigation({
      skeleton,
      methods: [method()],
      isAvailable: (path) => path === '/',
    })

    expect(visible.find((item) => item.id === 'methods')).toBeUndefined()
  })

  it('fills a dropdown from the content registry once routes exist', () => {
    const visible = getVisibleNavigation({
      skeleton,
      methods: [method()],
      isAvailable: allRoutesExist,
    })

    const methodsMenu = visible.find((item) => item.id === 'methods')
    expect(methodsMenu.groups[0].items).toEqual([
      { id: 'mirror-image', label: 'Mirror-Image TSR', to: '/methods/mirror-image' },
    ])
  })

  it('prefers shortTitle for the menu label when one is given', () => {
    const visible = getVisibleNavigation({
      skeleton,
      methods: [method({ shortTitle: 'Mirror-Image' })],
      isAvailable: allRoutesExist,
    })

    expect(visible.find((i) => i.id === 'methods').groups[0].items[0].label).toBe(
      'Mirror-Image',
    )
  })
})

describe('content approval gate', () => {
  it('never shows a draft method, even when its route exists', () => {
    /*
     * `publishedMethods` is what the menu is built from, so a draft entry
     * cannot reach it. Passing the full registry here would be the bug.
     */
    const drafts = methods.filter((entry) => entry.status === 'draft')
    const visible = getVisibleNavigation({
      skeleton,
      methods: publishedMethods,
      isAvailable: allRoutesExist,
    })

    const shown = visible
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((group) => group.items))
      .map((link) => link.id)

    for (const draft of drafts) {
      expect(shown).not.toContain(draft.slug)
    }
  })

  it('treats approval and availability as independent', () => {
    const approvedButUnbuilt = getVisibleNavigation({
      skeleton,
      methods: [method()],
      isAvailable: (path) => path === '/',
    })
    const builtButUnapproved = getVisibleNavigation({
      skeleton,
      methods: [],
      isAvailable: allRoutesExist,
    })

    expect(
      approvedButUnbuilt.find((item) => item.id === 'methods'),
    ).toBeUndefined()
    expect(builtButUnapproved.find((item) => item.id === 'methods')).toBeUndefined()
  })
})

describe('isRouteImplemented', () => {
  it('accepts a real route', () => {
    expect(isRouteImplemented('/')).toBe(true)
  })

  it('rejects a path that only matches the catch-all', () => {
    expect(isRouteImplemented('/methods/not-a-real-method')).toBe(false)
    expect(isRouteImplemented('/nothing-here')).toBe(false)
  })

  it('accepts every hand-built page', () => {
    for (const path of [
      '/publications',
      '/people',
      '/software',
      '/software/get-started',
      '/research',
      '/research/earlier-implementations',
      '/contact',
    ]) {
      expect(isRouteImplemented(path), path).toBe(true)
    }
  })

  it('judges a link to a section by the page it is on', () => {
    expect(isRouteImplemented('/software#research-code')).toBe(true)
    expect(isRouteImplemented('/nothing-here#section')).toBe(false)
  })

  it('leaves the retired legacy pages unavailable', () => {
    /*
     * Deliberate, and explained in legacyPaths.js: /problems was a form that
     * reported nothing and has no single successor, and /community was two
     * affiliation logos that are now in the footer of every page.
     */
    expect(isRouteImplemented('/problems')).toBe(false)
    expect(isRouteImplemented('/community')).toBe(false)
  })

  it('accepts a migrated method and its legacy alias', () => {
    expect(isRouteImplemented('/methods/mirror-image')).toBe(true)
    expect(isRouteImplemented('/mirror-image')).toBe(true)
  })
})

describe('live navigation', () => {
  it('links only to routes that exist', () => {
    const visible = getVisibleNavigation()

    const links = visible.flatMap((item) =>
      item.groups
        ? item.groups.flatMap((group) => group.items.map((link) => link.to))
        : [item.to],
    )

    expect(links.length).toBeGreaterThan(0)
    for (const to of links) {
      expect(isRouteImplemented(to), `${to} has no route`).toBe(true)
    }
  })

  it('has six top-level entries: home, the science, BioTSR, methods & research, papers, the group', () => {
    expect(getVisibleNavigation().map((item) => item.label)).toEqual([
      'Home',
      'Understand TSR',
      'BioTSR',
      'Methods & research',
      'Publications',
      'About',
    ])
  })

  it('starts with a plain Home link, as well as the header brand', () => {
    const [first] = navigationSkeleton
    expect(first).toMatchObject({ id: 'home', label: 'Home', to: '/' })
    expect(first.groups).toBeUndefined()
  })

  it('makes Understand TSR a plain link to the core method', () => {
    const science = getVisibleNavigation().find((item) => item.id === 'science')
    expect(science.groups).toBeUndefined()
    expect(science.to).toBe('/tsr')
  })

  it('holds only the two BioTSR pages in the BioTSR menu', () => {
    const biotsr = getVisibleNavigation().find((item) => item.id === 'biotsr')
    const links = biotsr.groups.flatMap((group) => group.items)

    expect(links.map((link) => [link.label, link.to])).toEqual([
      ['Overview', '/software'],
      ['Getting started', '/software/get-started'],
    ])
  })

  it('puts every method, analysis page and the earlier code under Methods & research', () => {
    const research = getVisibleNavigation().find((item) => item.id === 'research')
    expect(research.groups.map((group) => group.label)).toEqual([
      'Scientific methods',
      'Analysis and research applications',
      'Earlier implementations',
      'Overview',
    ])

    const pages = research.groups.flatMap((group) => group.items.map((link) => link.to))
    for (const method of publishedMethods.filter((m) => m.category !== 'core')) {
      expect(pages, method.slug).toContain(method.path)
    }
    expect(pages).toContain('/research/earlier-implementations')
    expect(pages).toContain('/research')
    // Each page appears exactly once.
    expect(new Set(pages).size).toBe(pages.length)
  })

  it('keeps the methods in their content order: one molecule, nucleotide, two molecules', () => {
    const research = getVisibleNavigation().find((item) => item.id === 'research')
    const [methods] = research.groups
    const groups = methods.items.map(
      (link) => publishedMethods.find((m) => m.path === link.to).group,
    )
    const order = ['one-molecule', 'nucleotide', 'two-molecules']
    expect([...groups].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(groups)
  })

  it('calls no scientific method legacy', () => {
    /* The methods are current science; only their first software is old. */
    const research = navigationSkeleton.find((item) => item.id === 'research')
    for (const group of research.groups) {
      expect(group.label).not.toMatch(/legacy/i)
    }
  })

  it('has no menu entry pointing at a section of a page', () => {
    /*
     * One menu entry per page is what keeps exactly one entry current: when
     * /software and /software#install were both entries, both lit up.
     */
    const links = getVisibleNavigation().flatMap((item) =>
      item.groups ? item.groups.flatMap((group) => group.items) : [item],
    )
    for (const link of links) {
      expect(link.to, link.label).not.toContain('#')
    }
  })
})

describe('no public link points at an unimplemented route', () => {
  /*
   * The whole-document guarantee required before the first public deploy:
   * every in-app link rendered anywhere in the chrome must resolve.
   */
  it('holds for the rendered header and footer', async () => {
    const { render, screen } = await import('@testing-library/react')
    const { MemoryRouter } = await import('react-router-dom')
    const { default: App } = await import('./App')

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const internal = Array.from(document.querySelectorAll('a[href^="/"]'))
      .map((a) => a.getAttribute('href'))
      // The skip link is an in-page anchor, not a route.
      .filter((href) => href !== '#main')

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), `${href} has no route`).toBe(true)
    }

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
