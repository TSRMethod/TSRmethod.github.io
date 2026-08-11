import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import NavDropdown from './NavDropdown'
import styles from './DesktopNav.module.css'

/*
 * Desktop navigation bar.
 *
 * Holds the "which dropdown is open" state so that only one can be open at a
 * time, and closes on outside click or route change.
 */
export default function DesktopNav({ items }) {
  const [openId, setOpenId] = useState(null)
  const navRef = useRef(null)
  const { pathname } = useLocation()

  const close = () => setOpenId(null)

  /*
   * Close when the route changes, otherwise a menu stays open over the new
   * page after a link inside it is followed.
   *
   * Adjusted during render rather than in an effect: React re-runs this
   * component immediately without painting the intermediate state, so the open
   * menu never flashes on the new page. Doing it in an effect would both
   * flash and trip react-hooks/set-state-in-effect.
   */
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setOpenId(null)
  }

  useEffect(() => {
    if (!openId) return

    function handlePointerDown(event) {
      if (!navRef.current?.contains(event.target)) close()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [openId])

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {items.map((item) =>
          item.groups ? (
            <NavDropdown
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
              onClose={close}
            />
          ) : (
            <li key={item.id} className={styles.item}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  isActive ? `${styles.link} ${styles.linkActive}` : styles.link
                }
              >
                {item.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  )
}
