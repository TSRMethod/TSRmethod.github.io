import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { breadcrumbFor } from './navigation'
import { setViewport } from '../test/viewport'

/*
 * Where a page sits: the dropdown that holds it is marked, the page itself is
 * the one current entry in that dropdown, and a breadcrumb under the header
 * links to the dropdown's own page and names this one. Read from the menu,
 * so the three cannot disagree.
 */

/* Evaluate the lazily loaded method page first; see GetStarted.test.jsx. */
await import('../components/method/MethodPage')

async function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1 })
}

describe('breadcrumbFor', () => {
  it.each([
    ['/methods/sse-tsr', [{ to: '/research', label: 'Methods & research' }]],
    ['/analysis/common-keys', [{ to: '/research', label: 'Methods & research' }]],
    ['/research/earlier-implementations', [{ to: '/research', label: 'Methods & research' }]],
    ['/software/get-started', [{ to: '/software', label: 'BioTSR' }]],
  ])('gives %s its dropdown’s page as the parent', (path, trail) => {
    expect(breadcrumbFor(path)).toEqual(trail)
  })

  it.each(['/tsr', '/research', '/software', '/people', '/no-such-page'])(
    'gives %s none: a top-level page, a dropdown’s own page, or no page',
    (path) => {
      expect(breadcrumbFor(path)).toBeNull()
    },
  )
})

describe('a method page', () => {
  it('has the breadcrumb Methods & research › SSE-TSR, with only the page current', async () => {
    setViewport('desktop')
    await renderAt('/methods/sse-tsr')
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: 'Methods & research' })).toHaveAttribute('href', '/research')
    expect(within(crumbs).getByText('SSE-TSR')).toHaveAttribute('aria-current', 'page')
    expect(crumbs.querySelectorAll('[aria-current]')).toHaveLength(1)
  })

  it('is the one current entry in its open desktop dropdown, which is marked', async () => {
    setViewport('desktop')
    await renderAt('/methods/sse-tsr')
    const trigger = screen.getByRole('button', { name: 'Methods & research' })
    expect(trigger).toHaveAttribute('data-current', 'true')
    expect(screen.getByRole('button', { name: 'BioTSR' })).not.toHaveAttribute('data-current')
    fireEvent.click(trigger)
    const menu = screen.getByRole('navigation', { name: 'Main' })
    const current = menu.querySelectorAll('[aria-current="page"]')
    expect([...current].map((a) => a.textContent)).toEqual(['SSE-TSR'])
    expect(current[0]).toHaveClass('active')
  })

  it('is the one current entry in the phone menu too', async () => {
    setViewport('mobile')
    await renderAt('/analysis/common-keys')
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const section = screen.getByRole('button', { name: 'Methods & research' })
    expect(section).toHaveAttribute('data-current', 'true')
    fireEvent.click(section)
    const panel = document.getElementById(section.getAttribute('aria-controls'))
    expect([...panel.querySelectorAll('[aria-current="page"]')].map((a) => a.textContent)).toEqual(['Common Keys'])
  })

  it('names an analysis page the same way', async () => {
    setViewport('desktop')
    await renderAt('/analysis/common-keys')
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByText('Common Keys')).toHaveAttribute('aria-current', 'page')
  })

  it('leaves Understand TSR without a breadcrumb: it is a top-level page', async () => {
    setViewport('desktop')
    await renderAt('/tsr')
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull()
    const menu = screen.getByRole('navigation', { name: 'Main' })
    expect(within(menu).getByRole('link', { name: 'Understand TSR' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('the earlier implementations page', () => {
  it('has the same breadcrumb under Methods & research', async () => {
    setViewport('desktop')
    await renderAt('/research/earlier-implementations')
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(crumbs).getByRole('link', { name: 'Methods & research' })).toHaveAttribute('href', '/research')
    expect(crumbs.querySelector('[aria-current="page"]').textContent).toBe(
      screen.getByRole('heading', { level: 1 }).textContent,
    )
  })
})
