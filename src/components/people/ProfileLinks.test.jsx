import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileLinks from './ProfileLinks'
import { EVENTS, trackEvent } from '../../lib/analytics'

/*
 * The profile icons, against FIXTURES rather than the real group.
 *
 * Deliberate: nobody in the group has a Scholar or LinkedIn address on record
 * yet — none will be invented to make a test pass — so the only way to cover
 * "an icon appears when the link exists" is with people made up here. These
 * fixtures also let the test say what a *partly* filled record does, which is
 * the case that produces a dead icon if anyone gets it wrong.
 */
vi.mock('../../lib/analytics', async (importOriginal) => ({
  ...(await importOriginal()),
  trackEvent: vi.fn(() => true),
}))

const complete = {
  id: 'ada-lovelace',
  name: 'Ada Lovelace',
  role: 'Doctoral Researcher — Computing',
  email: 'ada@example.edu',
  scholar: 'https://scholar.google.com/citations?user=Example',
  linkedin: 'https://www.linkedin.com/in/example',
}

const emailOnly = { id: 'grace-hopper', name: 'Grace Hopper', email: 'grace@example.edu' }
const scholarOnly = {
  id: 'alan-turing',
  name: 'Alan Turing',
  scholar: 'https://scholar.google.co.uk/citations?user=Example',
}
const nothing = { id: 'no-links', name: 'Nobody Reachable' }

const linkNames = () =>
  screen.getAllByRole('link').map((link) => link.getAttribute('aria-label'))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('profile icons', () => {
  it('shows one icon per link the person actually has', () => {
    render(<ProfileLinks person={complete} />)

    expect(linkNames()).toEqual([
      'Email Ada Lovelace',
      'Google Scholar profile of Ada Lovelace (opens in a new tab)',
      'LinkedIn profile of Ada Lovelace (opens in a new tab)',
    ])
  })

  it('shows only the icons a partly filled record justifies', () => {
    const { unmount } = render(<ProfileLinks person={emailOnly} />)
    expect(linkNames()).toEqual(['Email Grace Hopper'])
    unmount()

    render(<ProfileLinks person={scholarOnly} />)
    expect(linkNames()).toEqual([
      'Google Scholar profile of Alan Turing (opens in a new tab)',
    ])
  })

  it('renders nothing at all when there is nothing to link to', () => {
    const { container } = render(<ProfileLinks person={nothing} />)

    /* Not an empty list, and not a row of greyed-out icons: nothing. */
    expect(container).toBeEmptyDOMElement()
  })

  it('points each icon at the right address', () => {
    render(<ProfileLinks person={complete} />)

    expect(screen.getByRole('link', { name: /^Email/ })).toHaveAttribute(
      'href',
      'mailto:ada@example.edu',
    )
    expect(screen.getByRole('link', { name: /^Google Scholar/ })).toHaveAttribute(
      'href',
      complete.scholar,
    )
    expect(screen.getByRole('link', { name: /^LinkedIn/ })).toHaveAttribute(
      'href',
      complete.linkedin,
    )
  })

  it('opens external profiles in a new tab, safely; mail in the same one', () => {
    render(<ProfileLinks person={complete} />)

    for (const name of [/^Google Scholar/, /^LinkedIn/]) {
      const link = screen.getByRole('link', { name })
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }

    const mail = screen.getByRole('link', { name: /^Email/ })
    expect(mail).not.toHaveAttribute('target')
  })

  it('hides the glyph itself from assistive technology', () => {
    /* The link is named; the icon inside it must not be announced as well. */
    render(<ProfileLinks person={complete} />)

    for (const link of screen.getAllByRole('link')) {
      const icon = link.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(icon).toHaveAttribute('focusable', 'false')
      expect(link.textContent).toBe('')
    }
  })

  it('stays reachable and operable from the keyboard', async () => {
    render(<ProfileLinks person={complete} />)

    await userEvent.tab()
    expect(screen.getByRole('link', { name: /^Email/ })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('link', { name: /^Google Scholar/ })).toHaveFocus()
  })
})

describe('what a profile click reports', () => {
  it('sends the person’s id and which link it was', async () => {
    render(<ProfileLinks person={complete} />)

    await userEvent.click(screen.getByRole('link', { name: /^Google Scholar/ }))

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(EVENTS.profileLink, {
      person_id: 'ada-lovelace',
      profile_type: 'scholar',
    })
  })

  it('never sends an address or a name', async () => {
    /*
     * The rule for every custom parameter on this site: stable content ids
     * only. Sending the address would hand a third party exactly what the
     * icon was introduced to stop publishing in plain text.
     */
    render(<ProfileLinks person={complete} />)

    await userEvent.click(screen.getByRole('link', { name: /^Email/ }))

    const [, parameters] = trackEvent.mock.calls[0]
    const sent = JSON.stringify(parameters)

    expect(sent).not.toContain(complete.email)
    expect(sent).not.toContain(complete.name)
    expect(sent).not.toContain(complete.linkedin)
    expect(parameters).toEqual({
      person_id: 'ada-lovelace',
      profile_type: 'email',
    })
  })

  it('still follows the link when analytics cannot report', async () => {
    /*
     * The failure that actually happens: an extension blocks the request, or
     * gtag never loaded, and the call reports false. The link must behave as
     * though the handler were not there — nothing cancelled, nothing waited
     * for. (That the module itself never throws, whatever gtag does, is
     * asserted where the module is tested.)
     */
    trackEvent.mockReturnValue(false)

    render(<ProfileLinks person={complete} />)
    const link = screen.getByRole('link', { name: /^Email/ })

    let seen = null
    link.addEventListener('click', (event) => {
      seen = event.defaultPrevented
      event.preventDefault() /* jsdom cannot navigate */
    })

    await userEvent.click(link)

    expect(seen).toBe(false)
    expect(link).toHaveAttribute('href', 'mailto:ada@example.edu')
  })
})
