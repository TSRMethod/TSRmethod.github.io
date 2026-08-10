import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/*
 * Restores scroll position and moves keyboard focus on route change.
 *
 * A single-page app does not reload the document when the URL changes, so
 * without this the browser keeps both the scroll offset and the focus ring
 * from the previous page. Screen reader and keyboard users would otherwise
 * have to tab back through the whole header after every navigation.
 *
 * When the URL carries a hash we leave scrolling alone so the in-page anchor
 * (method page section links) still works.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) return

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })

    // `tabindex="-1"` is set on <main> so it can receive programmatic focus
    // without becoming a tab stop.
    const main = document.getElementById('main')
    main?.focus({ preventScroll: true })
  }, [pathname, hash])

  return null
}
