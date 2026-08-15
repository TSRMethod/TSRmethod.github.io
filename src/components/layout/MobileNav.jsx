import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import useFocusTrap from '../../hooks/useFocusTrap'
import styles from './MobileNav.module.css'

const DRAWER_ID = 'mobile-nav-drawer'

/*
 * Mobile navigation: a toggle button plus a slide-in drawer.
 *
 * Only rendered below 1150px, so nothing here is ever a hidden tab stop on
 * desktop.
 *
 * Behaviour the previous site got wrong and this fixes:
 *   - the toggle is a real <button>, not a <div> with an onClick
 *   - dropdowns open on tap, not on :hover
 *   - the drawer closes after following a link
 *   - Escape closes it and focus goes back to the toggle
 *   - the page behind cannot be scrolled or tabbed into while it is open
 */
export default function MobileNav({ items }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openGroupId, setOpenGroupId] = useState(null)
  const toggleRef = useRef(null)
  const drawerRef = useRef(null)
  const { pathname } = useLocation()

  useFocusTrap(drawerRef, isOpen)

  /*
   * Dismissal by the user: close and hand focus back to the button they
   * opened it with. Closing because the route changed is handled separately
   * below — there, focus belongs on the new page, not back up in the header.
   */
  const dismiss = useCallback(() => {
    setIsOpen(false)
    toggleRef.current?.focus()
  }, [])

  /*
   * Close after a navigation. Adjusted during render rather than in an effect
   * so the drawer never paints over the new page for a frame.
   *
   * Note this path deliberately does not touch focus: ScrollToTop moves focus
   * to the new page's <main>, which is where a user who just followed a link
   * expects to be. `dismiss()` above is the other case — the user closed the
   * menu without going anywhere, so focus goes back to the toggle.
   */
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    setIsOpen(false)
    setOpenGroupId(null)
  }

  // Escape from anywhere while open.
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, dismiss])

  // Stop the page behind the drawer from scrolling.
  useEffect(() => {
    if (!isOpen) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isOpen])

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        className={styles.toggle}
        aria-expanded={isOpen}
        aria-controls={DRAWER_ID}
        onClick={() => (isOpen ? dismiss() : setIsOpen(true))}
      >
        <svg
          className={styles.toggleIcon}
          viewBox="0 0 20 20"
          width="22"
          height="22"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d={isOpen ? 'M5 5l10 10M15 5L5 15' : 'M3 6h14M3 10h14M3 14h14'}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {isOpen ? 'Close' : 'Menu'}
      </button>

      {isOpen && (
        <>
          {/*
            Presentational scrim. Dismissal is also available from the Close
            button and the Escape key, so this is not the only way out and it
            does not need to be a focusable control.
          */}
          <div
            className={styles.backdrop}
            onClick={dismiss}
            aria-hidden="true"
          />

          <div
            id={DRAWER_ID}
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <nav aria-label="Main">
              <ul className={styles.list}>
                {items.map((item) =>
                  item.groups ? (
                    <AccordionItem
                      key={item.id}
                      item={item}
                      isOpen={openGroupId === item.id}
                      onToggle={() =>
                        setOpenGroupId(
                          openGroupId === item.id ? null : item.id,
                        )
                      }
                    />
                  ) : (
                    <li key={item.id}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) =>
                          isActive
                            ? `${styles.link} ${styles.linkActive}`
                            : styles.link
                        }
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
            </nav>
          </div>
        </>
      )}
    </>
  )
}

/* A collapsible section inside the drawer. */
function AccordionItem({ item, isOpen, onToggle }) {
  const panelId = `mobile-nav-${item.id}-panel`

  return (
    <li>
      <button
        type="button"
        className={styles.accordionTrigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        {item.label}
        <svg
          className={styles.chevron}
          data-open={isOpen || undefined}
          viewBox="0 0 12 12"
          width="14"
          height="14"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M2 4.5 6 8.5 10 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div id={panelId} className={styles.panel}>
          {item.groups.map((group) => {
            const groupLabelId = `mobile-nav-${item.id}-${group.id}-label`

            return (
              <div key={group.id} className={styles.group}>
                <span id={groupLabelId} className={styles.groupLabel}>
                  {group.label}
                </span>
                <ul className={styles.groupList} aria-labelledby={groupLabelId}>
                  {group.items.map((link) => (
                    <li key={link.id}>
                      <NavLink to={link.to} className={styles.panelLink}>
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </li>
  )
}
