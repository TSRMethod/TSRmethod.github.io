import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import useFocusTrap from '../../hooks/useFocusTrap'
import useExitTransition from '../../hooks/useExitTransition'
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
 *
 * THE MODAL LAYER IS PORTALLED TO <body>. The button stays in the header;
 * the backdrop and the drawer do not.
 *
 * This is not tidiness, it is the fix for a real bug. `position: fixed`
 * resolves against the viewport only while no ancestor establishes a
 * containing block, and a `filter`, `transform`, `perspective`,
 * `will-change` or `backdrop-filter` on any ancestor does exactly that. The
 * scrolled header applies `backdrop-filter: blur(10px)`, so once the page had
 * been scrolled, a drawer nested inside the header measured itself against
 * the header's 73px box instead of the viewport: a 72px-tall scrim and a
 * drawer with almost all of the menu clipped out of it. Measured at 1026px:
 * 72px tall with the blur, 760px without it.
 *
 * Rendering the modal layer as a child of <body> puts it out of reach of any
 * ancestor effect the header may grow in future, which is what makes this a
 * fix rather than a workaround — the alternative, dropping the blur, would
 * have left the same trap set for the next person who adds one.
 *
 * Nothing else moves. React events still propagate through the React tree, so
 * the backdrop's onClick works as before; `aria-controls` refers to an id,
 * which is document-wide; and the focus trap works on the drawer element and
 * a document-level keydown listener, neither of which cares where the element
 * sits in the DOM.
 */
export default function MobileNav({ items }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openGroupId, setOpenGroupId] = useState(null)
  const toggleRef = useRef(null)
  const drawerRef = useRef(null)
  const { pathname } = useLocation()

  /*
   * The drawer slides out rather than disappearing, so it stays mounted for
   * one phase after it closes. Everything else — the focus trap, the scroll
   * lock, focus restoration — keys off `isOpen` and therefore lets go at the
   * moment of dismissal, not at the end of the animation. The panel on its
   * way out is scenery: inert, unfocusable, and holding nothing open.
   */
  const drawer = useExitTransition(isOpen, drawerRef)

  useFocusTrap(drawerRef, isOpen)

  /*
   * Where the page was when the user dismissed the drawer, or null when it
   * closed for any other reason. Read once by the scroll lock's cleanup —
   * see the effect below for why it is a ref and not state.
   */
  const restoreScrollTo = useRef(null)

  /*
   * Dismissal by the user: close and hand focus back to the button they
   * opened it with. Closing because the route changed is handled separately
   * below — there, focus belongs on the new page, not back up in the header.
   *
   * `preventScroll` is the important half. `focus()` asks the browser to
   * reveal the element, and the browser obliges by scrolling the document —
   * which is how closing the menu moved the page a little each time. The
   * toggle is in a sticky header and is therefore already on screen, so
   * there is never anything to reveal: the request can only ever do harm.
   * Focus still moves, which is what a keyboard user needs; the page does
   * not, which is what everyone else notices.
   */
  const dismiss = useCallback(() => {
    restoreScrollTo.current = window.scrollY
    setIsOpen(false)
    toggleRef.current?.focus({ preventScroll: true })
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

  /*
   * Stop the page behind the drawer from scrolling, and put it back exactly
   * where it was.
   *
   * The lock itself is unchanged — one property, restored to whatever it was
   * before. What is new is the check on the way out: taking `overflow:
   * hidden` off a scrolled document is a layout change, and a browser is
   * entitled to settle the scroll position differently afterwards. This
   * compares where the page ended up with where it was when the user reached
   * for the close, and corrects it only if they differ, so in the normal case
   * — the browser holding its position, which is most of them — this does
   * nothing at all. No timer, no guessing: a comparison and, at most, one
   * assignment.
   *
   * It runs ONLY for a dismissal. When the drawer closes because a link was
   * followed, `restoreScrollTo` is null and this leaves the scroll position
   * alone, so ScrollToTop can take the reader to the top of the new page as
   * it always has. Restoring the old offset there would be a bug, not a fix.
   */
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow

      const target = restoreScrollTo.current
      restoreScrollTo.current = null

      if (target === null) return
      if (Math.round(window.scrollY) === Math.round(target)) return

      window.scrollTo({ top: target, left: window.scrollX, behavior: 'instant' })
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

      {drawer.isMounted &&
        createPortal(
          <>
            {/*
              Presentational scrim. Dismissal is also available from the Close
              button and the Escape key, so this is not the only way out and it
              does not need to be a focusable control.
            */}
            <div
              className={[
                styles.backdrop,
                drawer.isExiting ? styles.leaving : null,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={dismiss}
              aria-hidden="true"
            />

            <div
              id={DRAWER_ID}
              ref={drawerRef}
              className={[styles.drawer, drawer.isExiting ? styles.leaving : null]
                .filter(Boolean)
                .join(' ')}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              /*
               * While it is leaving it is a picture of a menu: out of the
               * accessibility tree, unfocusable and unclickable. `inert` says
               * all three to the browser, rather than to a stylesheet that
               * may not have loaded.
               */
              inert={drawer.isExiting || undefined}
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
          </>,
          document.body,
        )}
    </>
  )
}

/* A collapsible section inside the drawer. */
function AccordionItem({ item, isOpen, onToggle }) {
  const panelId = `mobile-nav-${item.id}-panel`
  const panelRef = useRef(null)
  /* Same treatment as the drawer: the section stays in the tree while it
     collapses, and is taken out when the browser says the animation is over. */
  const panel = useExitTransition(isOpen, panelRef)

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

      {panel.isMounted && (
        <div
          id={panelId}
          ref={panelRef}
          className={[styles.panel, panel.isExiting ? styles.leaving : null]
            .filter(Boolean)
            .join(' ')}
        >
          <div className={styles.panelInner}>
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
        </div>
      )}
    </li>
  )
}
