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
      expect(link.textContent.trim()).not.toBe('')
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

    for (const card of screen.getByRole('main').querySelectorAll('li')) {
      expect(card.getAttribute('style')).toBeNull()
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
