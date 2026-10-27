import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { isRouteImplemented } from '../../app/routeRegistry'
import { setViewport } from '../../test/viewport'
import {
  pages,
  repositories,
  publishedMethods,
  getPagesForRepository,
  getRepositoriesByCategory,
} from '../../content'

/*
 * The Methods & research page, and the Earlier software and research code
 * page under it. The repository tests moved here with the listing, which was
 * a section of the BioTSR page until that page became about BioTSR alone.
 */

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/* Every repository but BioTSR. */
const researchRepositories = repositories.filter((r) => r.category !== 'core')

beforeEach(() => setViewport('desktop'))

describe('Methods & research', () => {
  it('renders at /research with its own title', () => {
    renderAt('/research')

    expect(screen.getByRole('heading', { level: 1, name: pages.research.title })).toBeInTheDocument()
    expect(document.title).toBe(`${pages.research.title} | TSR Research Group`)
  })

  it('lists every published method and analysis page, each once', () => {
    renderAt('/research')

    const links = Array.from(screen.getByRole('main').querySelectorAll('a[href]')).map((a) =>
      a.getAttribute('href'),
    )
    for (const method of publishedMethods.filter((m) => m.category !== 'core')) {
      expect(links.filter((href) => href === method.path), method.slug).toHaveLength(1)
    }
    expect(links).toContain('/tsr')
    expect(links).toContain('/research/earlier-implementations')
  })

  it('groups the pages under the three headings the menu uses', () => {
    renderAt('/research')

    for (const heading of [
      pages.research.methodsHeading,
      pages.research.analysisHeading,
      pages.research.earlierHeading,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).toBeInTheDocument()
    }
  })

  it('does not show Key to 2D Image while it is a draft', () => {
    renderAt('/research')
    expect(screen.queryByText(/key to 2d image/i)).not.toBeInTheDocument()
  })
})

describe('earlier software and research code', () => {
  it('renders at its own address, linked back to Methods & research and to BioTSR', () => {
    renderAt('/research/earlier-implementations')

    expect(
      screen.getByRole('heading', { level: 1, name: pages.earlierImplementations.title }),
    ).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('link', { name: pages.research.title })).toHaveAttribute('href', '/research')
    expect(main.getByRole('link', { name: pages.earlierImplementations.biotsrAction })).toHaveAttribute(
      'href',
      '/software',
    )
  })

  it('puts the BioTSR recommendation and its button in one box, apart from the licence note', () => {
    renderAt('/research/earlier-implementations')

    const copy = pages.earlierImplementations
    const box = screen.getByRole('complementary', { name: 'Current software' })
    expect(within(box).getByText(copy.biotsrNote)).toBeInTheDocument()
    expect(within(box).getByRole('link', { name: copy.biotsrAction })).toHaveAttribute('href', '/software')
    expect(within(box).queryByText(copy.licenceNote)).toBeNull()
    expect(screen.getByText(copy.licenceNote)).toBeInTheDocument()
  })

  it('lists every repository but BioTSR, once, under its group', () => {
    renderAt('/research/earlier-implementations')

    const main = within(screen.getByRole('main'))
    for (const repository of researchRepositories) {
      expect(
        main.getAllByRole('heading', { name: new RegExp(repository.name) }),
        repository.id,
      ).toHaveLength(1)
      expect(main.getByText(repository.description)).toBeInTheDocument()
    }
    expect(main.queryByRole('heading', { name: /^BioTSR/ })).not.toBeInTheDocument()
  })

  it('separates earlier implementations from separate research tools', () => {
    renderAt('/research/earlier-implementations')

    const copy = pages.earlierImplementations
    const historical = within(screen.getByRole('list', { name: copy.historicalHeading }))
    const tools = within(screen.getByRole('list', { name: copy.toolsHeading }))

    for (const repository of getRepositoriesByCategory('historical')) {
      expect(historical.getByRole('heading', { name: new RegExp(repository.name) })).toBeInTheDocument()
    }
    for (const repository of getRepositoriesByCategory('analysis')) {
      expect(tools.getByRole('heading', { name: new RegExp(repository.name) })).toBeInTheDocument()
    }
    expect(getRepositoriesByCategory('historical').map((r) => r.id)).toContain('tsr-package')
    expect(getRepositoriesByCategory('analysis').map((r) => r.id)).toContain('nucleotide-analysis')
  })

  it('shows each repository’s own licence, as its record states it', () => {
    renderAt('/research/earlier-implementations')

    for (const repository of researchRepositories) {
      const card = screen
        .getByRole('heading', { name: new RegExp(`^${repository.name}\\b`) })
        .closest('li')
      expect(within(card).getByText(repository.licence), repository.id).toBeInTheDocument()
    }
    // The checked statuses (CONTENT-REVIEW.md item 29, re-checked 26 October 2026).
    const licence = (id) => repositories.find((r) => r.id === id).licence
    expect(licence('tsr-package')).toBe('MIT License')
    expect(licence('hsp70-actin')).toBe('GNU General Public License v3.0')
    expect(licence('tsr-aminoacid-package')).toBe('No licence stated')
  })

  it('does not call the science legacy, or claim every earlier result differs', () => {
    const copy = pages.earlierImplementations
    const text = [copy.intro, copy.biotsrNote, copy.historicalIntro, copy.toolsIntro, copy.licenceNote].join(' ')
    expect(text).not.toMatch(/legacy|obsolete|deprecated/i)
    expect(text).not.toMatch(/not expected to match/)
    expect(copy.historicalIntro).toMatch(/method's page describes the difference/)
  })

  it('links each repository to its GitHub page, safely', () => {
    renderAt('/research/earlier-implementations')

    for (const repository of researchRepositories) {
      const link = screen.getByRole('link', { name: new RegExp(`^${repository.name}\\b`) })
      expect(link).toHaveAttribute('href', repository.url)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('says which entries are installable and which are research scripts', () => {
    renderAt('/research/earlier-implementations')

    const main = within(screen.getByRole('main'))
    expect(main.getAllByText('Installable Python package').length).toBe(
      researchRepositories.filter((r) => r.kind === 'package').length,
    )
    expect(main.getAllByText('Research scripts').length).toBe(
      researchRepositories.filter((r) => r.kind === 'scripts').length,
    )
  })

  it('reads the owner from the URL rather than storing it', () => {
    renderAt('/research/earlier-implementations')

    for (const repository of researchRepositories) {
      const path = repository.url.replace('https://github.com/', '')
      expect(screen.getByText(`github.com/${path}`)).toBeInTheDocument()
    }
  })

  it('links each repository to the pages that document it', () => {
    renderAt('/research/earlier-implementations')

    const tsrPackage = repositories.find((r) => r.id === 'tsr-package')
    const documented = getPagesForRepository(tsrPackage.url)
    expect(documented.length).toBeGreaterThan(1)

    const card = screen
      .getByRole('heading', { name: new RegExp(`^${tsrPackage.name}\\b`) })
      .closest('li')
    for (const method of documented) {
      expect(
        within(card).getByRole('link', { name: method.shortTitle ?? method.title }),
      ).toHaveAttribute('href', method.path)
    }
  })

  it('offers one "Report a problem" link per tracker it lists', () => {
    renderAt('/research/earlier-implementations')

    const withTracker = researchRepositories.filter((r) => r.issuesUrl)
    expect(screen.queryAllByRole('link', { name: /report a problem/i })).toHaveLength(
      withTracker.length,
    )
  })

  it('groups repositories deterministically, by category then order', () => {
    for (const category of ['core', 'historical', 'analysis']) {
      const orders = getRepositoriesByCategory(category).map((r) => r.order ?? 999)
      expect(orders, category).toEqual([...orders].sort((a, b) => a - b))
    }
  })

  it('points every internal link at an implemented route', () => {
    for (const path of ['/research', '/research/earlier-implementations']) {
      const { unmount } = renderAt(path)
      const hrefs = Array.from(screen.getByRole('main').querySelectorAll('a[href^="/"]')).map(
        (a) => a.getAttribute('href'),
      )
      expect(hrefs.length).toBeGreaterThan(0)
      for (const href of hrefs) {
        expect(isRouteImplemented(href), href).toBe(true)
      }
      unmount()
    }
  })
})
