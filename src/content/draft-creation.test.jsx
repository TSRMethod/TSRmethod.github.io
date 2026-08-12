import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { buildMethod, buildRegistry, methods, publishedMethods } from './index'
import { getVisibleNavigation } from '../app/navigation'
import { isRouteImplemented } from '../app/routeRegistry'
import MethodPage from '../components/method/MethodPage'
import App from '../app/App'
import { setViewport } from '../test/viewport'

/*
 * A method draft created through Pages CMS.
 *
 * This is what the CMS actually writes: the editorial fields the supervisor
 * filled in, and nothing else. There is no slug, status, category, group or
 * order, because all five are hidden from the editor. The filename comes from
 * slugifying the title.
 */
const CMS_CREATED = `---
title: VCNN-TSR
summary: A new method the supervisor has just written up.
---

## Overview

Draft text written in the CMS.
`

const source = './methods/vcnn-tsr.md'

describe('a draft created in the CMS', () => {
  const draft = buildMethod(source, CMS_CREATED)

  it('parses without any developer-controlled metadata', () => {
    expect(draft.title).toBe('VCNN-TSR')
    expect(draft.summary).toMatch(/supervisor/)
  })

  it('derives its slug from the filename', () => {
    expect(draft.slug).toBe('vcnn-tsr')
  })

  it('is treated as a draft when no status is given', () => {
    expect(draft.status).toBe('draft')
  })

  it('has no category, group or route of its own', () => {
    expect(draft.category).toBeNull()
    expect(draft.group).toBeNull()
    // No path at all, so there is nothing that could accidentally be linked.
    expect(draft.path).toBeNull()
  })

  it('tolerates the empty values Pages CMS may write for hidden fields', () => {
    const withEmpties = buildMethod(
      source,
      `---
title: VCNN-TSR
summary: Something.
slug: ''
status: ''
category: ''
group: ''
order: null
---

## Overview

Body.
`,
    )

    expect(withEmpties.slug).toBe('vcnn-tsr')
    expect(withEmpties.status).toBe('draft')
    expect(withEmpties.category).toBeNull()
    expect(withEmpties.order).toBe(999)
  })

  it('survives being saved half-finished', () => {
    // An editor who creates the page and saves before writing anything must
    // not break the build for the entire site.
    expect(() =>
      buildMethod(source, '---\ntitle: VCNN-TSR\n---\n\n'),
    ).not.toThrow()
  })

  it('still rejects a structural mistake', () => {
    // Absent metadata is fine; a malformed value is not.
    expect(() =>
      buildMethod(
        source,
        '---\ntitle: X\nfigure:\n  alt: no image given\n---\n\nBody.\n',
      ),
    ).toThrow(/figure needs a "src"/)
  })
})

describe('a draft stays out of the public site', () => {
  const registry = buildRegistry({
    [source]: CMS_CREATED,
    './methods/live.md': `---
title: Live Method
summary: Published and complete.
status: published
category: method
group: one-molecule
---

## Overview

Body.
`,
  })

  const draft = registry.find((entry) => entry.slug === 'vcnn-tsr')
  const live = registry.find((entry) => entry.slug === 'live')

  it('is present in the internal registry', () => {
    expect(draft).toBeDefined()
    expect(registry).toHaveLength(2)
  })

  it('is excluded from the published set that drives routing', () => {
    const published = registry.filter((entry) => entry.status === 'published')
    expect(published.map((entry) => entry.slug)).toEqual(['live'])
  })

  it('has no implemented route', () => {
    expect(isRouteImplemented('/methods/vcnn-tsr')).toBe(false)
  })

  it('does not appear in the navigation', () => {
    const visible = getVisibleNavigation({
      methods: registry.filter((entry) => entry.status === 'published'),
      isAvailable: () => true,
    })

    const shown = visible
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((group) => group.items))
      .map((link) => link.id)

    expect(shown).toContain('live')
    expect(shown).not.toContain('vcnn-tsr')
  })

  it('is not reachable by typing its address', () => {
    render(
      <MemoryRouter>
        <MethodPage slug="vcnn-tsr" />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('a published sibling does become routable and navigable', () => {
    expect(live.path).toBe('/methods/live')

    const visible = getVisibleNavigation({
      methods: [live],
      isAvailable: (path) => path === live.path,
    })

    const links = visible
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((group) => group.items))

    expect(links).toEqual([
      { id: 'live', label: 'Live Method', to: '/methods/live' },
    ])
  })
})

describe('publication remains strict', () => {
  const publish = (extra) =>
    buildMethod(
      './methods/x.md',
      `---
title: X
summary: A summary.
status: published
${extra}
---

## Overview

Body.
`,
    )

  it('fails when a published method has no category', () => {
    expect(() => publish('group: one-molecule')).toThrow(/needs a "category"/)
  })

  it('fails when a published method has no group', () => {
    expect(() => publish('category: method')).toThrow(/needs a "group"/)
  })

  it('fails when a published method has an unknown category', () => {
    expect(() => publish('category: nonsense\ngroup: one-molecule')).toThrow(
      /"category" must be one of/,
    )
  })

  it('fails when a published method has no summary', () => {
    expect(() =>
      buildMethod(
        './methods/x.md',
        '---\ntitle: X\nstatus: published\ncategory: method\ngroup: g\n---\n\n## H\n\nBody.\n',
      ),
    ).toThrow(/"summary" is required/)
  })

  it('fails when a published method has no body', () => {
    expect(() =>
      buildMethod(
        './methods/x.md',
        '---\ntitle: X\nsummary: S\nstatus: published\ncategory: method\ngroup: g\n---\n\n',
      ),
    ).toThrow(/needs body content/)
  })

  it('fails when a published figure has no alt text', () => {
    expect(() =>
      publish('category: method\ngroup: g\nfigure:\n  src: /images/x.png'),
    ).toThrow(/needs "alt" text/)
  })

  it('allows a draft figure to have no alt text yet', () => {
    expect(() =>
      buildMethod(
        './methods/x.md',
        '---\ntitle: X\nfigure:\n  src: /images/x.png\n---\n\nBody.\n',
      ),
    ).not.toThrow()
  })

  it('still rejects an explicit slug that disagrees with the filename', () => {
    expect(() =>
      buildMethod(
        './methods/mirror-image.md',
        '---\nslug: mirror-images\ntitle: X\nsummary: S\n---\n\nBody.\n',
      ),
    ).toThrow(/does not match the filename/)
  })

  it('succeeds once everything a published page needs is present', () => {
    const method = publish('category: analysis\ngroup: key-analysis')

    expect(method.status).toBe('published')
    expect(method.path).toBe('/analysis/x')
  })
})

describe('the real site is unaffected', () => {
  it('still publishes the TSR page', () => {
    const tsr = publishedMethods.find((entry) => entry.slug === 'tsr')
    expect(tsr).toBeDefined()
    expect(tsr.path).toBe('/tsr')
    expect(isRouteImplemented('/tsr')).toBe(true)
  })

  it('keeps every draft in the repository out of the published set', () => {
    /*
     * Drafts are expected to exist — SSE-TSR is one. What matters is that none
     * of them reaches the published set, and so none of them can be routed or
     * linked. This replaces an earlier assertion that no drafts existed at
     * all, which stopped being true once real content started arriving.
     */
    const drafts = methods.filter((entry) => entry.status === 'draft')
    const publishedSlugs = publishedMethods.map((entry) => entry.slug)

    expect(drafts.length).toBeGreaterThan(0) // SSE-TSR, at the time of writing

    for (const draft of drafts) {
      expect(publishedSlugs).not.toContain(draft.slug)

      /*
       * A draft may well have a category and group already assigned by a
       * maintainer, in which case it has a computed path. What must hold is
       * that the path is not routable — placement is not publication.
       */
      if (draft.path) {
        expect(
          isRouteImplemented(draft.path),
          `${draft.path} must not be routable while draft`,
        ).toBe(false)
      }
    }
  })

  it('renders /tsr and shows it in the navigation', () => {
    setViewport('desktop')
    render(
      <MemoryRouter initialEntries={['/tsr']}>
        <App />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /Triangular Spatial/ }),
    ).toBeInTheDocument()
  })

  it('exposes no unimplemented route anywhere in the chrome', () => {
    setViewport('desktop')
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const internal = Array.from(document.querySelectorAll('a[href^="/"]')).map(
      (anchor) => anchor.getAttribute('href'),
    )

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), `${href} has no route`).toBe(true)
    }
  })
})
