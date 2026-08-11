import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { navigation, getVisibleNavigation } from '../../app/navigation'
import { setViewport } from '../../test/viewport'

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('navigation data', () => {
  it('drops draft items from the visible navigation', () => {
    const visible = getVisibleNavigation()
    const methods = visible.find((item) => item.id === 'methods')
    const labels = methods.groups.flatMap((group) =>
      group.items.map((item) => item.label),
    )

    expect(labels).toContain('Mirror-Image TSR')
    expect(labels).not.toContain('CrossTSR')
    expect(labels).not.toContain('Metal-Ion TSR')
  })

  it('drops a group once all of its items are draft', () => {
    const visible = getVisibleNavigation([
      {
        id: 'x',
        label: 'X',
        groups: [
          {
            id: 'g',
            label: 'G',
            items: [{ id: 'a', label: 'A', to: '/a', status: 'draft' }],
          },
        ],
      },
    ])

    expect(visible).toEqual([])
  })
})

describe('desktop navigation', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders top-level links and dropdown triggers', () => {
    renderApp()
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(within(nav).getByRole('link', { name: 'Home' })).toBeInTheDocument()
    expect(
      within(nav).getByRole('button', { name: /TSR-Based Methods/ }),
    ).toBeInTheDocument()
  })

  it('uses a button with aria-expanded and aria-controls for dropdowns', () => {
    renderApp()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveAttribute('aria-controls', 'nav-methods-panel')
  })

  it('does not render dropdown links until the menu is opened', () => {
    renderApp()

    expect(
      screen.queryByRole('link', { name: 'Mirror-Image TSR' }),
    ).not.toBeInTheDocument()
  })

  it('opens on click and exposes the panel it controls', async () => {
    const user = userEvent.setup()
    renderApp()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const panel = document.getElementById('nav-methods-panel')
    expect(panel).toBeInTheDocument()
    expect(
      within(panel).getByRole('link', { name: 'Mirror-Image TSR' }),
    ).toBeInTheDocument()
  })

  it('names each group list so a screen reader announces it', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: /TSR-Based Methods/ }))

    expect(
      screen.getByRole('list', { name: 'One Molecule' }),
    ).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    renderApp()
    const trigger = screen.getByRole('button', { name: /TSR-Based Methods/ })

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('opens with ArrowDown and moves focus to the first link', async () => {
    const user = userEvent.setup()
    renderApp()
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
    renderApp()
    const methods = screen.getByRole('button', { name: /TSR-Based Methods/ })
    const about = screen.getByRole('button', { name: /About/ })

    await user.click(methods)
    await user.click(about)

    expect(methods).toHaveAttribute('aria-expanded', 'false')
    expect(about).toHaveAttribute('aria-expanded', 'true')
  })

  it('does not render the mobile toggle', () => {
    renderApp()

    expect(
      screen.queryByRole('button', { name: /^Menu$/ }),
    ).not.toBeInTheDocument()
  })
})

describe('mobile navigation', () => {
  beforeEach(() => setViewport('mobile'))

  it('renders a toggle button instead of the desktop bar', () => {
    renderApp()

    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    // Scoped to the header: the footer has its own "Publications" link, which
    // is unrelated to the collapsed main navigation.
    const header = screen.getByRole('banner')
    expect(
      within(header).queryByRole('link', { name: 'Publications' }),
    ).not.toBeInTheDocument()
    expect(
      within(header).queryByRole('navigation', { name: 'Main' }),
    ).not.toBeInTheDocument()
  })

  it('opens a modal drawer that traps focus', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    const drawer = screen.getByRole('dialog', { name: 'Site menu' })
    expect(drawer).toHaveAttribute('aria-modal', 'true')
    expect(drawer).toHaveAttribute('id', 'mobile-nav-drawer')
  })

  it('locks background scrolling while open', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    expect(document.body).toHaveStyle({ overflow: 'hidden' })

    await user.keyboard('{Escape}')
    expect(document.body).not.toHaveStyle({ overflow: 'hidden' })
  })

  it('closes on Escape and returns focus to the toggle', async () => {
    const user = userEvent.setup()
    renderApp()
    const toggle = screen.getByRole('button', { name: 'Menu' })

    await user.click(toggle)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
  })

  it('expands a section with an accessible accordion button', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Menu' }))
    const section = screen.getByRole('button', { name: /TSR-Based Methods/ })
    expect(section).toHaveAttribute('aria-expanded', 'false')
    expect(section).toHaveAttribute(
      'aria-controls',
      'mobile-nav-methods-panel',
    )

    await user.click(section)

    expect(section).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('link', { name: 'Mirror-Image TSR' }),
    ).toBeInTheDocument()
  })

  it('closes the drawer after following a link', async () => {
    const user = userEvent.setup()
    renderApp()

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

  it('moves focus to main after a navigation', async () => {
    const user = userEvent.setup()
    renderApp()

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: 'TSR Method' }))

    expect(screen.getByRole('main')).toHaveFocus()
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

describe('navigation taxonomy', () => {
  it('marks the two pages with known content problems as draft', () => {
    const methods = navigation.find((item) => item.id === 'methods')
    const drafts = methods.groups
      .flatMap((group) => group.items)
      .filter((item) => item.status === 'draft')
      .map((item) => item.id)

    expect(drafts.sort()).toEqual(['cross-tsr', 'metal-ion'])
  })
})
