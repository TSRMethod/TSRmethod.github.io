import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { setViewport } from '../../test/viewport'
import { siteConfig } from '../../app/siteConfig'
import { splitName } from '../brand/wordmark'

/*
 * The header's scrolled state.
 *
 * It is a visual state and nothing else: the same links, the same names, the
 * same keyboard path through the bar, before and after the page moves. These
 * tests assert exactly that, because a header that rearranged itself on scroll
 * would be a navigation regression dressed up as polish.
 */

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/*
 * The site header, told apart from a page's own <header> element. In a
 * browser only this one is a banner — the ARIA mapping scopes the role out
 * inside <main> — but the role computation used in tests does not apply that
 * scoping, so the distinction is made here explicitly.
 */
const header = () =>
  screen.getAllByRole('banner').find((element) => !element.closest('main'))

/** Move the page and let the header's rAF-coalesced listener catch up. */
function scrollTo(y) {
  act(() => {
    window.scrollY = y
    window.dispatchEvent(new Event('scroll'))
  })
}

beforeEach(() => {
  window.scrollY = 0
  /*
   * jsdom has no rendering loop, so requestAnimationFrame never fires on its
   * own. Running the callback immediately is what the browser does a frame
   * later, and it keeps the coalescing logic itself under test.
   */
  window.requestAnimationFrame = (callback) => {
    callback()
    return 1
  }
  window.cancelAnimationFrame = () => {}
})

describe('the sticky header', () => {
  it('starts in its plain state at the top of the page', () => {
    renderApp()
    expect(header()).not.toHaveAttribute('data-scrolled')
  })

  it('takes its scrolled state once the page has moved', () => {
    renderApp()

    scrollTo(120)
    expect(header()).toHaveAttribute('data-scrolled')
  })

  it('returns to its plain state back at the top', () => {
    renderApp()

    scrollTo(120)
    scrollTo(0)
    expect(header()).not.toHaveAttribute('data-scrolled')
  })

  it('ignores a movement too small to mean anything', () => {
    renderApp()

    scrollTo(4)
    expect(header()).not.toHaveAttribute('data-scrolled')
  })

  it('is already scrolled when the page loads part-way down', () => {
    /* A reload half-way through a method page, or a link with a hash. */
    window.scrollY = 600
    renderApp()

    expect(header()).toHaveAttribute('data-scrolled')
  })

  it('keeps the same navigation, named the same way, in both states', () => {
    setViewport('desktop')
    renderApp()

    const before = within(header())
      .getAllByRole('link')
      .map((link) => link.textContent)

    scrollTo(400)

    const after = within(header())
      .getAllByRole('link')
      .map((link) => link.textContent)

    expect(after).toEqual(before)
    expect(within(header()).getByRole('navigation', { name: 'Main' }))
      .toBeInTheDocument()
  })

  it('keeps the home link reachable and named after the group', () => {
    setViewport('desktop')
    renderApp()

    scrollTo(400)

    const home = within(header()).getAllByRole('link')[0]
    expect(home).toHaveAttribute('href', '/')
    expect(home).toHaveAccessibleName()
  })

  it('still opens the mobile drawer after scrolling', async () => {
    setViewport('mobile')
    renderApp()

    scrollTo(400)

    const toggle = within(header()).getByRole('button', { name: /menu/i })
    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('the group\'s symbol and wordmark', () => {
  it('names the home link once, by the group\'s name, with the symbol hidden', () => {
    setViewport('desktop')
    renderApp()

    const home = within(header()).getAllByRole('link')[0]
    /* "TSR Research Group", not "TSR Research Group TSR Research Group". */
    expect(home).toHaveAccessibleName(siteConfig.name)
    const symbol = home.querySelector('svg')
    expect(symbol).toHaveAttribute('aria-hidden', 'true')
    expect(symbol).toHaveAttribute('focusable', 'false')
    expect(home.querySelector('img')).toBeNull()
  })

  it('sets the short name apart as the wordmark\'s lead', () => {
    setViewport('desktop')
    renderApp()

    const home = within(header()).getAllByRole('link')[0]
    const lead = within(home).getByText(siteConfig.shortName)
    expect(lead.tagName).toBe('SPAN')
    expect(lead.parentElement).toHaveTextContent(siteConfig.name)
  })

  it('draws the full symbol, θ sector included, in the theme\'s colours', () => {
    renderApp()
    const symbol = within(header()).getAllByRole('link')[0].querySelector('svg')
    expect(symbol).toHaveAttribute('data-version', 'full')
    expect(symbol).toHaveAttribute('data-tone', 'colour')
    expect(symbol.querySelectorAll('path')).toHaveLength(3)
  })
})

describe('splitName', () => {
  it('splits off the short name only when the full name starts with it', () => {
    expect(splitName('TSR Research Group', 'TSR')).toEqual({ lead: 'TSR', rest: 'Research Group' })
    expect(splitName('Another Group', 'TSR')).toEqual({ lead: null, rest: 'Another Group' })
    expect(splitName('TSRX Group', 'TSR')).toEqual({ lead: null, rest: 'TSRX Group' })
    expect(splitName('TSR Research Group', '')).toEqual({ lead: null, rest: 'TSR Research Group' })
  })
})

describe('the current page indicator', () => {
  it('marks the page being viewed, and only that one', () => {
    setViewport('desktop')
    renderApp('/publications')

    const current = within(header()).getByRole('link', { name: 'Publications' })
    /*
     * NavLink's own aria-current is what a screen reader uses; the animated
     * underline is decoration on top of it and is not what is asserted here.
     */
    expect(current).toHaveAttribute('aria-current', 'page')

    const marked = within(header())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
    expect(marked).toHaveLength(1)
  })
})
