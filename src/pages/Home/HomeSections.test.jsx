import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { home, validateHome } from '../../content'
import { ContentError } from '../../lib/frontmatter'

/*
 * The two sections added after the rebuild: why the group does this work, and
 * who pays for it.
 *
 * Both are entirely content-driven, and that is the property most worth
 * protecting. The research question in particular must stay a question — if
 * its wording ever moves into JSX it stops being something an author can
 * correct through the CMS, and the site could drift into claiming a general
 * recognition code has been found rather than sought.
 */

const root = process.cwd()

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
}

/** Section headings in the order they appear in the document. */
function sectionOrder() {
  return Array.from(
    screen.getByRole('main').querySelectorAll('section > div > div > h2'),
  ).map((heading) => heading.textContent.trim())
}

describe('research vision', () => {
  it('appears between the hero and the TSR introduction', () => {
    renderHome()

    const order = sectionOrder()
    const vision = order.indexOf(home.researchVision.heading)
    const introduction = order.indexOf(home.introduction.heading)

    expect(vision).toBe(0) /* first section after the hero */
    expect(vision).toBeLessThan(introduction)
  })

  it('takes its heading and question from content', () => {
    renderHome()

    expect(
      screen.getByRole('heading', { level: 2, name: home.researchVision.heading }),
    ).toBeInTheDocument()
    expect(screen.getByText(home.researchVision.question)).toBeInTheDocument()
  })

  it('states the question as a question', () => {
    /*
     * Guards the one claim the site must not make. TSR is a framework for
     * investigating whether a general recognition code exists; it has not
     * found one.
     */
    expect(home.researchVision.question.trim()).toMatch(/\?$/)
    expect(home.researchVision.question).toMatch(/^Is there/i)
  })

  it('shows the short explanation and direction without expanding anything', () => {
    renderHome()

    expect(screen.getByText(home.researchVision.intro)).toBeInTheDocument()
    expect(screen.getByText(home.researchVision.direction)).toBeInTheDocument()
  })

  it('keeps the long explanation inside a closed disclosure', async () => {
    renderHome()

    const summary = screen.getByText(home.researchVision.detailsLabel)
    const details = summary.closest('details')

    expect(details).not.toBeNull()
    expect(details.open).toBe(false)

    for (const paragraph of home.researchVision.details) {
      expect(within(details).getByText(paragraph)).toBeInTheDocument()
    }

    await userEvent.click(summary)
    expect(details.open).toBe(true)
  })

  it('names the disclosure meaningfully', () => {
    renderHome()

    const summary = screen.getByText(home.researchVision.detailsLabel)
    expect(summary.tagName).toBe('SUMMARY')
    expect(summary.textContent.trim().length).toBeGreaterThan(10)
    /* Native disclosure semantics, not a button inside a summary. */
    expect(summary.querySelector('button')).toBeNull()
  })

  it('writes none of its prose in the component', () => {
    const source = readFileSync(
      resolve(root, 'src/components/home/ResearchVision.jsx'),
      'utf8',
    )

    expect(source).not.toContain(home.researchVision.question)
    expect(source).not.toContain(home.researchVision.intro)
    expect(source).not.toContain(home.researchVision.direction)
    for (const paragraph of home.researchVision.details) {
      expect(source).not.toContain(paragraph)
    }
  })
})

describe('funding and support', () => {
  it('appears between the research group and the closing section', () => {
    renderHome()

    const order = sectionOrder()
    const group = order.indexOf(home.group.heading)
    const funding = order.indexOf(home.funding.heading)
    const contact = order.indexOf(home.contact.heading)

    expect(group).toBeLessThan(funding)
    expect(funding).toBeLessThan(contact)
  })

  it('shows the funding statement and both grant numbers', () => {
    renderHome()

    const statement = screen.getByText(home.funding.primarySupport)
    expect(statement).toBeInTheDocument()
    expect(statement.textContent).toContain('1R15GM144944-01')
    expect(statement.textContent).toContain('2R15GM144944-02')
    expect(statement.textContent).toMatch(/National Institutes of Health/)
  })

  it('presents grant numbers as plain text, not as controls', () => {
    renderHome()

    const statement = screen.getByText(home.funding.primarySupport)
    expect(statement.querySelector('a')).toBeNull()
    expect(statement.querySelector('button')).toBeNull()
  })

  it('describes LONI as computing support, separately from the funder', () => {
    renderHome()

    const computing = screen.getByText(home.funding.computingSupport)
    expect(computing).toBeInTheDocument()
    expect(computing.textContent).toMatch(/computing/i)
    expect(computing.textContent).toContain('LONI')

    /*
     * The two statements are separate elements on purpose. Merged into one
     * "supported by" sentence, LONI would read as a funding agency.
     */
    const funder = screen.getByText(home.funding.primarySupport)
    expect(funder).not.toBe(computing)
    expect(funder.textContent).not.toContain('LONI')
  })

  it('keeps the acknowledgments inside a closed disclosure', () => {
    renderHome()

    const summary = screen.getByText(home.funding.acknowledgmentsLabel)
    const details = summary.closest('details')

    expect(details).not.toBeNull()
    expect(details.open).toBe(false)

    for (const paragraph of home.funding.acknowledgments) {
      expect(within(details).getByText(paragraph)).toBeInTheDocument()
    }
  })

  it('takes the acknowledged names from content', () => {
    renderHome()

    const summary = screen.getByText(home.funding.acknowledgmentsLabel)
    const text = summary.closest('details').textContent

    for (const name of ['Feng Chen', 'Le Yan', 'Thaliyah Mason']) {
      expect(text).toContain(name)
    }
  })

  it('writes none of its prose in the component', () => {
    const source = readFileSync(
      resolve(root, 'src/components/home/FundingSupport.jsx'),
      'utf8',
    )

    expect(source).not.toContain(home.funding.primarySupport)
    expect(source).not.toContain(home.funding.computingSupport)
    expect(source).not.toContain('1R15GM144944')
    for (const paragraph of home.funding.acknowledgments) {
      expect(source).not.toContain(paragraph)
    }
  })
})

describe('the home page outline is still correct', () => {
  it('has exactly one h1', () => {
    renderHome()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('skips no heading level, with the new sections in place', () => {
    renderHome()

    const levels = Array.from(
      screen.getByRole('main').querySelectorAll('h1, h2, h3, h4'),
    ).map((element) => Number(element.tagName[1]))

    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
    }
  })

  it('gives both new sections an h2 that names them', () => {
    renderHome()

    for (const heading of [home.researchVision.heading, home.funding.heading]) {
      const element = screen.getByRole('heading', { level: 2, name: heading })
      const section = element.closest('section')
      expect(section.getAttribute('aria-labelledby')).toBe(element.id)
    }
  })

  it('renders every disclosure as a real details/summary pair', () => {
    renderHome()

    const all = screen.getByRole('main').querySelectorAll('details')
    expect(all.length).toBeGreaterThanOrEqual(2)

    for (const details of all) {
      const summary = details.querySelector(':scope > summary')
      expect(summary).not.toBeNull()
      expect(summary.textContent.trim()).not.toBe('')
      /* Native semantics only — no ARIA duplicating what the element says. */
      expect(summary.getAttribute('role')).toBeNull()
      expect(summary.getAttribute('aria-expanded')).toBeNull()
    }
  })
})

describe('content validation for the new sections', () => {
  const clone = () => JSON.parse(JSON.stringify(home))

  it('rejects an empty required field', () => {
    for (const [section, field] of [
      ['researchVision', 'heading'],
      ['researchVision', 'question'],
      ['researchVision', 'intro'],
      ['researchVision', 'direction'],
      ['funding', 'heading'],
      ['funding', 'primarySupport'],
      ['funding', 'computingSupport'],
    ]) {
      const data = clone()
      data[section][field] = '   '
      expect(() => validateHome(data), `${section}.${field}`).toThrow(ContentError)
    }
  })

  it('accepts a disclosure that has been removed entirely', () => {
    /*
     * An editor who clears the acknowledgments should get a shorter section,
     * not a build failure and not a button that opens onto nothing.
     */
    const data = clone()
    data.funding.acknowledgmentsLabel = ''
    data.funding.acknowledgments = []

    expect(() => validateHome(data)).not.toThrow()
  })

  it('rejects a label with nothing behind it', () => {
    const data = clone()
    data.researchVision.details = []
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects paragraphs with no label to reveal them', () => {
    const data = clone()
    data.funding.acknowledgmentsLabel = ''
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects a blank entry inside a list', () => {
    /* The CMS list widget adds an empty row the moment "add" is clicked. */
    const data = clone()
    data.researchVision.details = [...data.researchVision.details, '  ']
    expect(() => validateHome(data)).toThrow(ContentError)
  })
})
