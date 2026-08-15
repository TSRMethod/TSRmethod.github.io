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

/*
 * Warm the one code-split route before any test renders.
 *
 * MethodPage is loaded with React.lazy (see src/app/LazyMethodPage.jsx), so in
 * the browser it arrives a moment after the route that renders it. Tests
 * handle that correctly with `findBy*`, which polls — but the *first* dynamic
 * import in a worker also has to transform and evaluate the module, and under
 * a full parallel run that occasionally took longer than findBy's one-second
 * default. The result was a test that passed alone and failed in the suite.
 *
 * Evaluating the module here means the import resolves from the module cache
 * when React asks for it, so what the tests wait on is React's re-render
 * rather than a compile. Nothing is stubbed and no assertion is relaxed: the
 * component is still loaded lazily, and the tests still await it.
 */
await import('../components/method/MethodPage')

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
