import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
import Navigation from './Navigation'
import styles from './Header.module.css'

/*
 * Sticky site header: wordmark on the left, navigation on the right.
 *
 * The wordmark is text rather than an image for now. The original logo asset
 * has not been migrated yet — that happens with the rest of the image
 * optimisation work.
 */
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            TSR
          </span>
          <span className={styles.brandName}>{siteConfig.name}</span>
        </Link>

        <Navigation />
      </div>
    </header>
  )
}
