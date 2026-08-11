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
 *   - Anything when the URL carries a hash, so in-page anchors (method page
 *     section links) still work.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const lastPathname = useRef(pathname)

  useEffect(() => {
    if (hash) return

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
