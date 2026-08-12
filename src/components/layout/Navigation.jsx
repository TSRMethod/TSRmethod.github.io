import { getVisibleNavigation } from '../../app/navigation'
import useMediaQuery, { DESKTOP_QUERY } from '../../hooks/useMediaQuery'
import DesktopNav from './DesktopNav'
import MobileNav from './MobileNav'

/*
 * Chooses between the desktop bar and the mobile drawer.
 *
 * Exactly one of the two is mounted. Rendering both and hiding one with CSS —
 * what the previous site did — leaves duplicate element IDs in the document
 * and invisible tab stops for keyboard users.
 */
export default function Navigation() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const items = getVisibleNavigation()

  return isDesktop ? <DesktopNav items={items} /> : <MobileNav items={items} />
}
