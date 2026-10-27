import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { isRouteImplemented } from '../../app/routeRegistry'
import { siteConfig } from '../../app/siteConfig'
import {
  home,
  methods,
  publicationsByYear,
  facultyPeople,
  getRecentPublications,
} from '../../content'

/*
 * The home page is where the two guarantees the rest of the site relies on
 * become visible to a reader: only approved content appears, and every link
 * goes somewhere that exists.
 *
 * These tests are written against the real content registry rather than
 * fixtures, on purpose. A fixture would prove the component can filter; what
 * matters is that the page as actually shipped shows no draft and no dead
 * link, and that stays true as content is added.
 */

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

/** Every in-app link on the page, excluding external and mailto links. */
function internalLinks() {
  return Array.from(document.querySelectorAll('main a[href]'))
    .map((link) => link.getAttribute('href'))
    .filter((href) => href.startsWith('/'))
}

describe('the home page replaces the placeholder', () => {
  it('no longer says the site is being rebuilt', () => {
    renderHome()

    expect(screen.queryByText(/being rebuilt/i)).not.toBeInTheDocument()
    expect(
      screen.queryByText(/migrated section by section/i),
    ).not.toBeInTheDocument()
  })

  it('has exactly one h1, and it is the group name', () => {
    renderHome()

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(siteConfig.name)
  })

  it('sets the document title to the bare site name', () => {
    renderHome()

    expect(document.title).toBe(siteConfig.name)
  })

  it('starts every section below the h1 at heading level 2', () => {
    renderHome()

    const main = screen.getByRole('main')
    const levels = Array.from(
      main.querySelectorAll('h1, h2, h3, h4'),
    ).map((element) => Number(element.tagName[1]))

    // No level may be skipped: a jump from h2 straight to h4 would break the
    // outline a screen reader user navigates by.
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })
})

describe('what the home page lists', () => {
  it('previews Methods & research in three cards rather than listing every page', () => {
    /*
     * The full directory moved to /research. The home page links into it,
     * and must not grow back into a card per method.
     */
    renderHome()

    const section = within(screen.getByRole('region', { name: home.research.heading }))
    const cards = section.getAllByRole('heading', { level: 3 })
    expect(cards.map((card) => card.textContent)).toEqual([
      'Scientific methods',
      'Analysis and research applications',
      'Earlier implementations',
    ])
    expect(section.getByRole('link', { name: home.research.cta })).toHaveAttribute('href', '/research')

    const links = internalLinks()
    for (const method of methods.filter((m) => m.status === 'published' && m.category !== 'core')) {
      expect(links, method.slug).not.toContain(method.path)
    }
  })

  it('counts the published pages behind each card from the registry', () => {
    renderHome()

    const count = (category) =>
      methods.filter((m) => m.status === 'published' && m.category === category).length
    const section = within(screen.getByRole('region', { name: home.research.heading }))
    expect(section.getByText(`${count('method')} pages`)).toBeInTheDocument()
    expect(section.getByText(`${count('analysis')} pages`)).toBeInTheDocument()
  })

  it('shows no earlier package as a card of its own', () => {
    renderHome()
    expect(screen.getByRole('main')).not.toHaveTextContent(
      /TSR-Package|TSR_AMINOACID_PACKAGE|TSR_NUCLEOTIDE_PACKAGE|Nucleotide-Protein/,
    )
  })

  it('does not show Key to 2D Image while it is a draft', () => {
    /*
     * The draft gate, seen from the outside. If this page ever starts
     * advertising an unreviewed method, this fails — and if the page is
     * published for real, the assertion is meant to be updated deliberately.
     */
    const keyToImage = methods.find((method) => method.slug === 'key-to-image')
    expect(keyToImage.status).toBe('draft')

    renderHome()

    expect(screen.queryByText(/key to 2d image/i)).not.toBeInTheDocument()
    expect(internalLinks()).not.toContain('/analysis/key-to-image')
  })

  it('does not mention CrossTSR or Metal-Ion TSR', () => {
    // Both are blocked legacy content with no file in src/content at all,
    // so there is nothing for the registry to surface. See CONTENT-REVIEW.md.
    renderHome()

    expect(screen.queryByText(/crosstsr/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/metal.?ion/i)).not.toBeInTheDocument()
  })

  it('shows the three most recent publications, from the records', () => {
    renderHome()

    const recent = getRecentPublications()
    expect(recent).toHaveLength(3)

    const section = screen.getByRole('region', {
      name: home.publications.heading,
    })

    for (const publication of recent) {
      expect(
        within(section).getByText(publication.title),
      ).toBeInTheDocument()
    }

    // ...and only those three: the full list belongs on /publications.
    const older = publicationsByYear.slice(3)
    for (const publication of older) {
      expect(
        within(section).queryByText(publication.title),
        `${publication.id} should not be on the home page`,
      ).not.toBeInTheDocument()
    }
  })

  it('shows the faculty from the people records, with their own titles', () => {
    renderHome()

    const section = screen.getByRole('region', { name: home.group.heading })
    expect(facultyPeople.length).toBeGreaterThan(0)

    for (const person of facultyPeople) {
      expect(within(section).getByText(person.name)).toBeInTheDocument()
      expect(within(section).getByText(person.role)).toBeInTheDocument()
    }
  })

  it('shows no student as faculty', () => {
    renderHome()

    const section = screen.getByRole('region', { name: home.group.heading })
    const shown = facultyPeople.map((person) => person.name)

    expect(shown).not.toContain('Poorya Khajouie')
    expect(
      within(section).queryByText(/Ph\.D\. Student/i),
    ).not.toBeInTheDocument()
  })
})

describe('every home page link goes somewhere real', () => {
  it('points no internal link at an unimplemented route', () => {
    renderHome()

    const links = internalLinks()
    expect(links.length).toBeGreaterThan(0)

    for (const href of links) {
      expect(isRouteImplemented(href), `${href} is not a route`).toBe(true)
    }
  })

  it('uses no placeholder or legacy href', () => {
    renderHome()

    const hrefs = Array.from(
      document.querySelectorAll('main a[href]'),
    ).map((link) => link.getAttribute('href'))

    for (const href of hrefs) {
      expect(href).not.toBe('#')
      expect(href).not.toBe('')
      expect(href).not.toMatch(/your-repo/)
      expect(href).not.toMatch(/vercel\.app/)
    }
  })

  it('resolves any in-page anchor it offers', () => {
    renderHome()

    // The hero's second action now leads to Getting started rather than to a
    // section below, so the page may offer no in-page anchor at all.
    const anchors = Array.from(document.querySelectorAll('main a[href^="#"]'))

    for (const anchor of anchors) {
      const id = anchor.getAttribute('href').slice(1)
      expect(document.getElementById(id), `#${id} does not exist`).not.toBeNull()
    }
  })

  it('opens every external link safely', () => {
    renderHome()

    const external = Array.from(
      document.querySelectorAll('main a[href^="http"]'),
    )
    expect(external.length).toBeGreaterThan(0)

    for (const link of external) {
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })
})

describe('the home page keeps its content in content files', () => {
  it('takes the contact address from the one central value', () => {
    renderHome()

    const mailto = Array.from(
      document.querySelectorAll('main a[href^="mailto:"]'),
    ).map((link) => link.getAttribute('href'))

    expect(mailto.length).toBeGreaterThan(0)
    for (const href of mailto) {
      expect(href).toContain(siteConfig.email)
    }
  })

  it('renders the wording from home.json rather than its own prose', () => {
    renderHome()

    expect(screen.getByText(home.hero.lede)).toBeInTheDocument()
    expect(screen.getByText(home.introduction.body)).toBeInTheDocument()
    expect(screen.getByText(home.contact.body)).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: home.research.heading }),
    ).toBeInTheDocument()
  })

  it('shows the compact TSR overview, not the old infographic', () => {
    /*
     * The infographic drew the longest edge as the base and put θ at a
     * vertex. The overview is drawn from a BioTSR calculation instead.
     */
    renderHome()

    const figure = screen.getByRole('figure', { name: /From a structure to TSR keys/ })
    expect(within(figure).getAllByRole('listitem')).toHaveLength(4)
    expect(
      document.querySelector('img[src*="high-resolution-scientific-workflow-infographic"]'),
    ).toBeNull()
    expect(screen.getByRole('link', { name: home.introduction.cta })).toHaveAttribute('href', '/tsr')
  })
})

describe('BioTSR on the home page', () => {
  it('follows the research question and comes before the TSR explanation', () => {
    renderHome()

    const headings = Array.from(document.querySelectorAll('main h2')).map((h) => h.textContent)
    expect(headings.slice(0, 4)).toEqual([
      home.researchVision.heading,
      home.software.heading,
      home.introduction.heading,
      home.research.heading,
    ])
  })

  it('says what BioTSR does, in the points from home.json', () => {
    renderHome()

    const section = within(screen.getByRole('region', { name: home.software.heading }))
    for (const point of home.software.highlights) {
      expect(section.getByText(point)).toBeInTheDocument()
    }
    expect(section.getByText(/BioTSR 1\.0\.0/)).toBeInTheDocument()
  })

  it('offers both ways in from the hero: the science and the software', () => {
    renderHome()

    const hero = within(screen.getByRole('region', { name: siteConfig.name }))
    expect(hero.getByRole('link', { name: home.hero.primaryCta })).toHaveAttribute(
      'href',
      '/tsr',
    )
    expect(hero.getByRole('link', { name: home.hero.secondaryCta })).toHaveAttribute(
      'href',
      '/software/get-started',
    )
  })

  it('features BioTSR with its pinned install command, not a repository grid', () => {
    renderHome()

    const section = within(screen.getByRole('region', { name: home.software.heading }))
    expect(section.getByText('python -m pip install "biotsr==1.0.0"')).toBeInTheDocument()
    expect(section.getByRole('link', { name: home.software.getStartedCta })).toHaveAttribute(
      'href',
      '/software/get-started',
    )
    expect(section.getByRole('link', { name: home.software.softwareCta })).toHaveAttribute(
      'href',
      '/software',
    )
    // The historical repositories have their own page, not a place here.
    expect(section.queryByText(/TSR-Package|TSR_AMINOACID_PACKAGE/)).not.toBeInTheDocument()
  })

  it('no longer says a consolidated package is coming', () => {
    renderHome()

    expect(screen.getByRole('main')).not.toHaveTextContent(/consolidated package|is planned/i)
  })
})
