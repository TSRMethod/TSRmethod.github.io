import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { setReducedMotion, setViewport } from '../../test/viewport'

/*
 * The route entrance, and the behaviour it must not disturb.
 *
 * A page transition is the easiest place on a site to break accessibility by
 * accident: the wrapper it needs sits exactly where scroll restoration and
 * focus management happen. These tests are mostly about what still works.
 */

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

const main = () => screen.getByRole('main')

beforeEach(() => {
  window.scrollTo = vi.fn()
})

describe('navigating between pages', () => {
  it('still scrolls to the top and moves focus into the page', async () => {
    setViewport('desktop')
    renderApp('/')

    await userEvent.click(
      within(screen.getAllByRole('banner')[0]).getByRole('link', {
        name: 'Publications',
      }),
    )

    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: 'instant',
    })
    expect(main()).toHaveFocus()
  })

  it('keeps <main> as the skip-link target and a focusable landmark', () => {
    renderApp('/people')

    expect(main()).toHaveAttribute('id', 'main')
    expect(main()).toHaveAttribute('tabindex', '-1')
  })

  it('leaves one main landmark, whatever wraps the route', () => {
    renderApp('/software')
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('renders the page content as a child of main, not beside it', () => {
    renderApp('/publications')

    const heading = screen.getByRole('heading', { level: 1 })
    expect(main().contains(heading)).toBe(true)
  })

  it('adds no landmark, list or heading of its own', () => {
    /*
     * The wrapper is a plain <div>: it must be invisible to the document
     * outline. If it ever needs to be something else, this is the test that
     * should stop it.
     */
    renderApp('/people')

    const wrapper = main().firstElementChild
    expect(wrapper.tagName).toBe('DIV')
    expect(wrapper).not.toHaveAttribute('role')
    expect(wrapper).not.toHaveAttribute('aria-label')
  })

  it('shows the whole page immediately under reduced motion', async () => {
    setReducedMotion(true)
    setViewport('desktop')
    renderApp('/people')

    /*
     * Nothing may be waiting on an animation frame to become readable: every
     * card is present and marked as revealed on the first paint.
     */
    for (const card of main().querySelectorAll('[data-reveal]')) {
      expect(card).toHaveAttribute('data-reveal', 'shown')
    }

    expect(
      screen.getByRole('heading', { level: 1, name: /people/i }),
    ).toBeInTheDocument()
  })
})
