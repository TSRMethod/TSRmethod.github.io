import { useLocation } from 'react-router-dom'
import styles from './PageTransition.module.css'

/*
 * A short fade-and-lift as a new route paints.
 *
 * ENTRANCE ONLY. There is no exit animation, and that is a decision rather
 * than an omission: an exit means holding the old page on screen while it
 * fades, which puts a delay between the click and the new content. Navigation
 * should feel instant; the fade is there to stop the swap looking abrupt, not
 * to be watched.
 *
 * Keyed on the pathname, so React replaces the subtree and the CSS animation
 * runs again. The hash is deliberately not part of the key — an in-page
 * anchor on a method page is not a new page and must not re-animate the one
 * the reader is already in.
 *
 * IT DOES NOT TOUCH SCROLL OR FOCUS. ScrollToTop still moves the window and
 * moves focus into <main> on a route change; this is a plain wrapper element
 * with an animation on it, so that behaviour is unchanged and the visual
 * effect stays subordinate to it.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className={styles.page}>
      {children}
    </div>
  )
}
