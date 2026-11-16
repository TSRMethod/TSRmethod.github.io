import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
import useScrolled from '../../hooks/useScrolled'
import Navigation from './Navigation'
import BrandSymbol from '../brand/BrandSymbol'
import { splitName } from '../brand/wordmark'
import styles from './Header.module.css'

/*
 * Sticky site header: the group's symbol and name on the left, navigation right.
 *
 * The NAME IS TEXT, not part of the image. That is deliberate: it stays
 * selectable and searchable, it scales with the reader's font size, it is what
 * gives the home link its accessible name, and renaming the group stays a
 * one-line edit in site.json rather than a trip back to a design tool. It is
 * set in IBM Plex Sans, the wordmark's typeface (--font-brand), with the
 * short name ("TSR") in the theme's blue and the rest in the text colour.
 *
 * The symbol is therefore decorative and hidden from assistive technology —
 * announcing it would make a screen reader read the group's name twice on
 * every page. It is drawn inline (BrandSymbol), so it follows the theme.
 *
 * ONE STATE CHANGE, and only a visual one: once the page has moved, the bar
 * takes a translucent, blurred surface and a shadow, and the symbol tightens
 * slightly, so it reads as floating over the content rather than as part of
 * the top of the page.
 *
 * ITS HEIGHT DOES NOT CHANGE. A sticky header is in the document flow, so a
 * header that shrinks while the reader scrolls drags everything below it
 * upwards — a layout shift, caused by scrolling, which is exactly what Core
 * Web Vitals counts against a page. `min-height` therefore stays constant and
 * only the surface and the symbol respond.
 */

export default function Header() {
  const scrolled = useScrolled()
  const { lead, rest } = splitName(siteConfig.name, siteConfig.shortName)

  return (
    <header className={styles.header} data-scrolled={scrolled || undefined}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandMark}>
            <BrandSymbol />
          </span>
          <span className={styles.brandName}>
            {lead && (
              <>
                <span className={styles.brandLead}>{lead}</span>{' '}
              </>
            )}
            {rest}
          </span>
        </Link>

        <Navigation />
      </div>
    </header>
  )
}
