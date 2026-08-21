import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import AnalyticsTracker from './AnalyticsTracker'
import {
  initializeAnalytics,
  startPerformanceMonitoring,
  trackPageView,
} from '../../lib/analytics'

/*
 * Page-view reporting, with the analytics module mocked.
 *
 * The module's own behaviour is covered in src/lib/analytics.test.js; what is
 * being checked here is the wiring — that a navigation produces exactly one
 * view, that initialisation happens once, and that neither depends on which
 * route the visitor happened to land on first.
 */
vi.mock('../../lib/analytics', () => ({
  initializeAnalytics: vi.fn(() => true),
  startPerformanceMonitoring: vi.fn(() => Promise.resolve(true)),
  trackPageView: vi.fn(() => true),
}))

function Harness({ initialPath = '/' }) {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<Link to="/people">To people</Link>} />
        <Route
          path="/people"
          element={<Link to="/publications">To publications</Link>}
        />
        <Route path="/publications" element={<p>Publications</p>} />
      </Routes>
      <AnalyticsTracker />
    </MemoryRouter>
  )
}

const viewedPaths = () => trackPageView.mock.calls.map(([path]) => path)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('page-view tracking', () => {
  it('records the first page as a view', () => {
    render(<Harness />)
    expect(viewedPaths()).toEqual(['/'])
  })

  it('records one view per navigation, in order', async () => {
    render(<Harness />)

    await userEvent.click(screen.getByRole('link', { name: 'To people' }))
    await userEvent.click(screen.getByRole('link', { name: 'To publications' }))

    expect(viewedPaths()).toEqual(['/', '/people', '/publications'])
  })

  it('records a view for a deep link, not just for the site root', () => {
    render(<Harness initialPath="/publications" />)
    expect(viewedPaths()).toEqual(['/publications'])
  })

  it('initialises analytics once, whatever the visitor does next', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('link', { name: 'To people' }))

    expect(initializeAnalytics).toHaveBeenCalledTimes(1)
  })

  it('starts performance monitoring only when analytics actually started', () => {
    initializeAnalytics.mockReturnValueOnce(false)

    render(<Harness />)

    expect(startPerformanceMonitoring).not.toHaveBeenCalled()
  })

  it('measures Core Web Vitals when analytics is on', () => {
    render(<Harness />)
    expect(startPerformanceMonitoring).toHaveBeenCalledTimes(1)
  })

  it('renders nothing of its own', () => {
    const { container } = render(
      <MemoryRouter>
        <AnalyticsTracker />
      </MemoryRouter>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
