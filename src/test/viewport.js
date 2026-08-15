/*
 * A controllable `window.matchMedia` for tests.
 *
 * jsdom has no layout engine and its matchMedia always reports `matches:
 * false`, which would make every test render the mobile navigation. This stub
 * lets a test say which breakpoint it is simulating.
 *
 *   setViewport('mobile')   // renders MobileNav
 *   setViewport('desktop')  // renders DesktopNav
 */

/*
 * The width a test gets when it does not ask for one.
 *
 * A full desktop rather than the narrowest desktop: the navigation switches to
 * the drawer below 1150px (NAV_QUERY), so a default of 1024 would silently
 * give every test that never calls setViewport the mobile menu — passing, but
 * not testing what its author meant.
 */
const DEFAULT_WIDTH = 1280

let currentWidth = DEFAULT_WIDTH
const listeners = new Set()

function evaluate(query) {
  const min = query.match(/min-width:\s*(\d+)px/)
  if (min) return currentWidth >= Number(min[1])

  const max = query.match(/max-width:\s*(\d+)px/)
  if (max) return currentWidth <= Number(max[1])

  return false
}

export function installMatchMedia() {
  window.matchMedia = (query) => ({
    media: query,
    get matches() {
      return evaluate(query)
    },
    addEventListener: (_event, callback) => listeners.add(callback),
    removeEventListener: (_event, callback) => listeners.delete(callback),
    // Deprecated aliases, present because some libraries still call them.
    addListener: (callback) => listeners.add(callback),
    removeListener: (callback) => listeners.delete(callback),
    onchange: null,
    dispatchEvent: () => false,
  })
}

/** @param {'mobile' | 'desktop' | number} viewport */
export function setViewport(viewport) {
  if (viewport === 'mobile') currentWidth = 390
  else if (viewport === 'desktop') currentWidth = 1280
  else currentWidth = viewport

  listeners.forEach((callback) => callback({ matches: undefined }))
}

export function resetViewport() {
  currentWidth = DEFAULT_WIDTH
  listeners.clear()
}
