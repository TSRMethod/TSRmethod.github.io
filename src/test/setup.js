/*
 * Vitest setup, run once before every test file.
 *
 * Adds the jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...),
 * unmounts React trees between tests, and stubs the browser APIs jsdom does
 * not implement. Each stub is here so that genuine warnings stay visible in
 * the test output instead of being buried in "Not implemented" noise.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { installMatchMedia, resetViewport } from './viewport'

/* jsdom has no layout engine, so scrolling is unimplemented. */
window.scrollTo = vi.fn()

/*
 * jsdom has no IntersectionObserver. SectionNavigation uses it to highlight
 * the section currently in view; the stub lets the component mount, and the
 * active-section behaviour is verified in the browser rather than here.
 */
class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
window.IntersectionObserver = IntersectionObserverStub
globalThis.IntersectionObserver = IntersectionObserverStub

beforeEach(() => {
  installMatchMedia()

  /* Clipboard is unavailable in jsdom and is not writable by default. */
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

afterEach(() => {
  cleanup()
  resetViewport()
})
