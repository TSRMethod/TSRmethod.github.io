import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { pages, people, currentPeople, formerPeople } from '../../content'

function renderPeople() {
  return render(
    <MemoryRouter initialEntries={['/people']}>
      <App />
    </MemoryRouter>,
  )
}

/** Every person card on the page. */
const cards = () =>
  Array.from(screen.getByRole('main').querySelectorAll('li')).filter((li) =>
    li.querySelector('h3'),
  )

/** The card belonging to one person, found by their name. */
const cardFor = (person) =>
  screen.getByRole('heading', { name: person.name }).closest('li')

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('the people page', () => {
  it('renders at /people', () => {
    renderPeople()

    expect(
      screen.getByRole('heading', { level: 1, name: pages.people.title }),
    ).toBeInTheDocument()
    expect(document.title).toBe('People | TSR Research Group')
  })

  it('separates current from former members', () => {
    renderPeople()

    const current = within(
      screen.getByRole('region', { name: pages.people.currentHeading }),
    )
    const former = within(
      screen.getByRole('region', { name: pages.people.formerHeading }),
    )

    for (const person of currentPeople) {
      expect(current.getByText(person.name)).toBeInTheDocument()
      expect(former.queryByText(person.name)).not.toBeInTheDocument()
    }
    for (const person of formerPeople) {
      expect(former.getByText(person.name)).toBeInTheDocument()
      expect(current.queryByText(person.name)).not.toBeInTheDocument()
    }
  })

  it('lists everyone exactly once', () => {
    renderPeople()

    for (const person of people) {
      expect(
        screen.getAllByRole('heading', { name: person.name }),
        person.id,
      ).toHaveLength(1)
    }
  })

  it('shows each person their own role', () => {
    renderPeople()

    for (const person of people) {
      const heading = screen.getByRole('heading', { name: person.name })
      const card = heading.closest('li')
      expect(within(card).getByText(person.role)).toBeInTheDocument()
    }
  })

  it('describes every portrait', () => {
    renderPeople()

    for (const person of people) {
      if (!person.photo) continue
      const image = screen.getByAltText(`Portrait of ${person.name}`)
      expect(image).toHaveAttribute('src', person.photo)
      expect(image).toHaveAttribute('loading', 'lazy')
    }
  })

  it('renders no dangling label where a field is absent', () => {
    /*
     * The bug this page exists to not repeat: the previous site printed
     * "Phone:" and "Email:" with nothing after them for nine people, and
     * wrapped the empty address in a mailto link.
     */
    renderPeople()

    const main = screen.getByRole('main')
    expect(main.textContent).not.toMatch(/Phone:\s*(?![\d(])/)
    expect(main.textContent).not.toMatch(/Email:\s*$/m)

    for (const link of main.querySelectorAll('a[href^="mailto:"]')) {
      expect(link.getAttribute('href')).not.toBe('mailto:')
      /* Icon links carry their meaning as an accessible name, not as text. */
      expect(link).toHaveAccessibleName()
    }
  })

  it('leaves no profile link empty or pointing nowhere', () => {
    renderPeople()

    for (const card of cards()) {
      for (const link of card.querySelectorAll('a')) {
        const href = link.getAttribute('href')
        expect(href, link.outerHTML).toBeTruthy()
        expect(href).not.toMatch(/^(mailto:|https?:\/\/)?$/)
        expect(link.getAttribute('aria-label')?.trim()).toBeTruthy()
      }
    }
  })

  it('publishes an email only for the people who have one', () => {
    renderPeople()

    const main = screen.getByRole('main')
    const addresses = Array.from(
      main.querySelectorAll('a[href^="mailto:"]'),
    ).map((link) => link.getAttribute('href').replace('mailto:', ''))

    expect(addresses.sort()).toEqual(
      people
        .filter((person) => person.email)
        .map((person) => person.email)
        .sort(),
    )
  })

  it('shows an address as an icon, never as a line of text on the card', () => {
    /*
     * The change this redesign is for. The address is still one click away —
     * it is the href, and the accessible name says whose it is — but it is no
     * longer printed thirteen times down the page, where it made the cards
     * long and handed a scraper a tidy list.
     */
    renderPeople()

    const main = screen.getByRole('main')

    for (const person of people) {
      if (!person.email) continue
      expect(main.textContent, person.id).not.toContain(person.email)
    }
  })

  it('renders an icon for each profile a person has, and none for the rest', () => {
    renderPeople()

    for (const person of people) {
      const card = within(cardFor(person))

      for (const [field, name] of [
        ['email', `Email ${person.name}`],
        ['scholar', `Google Scholar profile of ${person.name}`],
        ['linkedin', `LinkedIn profile of ${person.name}`],
      ]) {
        const matcher = new RegExp(`^${escapeRegExp(name)}`)
        const link = card.queryByRole('link', { name: matcher })

        if (person[field]) {
          expect(link, `${person.id}.${field}`).toBeInTheDocument()
          expect(link).toHaveAttribute(
            'href',
            field === 'email' ? `mailto:${person.email}` : person[field],
          )
        } else {
          expect(link, `${person.id}.${field}`).not.toBeInTheDocument()
        }
      }
    }
  })

  it('names every profile link by its action and its person', () => {
    /*
     * Thirteen links called "Email" would be thirteen identical entries in a
     * screen reader's link list. Each name says what it does and who it
     * reaches, so the list stays usable on its own.
     */
    renderPeople()

    for (const person of people) {
      for (const link of cardFor(person).querySelectorAll('a')) {
        const name = link.getAttribute('aria-label')
        expect(name, person.id).toContain(person.name)
        expect(name).toMatch(/^(Email|Google Scholar|LinkedIn)/)
      }
    }
  })

  it('opens external profiles safely in a new tab', () => {
    renderPeople()

    for (const person of people) {
      for (const link of cardFor(person).querySelectorAll('a[href^="https:"]')) {
        expect(link).toHaveAttribute('target', '_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
        expect(link.getAttribute('aria-label')).toContain('opens in a new tab')
      }
    }
  })

  it('leaves the biography and affiliation off the card', () => {
    /*
     * Both are still in the records and still editable in the CMS — this
     * asserts only that the public grid no longer prints them, which is what
     * made the page a wall of text.
     */
    renderPeople()

    /*
     * Scoped to the cards, not to the page: the page's own introduction names
     * the university, and that is editorial copy the CMS owns.
     */
    for (const person of people) {
      const card = cardFor(person).textContent

      if (person.bio) {
        expect(card, `${person.id} bio`).not.toContain(person.bio.slice(0, 40))
      }
      if (person.affiliation) {
        expect(card, `${person.id} affiliation`).not.toContain(
          person.affiliation,
        )
      }
    }
  })

  it('keeps the card to a portrait, a name, a role and its links', () => {
    /* Structure rather than wording: nothing else may creep back onto it. */
    renderPeople()

    for (const person of people) {
      const card = cardFor(person)
      const paragraphs = card.querySelectorAll('p')

      expect(paragraphs, person.id).toHaveLength(1)
      expect(paragraphs[0].textContent).toBe(person.role)
      expect(card.querySelectorAll('h3')).toHaveLength(1)
    }
  })

  it('publishes no telephone number', () => {
    renderPeople()

    // Not a schema field, and a group directory is not the place for personal
    // lines — the site has one shared contact address.
    expect(screen.getByRole('main').textContent).not.toMatch(
      /\(\d{3}\)\s*\d{3}-\d{4}/,
    )
  })

  it('keeps every card free of a fixed desktop width', () => {
    /*
     * Structural, not visual: cards live in one grid container, so their width
     * comes from the grid rather than from a width set on each card. That is
     * what stops the 320px overflow the previous site had with its 400px
     * minimum card width. The rendered result is checked in the browser.
     */
    renderPeople()

    for (const card of cards()) {
      /*
       * A card may carry one inline custom property — its position in the
       * reveal stagger. What it may never carry is a size: that comes from
       * the grid, which is what lets the track collapse on a narrow screen.
       */
      const inline = card.getAttribute('style') ?? ''
      expect(inline, card.textContent).not.toMatch(/(^|;)\s*(min-|max-)?width/)
      expect(card.parentElement.tagName).toBe('UL')
    }
  })

  it('takes its headings and introduction from content', () => {
    renderPeople()

    expect(screen.getByText(pages.people.intro)).toBeInTheDocument()
  })
})

describe('people in the navigation', () => {
  it('is reachable from the footer now the route exists', () => {
    renderPeople()

    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('link', { name: 'People' })).toHaveAttribute(
      'href',
      '/people',
    )
  })
})
