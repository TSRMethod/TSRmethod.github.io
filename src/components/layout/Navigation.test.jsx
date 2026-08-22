import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import { setViewport } from '../../test/viewport'
import { isRouteImplemented } from '../../app/routeRegistry'
import { siteConfig } from '../../app/siteConfig'

/*
 * The navigation components are tested against fixture data rather than the
 * live content registry. The live menu legitimately shrinks and grows as
 * pages are migrated, and these tests are about keyboard and screen reader
 * behaviour, which must not change when it does.
 *
 * Whether an item appears in the real menu at all is decided by
 * `getVisibleNavigation`, covered separately in app/navigation.test.js.
 */
const items = [
  { id: 'home', label: 'Home', to: '/' },
  {
    id: 'methods',
    label: 'TSR-Based Methods',
    groups: [
      {
        id: 'one-molecule',
        label: 'One Molecule',
        items: [
          { id: 'mirror', label: 'Mirror-Image TSR', to: '/methods/mirror-image' },
          { id: 'sse', label: 'SSE-TSR', to: '/methods/sse-tsr' },
        ],
      },
      {
        id: 'two-molecules',
        label: 'Two Molecules',
        items: [{ id: 'drug', label: 'DrugTSR', to: '/methods/drug-tsr' }],
      },
    ],
  },
  {
    id: 'analysis',
    label: 'Key Analysis & Visualization',
    groups: [
      {
        id: 'key-analysis',
        label: 'Analysis',
        items: [
          { id: 'common', label: 'Common Keys', to: '/analysis/common-keys' },
        ],
      },
    ],
  },
  { id: 'publications', label: 'Publications', to: '/publications' },
  {
    id: 'about',
    label: 'About',
    groups: [
      {
        id: 'about-group',
        label: 'About the group',
        items: [{ id: 'people', label: 'People', to: '/people' }],
      },
    ],
  },
]

function renderDesktop(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DesktopNav items={items} />
    </MemoryRouter>,
  )
}

function renderMobile(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <MobileNav items={items} />
    </MemoryRouter>,
  )
}

describe('desktop navigation', () => {
  it('renders top-level links and dropdown triggers', () => {
    renderDesktop()
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(
      within(nav).getByRole('button', { name: /TSR-Based Methods/ }),
    ).toBeInTheDocument()
  })

  it('uses a button with aria-expanded and aria-controls for dropdowns', () => {
    renderDesktop()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls', 'nav-methods-panel')
  })

  it('does not render dropdown links until the menu is opened', () => {
    renderDesktop()

    expect(
      screen.queryByRole('link', { name: 'Mirror-Image TSR' }),
    ).not.toBeInTheDocument()
  })

  it('opens on click and exposes the panel it controls', async () => {
    const user = userEvent.setup()
    renderDesktop()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById('nav-methods-panel')
    expect(
      within(panel).getByRole('link', { name: 'Mirror-Image TSR' }),
    ).toBeInTheDocument()
  })

  it('names each group list so a screen reader announces it', async () => {
    const user = userEvent.setup()
    renderDesktop()

    await user.click(screen.getByRole('button', { name: /TSR-Based Methods/ }))

    expect(
      screen.getByRole('list', { name: 'One Molecule' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('list', { name: 'Two Molecules' }),
    ).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    renderDesktop()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('opens with ArrowDown and moves focus to the first link', async () => {
    const user = userEvent.setup()
    renderDesktop()
    const trigger = screen.getByRole('button', { name: /Key Analysis/ })

    trigger.focus()
    await user.keyboard('{ArrowDown}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // Asserted directly rather than with expect.poll: retrying here would hide
    // a focus call that lands one commit too early, which is exactly the bug
    // this test exists to catch.
    expect(screen.getByRole('link', { name: 'Common Keys' })).toHaveFocus()
  })

  it('keeps only one dropdown open at a time', async () => {
    const user = userEvent.setup()
    renderDesktop()
    const methods = screen.getByRole('button', { name: /TSR-Based Methods/ })
    const about = screen.getByRole('button', { name: /About/ })

    await user.click(methods)
    await user.click(about)

    expect(methods).toHaveAttribute('aria-expanded', 'false')
    expect(about).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('mobile navigation', () => {
  it('collapses everything behind one toggle button', () => {
    renderMobile()

    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(
      screen.queryByRole('link', { name: 'Publications' }),
    ).not.toBeInTheDocument()
  })

  it('renders the open drawer outside the header, not inside it', async () => {
    /*
     * THE STAGE 10 REGRESSION, in one assertion.
     *
     * `position: fixed` resolves against the viewport only while no ancestor
     * establishes a containing block, and the scrolled header's
     * `backdrop-filter` does establish one. Nested inside the header, the
     * drawer and its scrim were sized against the header's 73px box — a
     * strip of dark overlay across the top of the page with most of the menu
     * clipped away.
     *
     * The drawer is therefore portalled to <body>. This asserts the
     * structural property that fix depends on, so nobody can move it back
     * under the header — where it would look correct until someone scrolls.
     */
    const user = userEvent.setup()
    /* The whole shell, because the header is what the drawer must escape. */
    setViewport('mobile')
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Site menu' })
    const header = screen
      .getAllByRole('banner')
      .find((element) => !element.closest('main'))

    expect(header).toBeTruthy()
    expect(header.contains(drawer)).toBe(false)
    expect(drawer.parentElement).toBe(document.body)

    /* The scrim has to escape with it, or it is the strip instead. */
    const backdrop = drawer.previousElementSibling
    expect(backdrop).toBeTruthy()
    expect(header.contains(backdrop)).toBe(false)

    /* The button that owns it stays in the header, and still owns it: the
       association is by id, which does not care about the DOM distance. */
    const toggle = screen.getByRole('button', { name: 'Close' })
    expect(header.contains(toggle)).toBe(true)
    expect(document.getElementById(toggle.getAttribute('aria-controls'))).toBe(
      drawer,
    )
  })

  it('restores focus without letting the browser scroll the page', async () => {
    /*
     * The whole of the fix, in the one place jsdom can actually see it.
     *
     * `focus()` asks the browser to reveal the element, and revealing it
     * means scrolling the document — which is why closing the menu used to
     * nudge the page upwards. The toggle is in a sticky header and is
     * already on screen, so the request is never wanted. jsdom has no
     * viewport and cannot model the scrolling itself, but it can hold this
     * component to the contract that prevents it.
     */
    const user = userEvent.setup()
    renderMobile()

    const toggle = screen.getByRole('button', { name: 'Menu' })
    const focus = vi.spyOn(toggle, 'focus')

    await user.click(toggle)
    await user.keyboard('{Escape}')

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
  })

  it('asks for the same treatment however the drawer is dismissed', async () => {
    const user = userEvent.setup()
    renderMobile()

    for (const dismiss of [
      async () => user.click(screen.getByRole('button', { name: 'Close' })),
      async () => {
        /* The scrim, which is presentational and has no accessible name. */
        const drawer = screen.getByRole('dialog')
        await user.click(drawer.previousElementSibling)
      },
    ]) {
      const toggle = screen.getByRole('button', { name: 'Menu' })
      const focus = vi.spyOn(toggle, 'focus')

      await user.click(toggle)
      await dismiss()

      expect(focus).toHaveBeenCalledWith({ preventScroll: true })
      focus.mockRestore()
    }
  })

  it('puts the page back if unlocking it moved the page', async () => {
    /*
     * Taking `overflow: hidden` off a scrolled document is a layout change,
     * and a browser may settle the scroll position differently afterwards.
     * The component compares and corrects; here the browser is made to
     * misbehave on purpose so the correction can be observed.
     */
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    /*
     * The page reads as 1500 while the user is dismissing, and as 1460 once
     * the lock has been taken off — which is the slip, expressed as the only
     * thing the component can actually observe.
     */
    let reads = 0
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => (reads++ === 0 ? 1500 : 1460),
    })

    renderMobile()
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.keyboard('{Escape}')

    expect(scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 1500, behavior: 'instant' }),
    )

    scrollTo.mockRestore()
    delete window.scrollY
  })

  it('leaves a well-behaved browser alone', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => 900,
    })

    renderMobile()
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.keyboard('{Escape}')

    /* The position never moved, so nothing is corrected. */
    expect(scrollTo).not.toHaveBeenCalled()

    scrollTo.mockRestore()
    delete window.scrollY
  })

  it('leaves the scroll position alone when a link was followed', async () => {
    /*
     * The case this must not touch. Following a link closes the drawer too,
     * but there the reader is going somewhere new and ScrollToTop takes them
     * to the top of it. Restoring the old offset would undo that.
     */
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      get: () => 1200,
    })

    renderMobile()
    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const drawer = screen.getByRole('dialog')
    await user.click(within(drawer).getByRole('link', { name: 'Publications' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(scrollTo).not.toHaveBeenCalledWith(
      expect.objectContaining({ top: 1200 }),
    )

    scrollTo.mockRestore()
    delete window.scrollY
  })

  it('leaves nothing of the drawer behind after it closes', async () => {
    /* A portal that is not cleaned up is a scrim nobody can remove. */
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.querySelector('[aria-modal="true"]')).toBeNull()
  })

  it('opens a modal drawer and moves focus into it', async () => {
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Site menu' })
    expect(drawer).toHaveAttribute('aria-modal', 'true')
    expect(drawer).toContainElement(document.activeElement)
  })

  it('locks background scrolling while open and releases it after', async () => {
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(document.body).toHaveStyle({ overflow: 'hidden' })

    await user.keyboard('{Escape}')
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
  })

  it('closes on Escape and returns focus to the toggle', async () => {
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
  })

  it('expands a section with an accessible accordion button', async () => {
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const section = screen.getByRole('button', { name: /TSR-Based Methods/ })
    expect(section).toHaveAttribute('aria-expanded', 'false')
    expect(section).toHaveAttribute('aria-controls', 'mobile-nav-methods-panel')

    await user.click(section)

    expect(section).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('link', { name: 'Mirror-Image TSR' }),
    ).toBeInTheDocument()
  })

  it('closes the drawer after following a link', async () => {
    const user = userEvent.setup()
    renderMobile()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Site menu' })
    await user.click(within(drawer).getByRole('link', { name: 'Publications' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})

describe('page layout', () => {
  beforeEach(() => setViewport('desktop'))

  function renderApp(path = '/') {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
  }

  it('provides a skip link pointing at the main landmark', () => {
    renderApp()

    expect(
      screen.getByRole('link', { name: /skip to main content/i }),
    ).toHaveAttribute('href', '#main')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main')
  })

  it('does not move focus into main on first load', () => {
    renderApp()

    /*
     * Regression guard. ScrollToTop focuses <main> after a navigation, but
     * doing it on the initial render moves the sequential focus starting
     * point past the header, so the user's first Tab lands in the page body
     * and the skip link and navigation become unreachable by keyboard.
     */
    expect(screen.getByRole('main')).not.toHaveFocus()
    expect(document.activeElement).toBe(document.body)
  })

  it('renders banner, main and contentinfo landmarks exactly once', () => {
    renderApp()

    expect(screen.getAllByRole('banner')).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
  })

  it('shows the group email in the footer', () => {
    renderApp()

    // Scoped to the footer: the home page's closing section shows the same
    // address, and both come from the one value in site.json.
    const footer = within(screen.getByRole('contentinfo'))

    expect(
      footer.getByRole('link', { name: 'tsrresearchgroup@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:tsrresearchgroup@gmail.com')
  })

  it('does not duplicate element ids across the document', () => {
    renderApp()

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('the footer', () => {
  beforeEach(() => setViewport('desktop'))

  function renderApp(path = '/') {
    return render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )
  }

  it('has no dead internal link', () => {
    renderApp()

    const footer = screen.getByRole('contentinfo')
    const internal = Array.from(footer.querySelectorAll('a[href^="/"]')).map(
      (link) => link.getAttribute('href'),
    )

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), href).toBe(true)
    }
  })

  it('links to every hand-built page now they all exist', () => {
    renderApp()

    const footer = within(screen.getByRole('contentinfo'))
    for (const [name, href] of [
      ['TSR Method', '/tsr'],
      ['Software', '/software'],
      ['Publications', '/publications'],
      ['People', '/people'],
      ['Contact', '/contact'],
    ]) {
      expect(footer.getByRole('link', { name }), name).toHaveAttribute(
        'href',
        href,
      )
    }
  })

  it('separates a website problem from a problem with the research code', () => {
    /*
     * The footer's issue link is this repository's tracker, which is for the
     * pages themselves. A bug in the research code belongs on the repository
     * that provides it, and /software carries that link per entry — so the
     * label has to say which one this is.
     */
    renderApp()

    const footer = within(screen.getByRole('contentinfo'))
    const link = footer.getByRole('link', { name: /website problem/i })

    expect(link).toHaveAttribute(
      'href',
      'https://github.com/TSRMethod/TSRmethod.github.io/issues',
    )
  })

  it('shows the tagline from site content, not a copy of it', () => {
    renderApp()

    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByText(siteConfig.tagline)).toBeInTheDocument()
  })
})
