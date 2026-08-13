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
    source: 'method',
    groups: [{ id: 'one-molecule', label: 'One Molecule' }],
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
    for (const path of ['/publications', '/people', '/software', '/contact']) {
      expect(isRouteImplemented(path), path).toBe(true)
    }
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

  it('labels the analysis menu "Key Analysis & Visualization"', () => {
    const entry = navigationSkeleton.find((item) => item.id === 'analysis')
    expect(entry.label).toBe('Key Analysis & Visualization')
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
