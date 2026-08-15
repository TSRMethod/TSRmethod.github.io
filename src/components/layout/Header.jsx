import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
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
 */
export default function Header() {
  return (
    <header className={styles.header}>
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
