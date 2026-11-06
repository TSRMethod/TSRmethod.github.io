import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import App from './App'
import { breadcrumbFor } from './navigation'
import { setViewport } from '../test/viewport'

/*
 * Where a page sits: the dropdown that holds it is marked, the page itself is
 * the one current entry in that dropdown, and a breadcrumb under the header
 * links to the dropdown's own page and names this one. Read from the menu,
 * so the three cannot disagree.
 */

/* Evaluate the lazily loaded pages first; see GetStarted.test.jsx. */
await import('../components/method/MethodPage')
await import('../pages/Learn/Learn')
await import('../pages/Learn/FourTriangles')
await import('../pages/Learn/FirstTenMinutes')

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

/*
 * One treatment in every dropdown: the entry the page is under has the
 * "active" class when it is the page (bold, aria-current="page") or the
 * "in-section" class when it is the page's section (normal weight, no
 * aria-current); both draw the same pale fill and left bar. Never more than
 * one such entry in a dropdown, and only the dropdown holding it is marked.
 */
const marked = (panel) =>
  [...panel.querySelectorAll('a.active, a.in-section')].map((a) => [
    a.textContent,
    a.classList.contains('active') ? 'page' : 'section',
    a.getAttribute('aria-current'),
  ])

function openDesktop(label) {
  const trigger = screen.getByRole('button', { name: label })
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger)
  return document.getElementById(trigger.getAttribute('aria-controls'))
}

function markedTriggers() {
  const main = screen.getByRole('navigation', { name: 'Main' })
  return [...main.querySelectorAll('button[data-current]')].map((b) => b.textContent)
}

describe('dropdown highlighting', () => {
  it.each([
    ['/software/learn', 'BioTSR', [['Learn BioTSR', 'page', 'page']]],
    ['/software/four-triangles-one-key', 'BioTSR', [['Learn BioTSR', 'section', null]]],
    ['/software/first-10-minutes', 'BioTSR', [['Learn BioTSR', 'section', null]]],
    ['/software', 'BioTSR', [['Overview', 'page', 'page']]],
    ['/methods/sse-tsr', 'Methods & research', [['SSE-TSR', 'page', 'page']]],
    ['/research', 'Methods & research', [['All methods and research', 'page', 'page']]],
    ['/people', 'About', [['People', 'page', 'page']]],
    ['/contact', 'About', [['Contact', 'page', 'page']]],
  ])('on %s, loaded directly, marks %s and one entry in it', async (path, dropdown, entries) => {
    setViewport('desktop')
    await renderAt(path)
    expect(markedTriggers()).toEqual([dropdown])
    const panel = openDesktop(dropdown)
    expect(marked(panel)).toEqual(entries)
    const main = screen.getByRole('navigation', { name: 'Main' })
    expect(main.querySelectorAll('[aria-current="page"]')).toHaveLength(entries[0][2] ? 1 : 0)
  })

  it('marks nothing in the other dropdowns', async () => {
    setViewport('desktop')
    await renderAt('/software/four-triangles-one-key')
    for (const other of ['Methods & research', 'About']) {
      expect(marked(openDesktop(other))).toEqual([])
    }
  })

  it.each([
    ['/software/learn', 'BioTSR', [['Learn BioTSR', 'page', 'page']]],
    ['/software/first-10-minutes', 'BioTSR', [['Learn BioTSR', 'section', null]]],
    ['/methods/sse-tsr', 'Methods & research', [['SSE-TSR', 'page', 'page']]],
    ['/people', 'About', [['People', 'page', 'page']]],
  ])('does the same in the phone menu on %s', async (path, section, entries) => {
    setViewport('mobile')
    await renderAt(path)
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const trigger = screen.getByRole('button', { name: section })
    expect(trigger).toHaveAttribute('data-current', 'true')
    fireEvent.click(trigger)
    expect(marked(document.getElementById(trigger.getAttribute('aria-controls')))).toEqual(entries)
  })

  it('follows the page through links, Back and Forward', async () => {
    setViewport('desktop')
    let navigate
    function History() {
      navigate = useNavigate()
      return null
    }
    render(
      <MemoryRouter initialEntries={['/methods/sse-tsr']}>
        <App />
        <History />
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { level: 1 })
    fireEvent.click(within(openDesktop('BioTSR')).getByRole('link', { name: 'Learn BioTSR' }))
    await screen.findByRole('heading', { level: 1, name: 'Learn BioTSR' })
    expect(markedTriggers()).toEqual(['BioTSR'])

    fireEvent.click(document.querySelector('main a[href="/software/four-triangles-one-key"]'))
    await screen.findByRole('heading', { level: 1, name: 'Why do four triangles share one BioTSR key?' })
    expect(marked(openDesktop('BioTSR'))).toEqual([['Learn BioTSR', 'section', null]])

    await act(async () => navigate(-1))
    await screen.findByRole('heading', { level: 1, name: 'Learn BioTSR' })
    expect(marked(openDesktop('BioTSR'))).toEqual([['Learn BioTSR', 'page', 'page']])

    await act(async () => navigate(-1))
    await screen.findByRole('heading', { level: 1, name: /SSE-TSR/ })
    expect(markedTriggers()).toEqual(['Methods & research'])
    expect(marked(openDesktop('Methods & research'))).toEqual([['SSE-TSR', 'page', 'page']])

    await act(async () => navigate(1))
    await screen.findByRole('heading', { level: 1, name: 'Learn BioTSR' })
    expect(markedTriggers()).toEqual(['BioTSR'])
    expect(marked(openDesktop('BioTSR'))).toEqual([['Learn BioTSR', 'page', 'page']])
  })
})
