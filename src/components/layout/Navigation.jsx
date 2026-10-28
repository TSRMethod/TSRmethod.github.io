import { getVisibleNavigation } from '../../app/navigation'
import useMediaQuery, { NAV_QUERY } from '../../hooks/useMediaQuery'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'
import styles from './Navigation.module.css'

/*
 * Chooses between the desktop bar and the mobile drawer.
 *
 * Exactly one of the two is mounted. Rendering both and hiding one with CSS —
 * what the previous site did — leaves duplicate element IDs in the document
 * and invisible tab stops for keyboard users.
 *
 * With one exception, before the screen has been measured: the HTML built
 * for each page, and the browser's first render as it takes that HTML over.
 * Neither can know the width, so both forms are present and a media query
 * shows one; `display: none` keeps the other out of the tab order and the
 * accessibility tree. React replaces the pair with the right single form
 * immediately after hydration. In their closed state the two share no IDs.
 */
export default function Navigation() {
  const isDesktop = useMediaQuery(NAV_QUERY)
  const items = getVisibleNavigation()

  if (isDesktop === undefined) {
    return (
      <>
        <div className={styles.desktopOnly}>
          <DesktopNav items={items} />
        </div>
        <div className={styles.mobileOnly}>
          <MobileNav items={items} />
        </div>
      </>
    )
  }

  return isDesktop ? <DesktopNav items={items} /> : <MobileNav items={items} />
}
