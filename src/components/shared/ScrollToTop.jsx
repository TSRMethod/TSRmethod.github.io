import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * Resets scroll position and moves keyboard focus when the route changes.
 *
 * A single-page app does not reload the document when the URL changes, so
 * without this the browser keeps both the scroll offset and the focus ring
 * from the previous page. Screen reader and keyboard users would otherwise
 * have to tab back through the whole header after every navigation.
 *
 * Two things it deliberately does NOT do:
 *
 *   - Anything on the first render. Focusing <main> on page load would move
 *     the sequential focus starting point past the header, so the user's
 *     first Tab would jump into the page content and they could never reach
 *     the skip link or the navigation. The browser already loads at the top.
 *
 *   - Reset to the top when the URL carries a hash. A hash names a place on
 *     the page, so it is scrolled to instead — see scrollToHash below.
 */

/*
 * Bring the element a hash names into view.
 *
 * The browser does this by itself for a link within the page, but not when
 * the hash arrives with a new route (a link from another page to
 * /tsr#worked-example, say) or on a first load, because in both cases the
 * element does not exist yet when the browser looks for it. The effect below
 * runs after React has rendered the page, so it is there to be found.
 *
 * A page that loads lazily renders once its chunk arrives, so a missing
 * element is looked for again every 50ms for about three seconds before
 * giving up — giving up is harmless: the reader is simply at the top of the
 * page. A timer rather than requestAnimationFrame, because animation frames
 * do not run in a background tab, and a link opened in a new tab must still
 * land on its section.
 */
const RETRY_MS = 50

function scrollToHash(hash, attemptsLeft = 60) {
  const id = decodeURIComponent(hash.slice(1))
  const target = id ? document.getElementById(id) : null

  if (target) {
    // Optional call: jsdom, which the tests run in, does not implement it.
    target.scrollIntoView?.({ block: 'start', behavior: 'instant' })
    return () => {}
  }
  if (attemptsLeft === 0) return () => {}

  let cancelNext = () => {}
  const timer = setTimeout(() => {
    cancelNext = scrollToHash(hash, attemptsLeft - 1)
  }, RETRY_MS)
  return () => {
    clearTimeout(timer)
    cancelNext()
  }
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const lastPathname = useRef(pathname)

  useEffect(() => {
    if (hash) {
      /*
       * Arriving from another page moves focus into the new page, exactly as
       * an ordinary navigation does below, so a keyboard user is not left on
       * a menu link that has just closed. Within one page, focus stays put.
       */
      if (lastPathname.current !== pathname) {
        lastPathname.current = pathname
        document.getElementById('main')?.focus({ preventScroll: true })
      }
      return scrollToHash(hash)
    }

    // Equal on the very first render, and on any re-run that was not caused
    // by a navigation.
    if (lastPathname.current === pathname) return
    lastPathname.current = pathname

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // `tabindex="-1"` is set on <main> so it can receive programmatic focus
    // without becoming a tab stop.
    const main = document.getElementById('main')
    main?.focus({ preventScroll: true })
  }, [pathname, hash])

  return null
}
