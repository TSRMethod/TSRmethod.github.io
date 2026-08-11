import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import { setViewport } from '../../test/viewport'

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

    expect(
      screen.getByRole('link', { name: 'tsrresearchgroup@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:tsrresearchgroup@gmail.com')
  })

  it('does not duplicate element ids across the document', () => {
    renderApp()

    const ids = Array.from(document.querySelectorAll('[id]')).map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
