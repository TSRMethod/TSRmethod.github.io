import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import {
  pages,
  publicationsByYear,
  formatPublicationCitation,
} from '../../content'

function renderPublications() {
  return render(
    <MemoryRouter initialEntries={['/publications']}>
      <App />
    </MemoryRouter>,
  )
}

describe('the publications page', () => {
  it('renders at /publications', () => {
    renderPublications()

    expect(
      screen.getByRole('heading', { level: 1, name: pages.publications.title }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Publications | TSR Research Group')
  })

  it('shows every publication record', () => {
    renderPublications()

    expect(publicationsByYear.length).toBeGreaterThan(0)
    for (const publication of publicationsByYear) {
      expect(
        screen.getByRole('heading', { level: 3, name: publication.title }),
      ).toBeInTheDocument()
    }
  })

  it('groups them under year headings, newest year first', () => {
    renderPublications()

    // Scoped to <main>: the footer's column headings are also level 2.
    const years = within(screen.getByRole('main'))
      .getAllByRole('heading', { level: 2 })
      .map((heading) => Number(heading.textContent))

    expect(years.length).toBeGreaterThan(1)
    expect(years).toEqual([...years].sort((a, b) => b - a))
    expect(new Set(years).size).toBe(years.length)
  })

  it('shows the newest paper before the oldest in the document', () => {
    renderPublications()

    const newest = publicationsByYear[0]
    const oldest = publicationsByYear.at(-1)

    const first = screen.getByRole('heading', { name: newest.title })
    const last = screen.getByRole('heading', { name: oldest.title })

    const order = first.compareDocumentPosition(last)
    expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('prints the full author list, in order', () => {
    renderPublications()

    const publication = publicationsByYear.find((p) => p.authors.length > 3)
    expect(publication).toBeDefined()
    expect(
      screen.getByText(publication.authors.join(', ')),
    ).toBeInTheDocument()
  })

  it('prints a clean citation for every record', () => {
    renderPublications()

    for (const publication of publicationsByYear) {
      const citation = formatPublicationCitation(publication)
      expect(citation, publication.id).not.toMatch(/,\s*,/)
      expect(screen.getAllByText(citation).length).toBeGreaterThan(0)
    }
  })

  it('links each DOI so the link text identifies the paper', () => {
    renderPublications()

    for (const publication of publicationsByYear) {
      if (!publication.doi) continue

      const link = screen.getByRole('link', {
        name: new RegExp(
          `${publication.doi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
        ),
      })

      expect(link).toHaveAttribute('href', `https://doi.org/${publication.doi}`)
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
      // The accessible name carries the title, so a screen reader's link list
      // has one meaningful entry per paper rather than repeated "read more"s.
      expect(link.textContent).toContain(publication.title)
    }
  })

  it('shows an abstract only where a record has one', () => {
    renderPublications()

    const withAbstract = publicationsByYear.filter((p) => p.abstract)
    const toggles = screen.queryAllByText('Abstract')

    expect(toggles).toHaveLength(withAbstract.length)
    for (const publication of withAbstract) {
      expect(screen.getByText(publication.abstract)).toBeInTheDocument()
    }
  })

  it('does not repeat one paper twice', () => {
    renderPublications()

    for (const publication of publicationsByYear) {
      expect(
        screen.getAllByRole('heading', { name: publication.title }),
        publication.id,
      ).toHaveLength(1)
    }
  })

  it('names each year section for assistive technology', () => {
    renderPublications()

    const sections = screen.getAllByRole('region')
    const names = sections.map((section) =>
      section.getAttribute('aria-labelledby'),
    )

    for (const name of names) {
      expect(document.getElementById(name)).not.toBeNull()
    }
  })

  it('takes its heading and introduction from content, not the component', () => {
    renderPublications()

    expect(screen.getByText(pages.publications.intro)).toBeInTheDocument()
  })
})

describe('publications in the navigation', () => {
  it('is reachable from the footer now the route exists', () => {
    renderPublications()

    const footer = within(screen.getByRole('contentinfo'))
    expect(
      footer.getByRole('link', { name: 'Publications' }),
    ).toHaveAttribute('href', '/publications')
  })
})
