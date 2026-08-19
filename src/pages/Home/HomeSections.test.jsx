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
     *
     * Structure only: the sentence must be interrogative. Which question is
     * asked, and in whose words, is the group's to change — an assertion on
     * its opening words would have made sharpening the wording a code change.
     */
    expect(home.researchVision.question.trim()).toMatch(/\?$/)
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
  /** The disclosure inside the funding section, found by its section. */
  function fundingDetails() {
    const heading = screen.getByRole('heading', {
      level: 2,
      name: home.funding.heading,
    })
    return heading.closest('section').querySelector('details')
  }

  it('appears between the research group and the closing section', () => {
    renderHome()

    const order = sectionOrder()
    const group = order.indexOf(home.group.heading)
    const funding = order.indexOf(home.funding.heading)
    const contact = order.indexOf(home.contact.heading)

    expect(group).toBeLessThan(funding)
    expect(funding).toBeLessThan(contact)
  })

  it('shows the funding statement exactly as it is written in content', () => {
    /*
     * No assertion about which funder or which award this sentence names.
     * Awards change, and the point of the section is that changing them is an
     * edit in the CMS rather than a change to this file.
     */
    renderHome()

    const statement = screen.getByText(home.funding.primarySupport)
    expect(statement).toBeInTheDocument()
    expect(statement.tagName).toBe('P')
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

  it('keeps the funding detail inside a closed disclosure', () => {
    renderHome()

    const details = fundingDetails()

    expect(details).not.toBeNull()
    expect(details.open).toBe(false)
  })

  it('opens the disclosure on activation, with no JavaScript accordion', async () => {
    renderHome()

    const details = fundingDetails()
    const summary = within(details).getByText(home.funding.detailsLabel)

    expect(summary.tagName).toBe('SUMMARY')
    await userEvent.click(summary)
    expect(details.open).toBe(true)
  })

  it('renders every award as a funder, its investigators and its number', () => {
    /*
     * Driven entirely by the records in home.json. Rename an investigator or
     * add an award in the CMS and this test follows it; nothing here needs a
     * developer, which is precisely what broke before.
     */
    renderHome()

    const details = fundingDetails()

    for (const award of home.funding.awards) {
      expect(
        within(details).getAllByRole('heading', { name: award.funder }).length,
        award.grant,
      ).toBeGreaterThan(0)
      expect(within(details).getAllByText(award.investigators).length)
        .toBeGreaterThan(0)
      expect(within(details).getAllByText(award.grant).length).toBeGreaterThan(0)
    }
  })

  it('gives each funder one heading, however many awards it holds', () => {
    /*
     * The grouping the editor does not have to do. Two awards from the same
     * organisation are two CMS rows and one heading on the page.
     */
    renderHome()

    const details = fundingDetails()
    const funders = home.funding.awards.map((award) => award.funder)

    for (const funder of new Set(funders)) {
      expect(
        within(details).getAllByRole('heading', { name: funder }),
        funder,
      ).toHaveLength(1)
    }
  })

  it('presents award numbers as plain text, not as links', () => {
    renderHome()

    const details = fundingDetails()

    for (const award of home.funding.awards) {
      for (const element of within(details).getAllByText(award.grant)) {
        expect(element.closest('a')).toBeNull()
        expect(element.closest('button')).toBeNull()
      }
    }
  })

  it('renders the acknowledgments as prose under their own heading', () => {
    renderHome()

    const details = fundingDetails()

    expect(
      within(details).getByRole('heading', {
        name: home.funding.acknowledgmentsHeading,
      }),
    ).toBeInTheDocument()

    for (const paragraph of home.funding.acknowledgments) {
      const element = within(details).getByText(paragraph)
      expect(element.tagName).toBe('P')
    }
  })

  it('needs no line breaks in any editorial field to produce that structure', () => {
    /*
     * The regression this whole hotfix exists for. The structure above comes
     * from separate fields, so no editor should ever have to fake a heading
     * or a list with newlines inside a text box.
     */
    const { awards, acknowledgments, primarySupport, computingSupport } =
      home.funding

    for (const award of awards) {
      for (const value of Object.values(award)) {
        expect(value, JSON.stringify(award)).not.toMatch(/\n/)
      }
    }
    for (const text of [primarySupport, computingSupport, ...acknowledgments]) {
      expect(text).not.toMatch(/\n/)
    }
  })

  it('writes none of its prose in the component', () => {
    const source = readFileSync(
      resolve(root, 'src/components/home/FundingSupport.jsx'),
      'utf8',
    )

    expect(source).not.toContain(home.funding.primarySupport)
    expect(source).not.toContain(home.funding.computingSupport)
    for (const paragraph of home.funding.acknowledgments) {
      expect(source).not.toContain(paragraph)
    }
    /* Not one funder, investigator or award number is written in the JSX. */
    for (const award of home.funding.awards) {
      for (const value of Object.values(award)) {
        expect(source, value).not.toContain(value)
      }
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
     * An editor who clears the funding detail should get a shorter section,
     * not a build failure and not a button that opens onto nothing.
     */
    const data = clone()
    data.funding.detailsLabel = ''
    data.funding.awards = []
    data.funding.acknowledgmentsHeading = ''
    data.funding.acknowledgments = []

    expect(() => validateHome(data)).not.toThrow()
  })

  it('accepts awards with no acknowledgments, and the reverse', () => {
    const withoutThanks = clone()
    withoutThanks.funding.acknowledgmentsHeading = ''
    withoutThanks.funding.acknowledgments = []
    expect(() => validateHome(withoutThanks), 'awards only').not.toThrow()

    const withoutAwards = clone()
    withoutAwards.funding.awards = []
    expect(() => validateHome(withoutAwards), 'acknowledgments only').not.toThrow()
  })

  it('rejects a label with nothing behind it', () => {
    const data = clone()
    data.researchVision.details = []
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects funding detail with no label to reveal it', () => {
    const data = clone()
    data.funding.detailsLabel = ''
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects a funding label with nothing behind it', () => {
    const data = clone()
    data.funding.awards = []
    data.funding.acknowledgmentsHeading = ''
    data.funding.acknowledgments = []
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects acknowledgments with no heading, and a heading with none', () => {
    const orphanProse = clone()
    orphanProse.funding.acknowledgmentsHeading = '  '
    expect(() => validateHome(orphanProse)).toThrow(ContentError)

    const orphanHeading = clone()
    orphanHeading.funding.acknowledgments = []
    expect(() => validateHome(orphanHeading)).toThrow(ContentError)
  })

  it('rejects an award that is missing any of its three facts', () => {
    for (const field of ['funder', 'investigators', 'grant']) {
      const data = clone()
      data.funding.awards[0][field] = '   '
      expect(() => validateHome(data), field).toThrow(ContentError)

      const removed = clone()
      delete removed.funding.awards[0][field]
      expect(() => validateHome(removed), `missing ${field}`).toThrow(ContentError)
    }
  })

  it('rejects an empty award row, however the CMS produced it', () => {
    /* "Add award" then Save, with nothing typed in. */
    for (const row of [{}, '', null, 'NIH — some grant', ['NIH']]) {
      const data = clone()
      data.funding.awards = [...data.funding.awards, row]
      expect(() => validateHome(data), JSON.stringify(row)).toThrow(ContentError)
    }
  })

  it('rejects awards that are not a list at all', () => {
    const data = clone()
    data.funding.awards = 'NIH — 2R15GM144944-02'
    expect(() => validateHome(data)).toThrow(ContentError)
  })

  it('rejects a blank entry inside a list', () => {
    /* The CMS list widget adds an empty row the moment "add" is clicked. */
    const data = clone()
    data.researchVision.details = [...data.researchVision.details, '  ']
    expect(() => validateHome(data)).toThrow(ContentError)
  })
})

describe('an ordinary CMS edit does not need a developer', () => {
  /*
   * The test this hotfix exists to add.
   *
   * Every value below is editorial: a funder, an investigator, an award
   * number, the prose around them. All of it changes when an award ends or a
   * student joins, and none of it should ever fail a build or send anyone to
   * a test file. If this test starts failing, the content model has grown a
   * dependency on today's wording again — which is the fault it guards.
   */
  const edited = () => {
    const data = JSON.parse(JSON.stringify(home))

    data.funding.heading = 'Funding and support'
    data.funding.primarySupport =
      'This work is supported by the National Science Foundation and by a ' +
      'new institutional award.'
    data.funding.computingSupport =
      'Computation runs on a departmental cluster.'
    data.funding.detailsLabel = 'Awards and thanks'
    data.funding.awards = [
      {
        funder: 'National Science Foundation',
        investigators: 'A New Investigator',
        grant: 'NSF-0000000',
      },
      {
        funder: 'National Science Foundation',
        investigators: 'A New Investigator and A Second One',
        grant: 'NSF-1111111',
      },
      {
        funder: 'Some Other Foundation',
        investigators: 'Someone Else',
        grant: 'SOF/2030/17',
      },
    ]
    data.funding.acknowledgmentsHeading = 'With thanks'
    data.funding.acknowledgments = [
      'We thank the cluster team for their help.',
      'We thank a second group of people, in a second paragraph.',
    ]

    data.researchVision.question = 'Does molecular recognition follow rules?'
    data.researchVision.direction = 'A different long-term direction.'
    data.researchVision.details = ['One rewritten paragraph.']

    return data
  }

  it('accepts rewritten funding wording, funders, names and numbers', () => {
    expect(() => validateHome(edited())).not.toThrow()
  })

  it('accepts an award being added to an existing funder', () => {
    const data = edited()
    data.funding.awards.push({
      funder: 'National Science Foundation',
      investigators: 'A Third Investigator',
      grant: 'NSF-2222222',
    })

    expect(() => validateHome(data)).not.toThrow()
  })

  it('accepts the whole funding detail being cleared', () => {
    const data = edited()
    data.funding.detailsLabel = ''
    data.funding.awards = []
    data.funding.acknowledgmentsHeading = ''
    data.funding.acknowledgments = []

    expect(() => validateHome(data)).not.toThrow()
  })

  it('still refuses malformed structure in that edited content', () => {
    const blankField = edited()
    blankField.funding.awards[0].grant = ''
    expect(() => validateHome(blankField), 'blank grant').toThrow(ContentError)

    const emptyRow = edited()
    emptyRow.funding.awards.push({})
    expect(() => validateHome(emptyRow), 'empty row').toThrow(ContentError)

    const notARecord = edited()
    notARecord.funding.awards.push('NSF — NSF-3333333')
    expect(() => validateHome(notARecord), 'string award').toThrow(ContentError)

    const blankParagraph = edited()
    blankParagraph.funding.acknowledgments.push('   ')
    expect(() => validateHome(blankParagraph), 'blank prose').toThrow(ContentError)

    const missingStatement = edited()
    missingStatement.funding.primarySupport = ''
    expect(() => validateHome(missingStatement), 'no statement').toThrow(
      ContentError,
    )
  })
})
