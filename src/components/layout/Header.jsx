import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
import useScrolled from '../../hooks/useScrolled'
import Navigation from './Navigation'
import styles from './Header.module.css'

/*
 * Sticky site header: the group's mark and name on the left, navigation right.
 *
 * The NAME IS TEXT, not part of the image. That is deliberate: it stays
 * selectable and searchable, it scales with the reader's font size, it is what
 * gives the home link its accessible name, and renaming the group stays a
 * one-line edit in site.json rather than a trip back to a design tool.
 *
 * The mark is therefore decorative and marked as such — announcing it would
 * make a screen reader read the group's name twice on every page.
 *
 * ONE STATE CHANGE, and only a visual one: once the page has moved, the bar
 * takes a translucent, blurred surface and a shadow, and the mark tightens
 * slightly, so it reads as floating over the content rather than as part of
 * the top of the page.
 *
 * ITS HEIGHT DOES NOT CHANGE. A sticky header is in the document flow, so a
 * header that shrinks while the reader scrolls drags everything below it
 * upwards — a layout shift, caused by scrolling, which is exactly what Core
 * Web Vitals counts against a page. `min-height` therefore stays constant and
 * only the surface and the mark respond.
 */
export default function Header() {
  const scrolled = useScrolled()

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <img
            className={styles.brandMark}
            src="/images/brand/tsr-mark.png"
            alt=""
            width="40"
            height="40"
            decoding="async"
          />
          <span className={styles.brandName}>{siteConfig.name}</span>
        </Link>

        <Navigation />
      </div>
    </header>
  )
}
