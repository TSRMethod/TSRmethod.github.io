/*
 * Vitest setup, run once before every test file.
 *
 * Adds the jest-dom matchers (toBeInTheDocument, toHaveAttribute, ...) and
 * unmounts React trees between tests so state cannot leak across cases.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/*
 * jsdom has no layout engine, so `window.scrollTo` is unimplemented and logs a
 * "Not implemented" warning whenever ScrollToTop runs. Stub it so real
 * warnings stay visible in the test output.
 */
window.scrollTo = vi.fn()

afterEach(() => {
  cleanup()
})
