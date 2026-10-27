import { useEffect, useLayoutEffect, useRef } from 'react'
import MenuLink from './MenuLink'
import styles from './DesktopNav.module.css'

/*
 * One desktop dropdown, built on the ARIA disclosure pattern.
 *
 * Why disclosure rather than the menubar pattern: menubar takes over the arrow
 * keys and removes the links from the normal tab sequence, which is right for
 * an application menu but surprising in site navigation. With disclosure the
 * links stay ordinary links — Tab reaches them, Enter follows them, and
 * middle-click or "open in new tab" work as users expect.
 *
 * Opening is by click or keyboard only. Hover is deliberately not a trigger:
 * hover-opening cannot be operated by touch or keyboard, and combining it with
 * click produces the classic "click closes it and hover immediately reopens
 * it" bug. The previous site relied on hover and was unusable on touch.
 */
/*
 * Groups arranged into columns. A group may name its `column`; groups that do
 * not each get a column of their own, which is how every menu but the science
 * one is laid out. Order within a column follows the menu's own order.
 */
/* The least room left between an open panel and the edge of the window. */
const PANEL_MARGIN = 16

function columnsOf(groups) {
  const columns = new Map()
  groups.forEach((group, index) => {
    const key = group.column ?? `own-${index}`
    if (!columns.has(key)) columns.set(key, [])
    columns.get(key).push(group)
  })
  return [...columns.values()]
}

export default function NavDropdown({ item, isOpen, onToggle, onClose }) {
  const buttonRef = useRef(null)
  const panelRef = useRef(null)
  const focusFirstOnOpen = useRef(false)

  const buttonId = `nav-${item.id}-button`
  const panelId = `nav-${item.id}-panel`

  function focusFirstLink() {
    panelRef.current?.querySelector('a')?.focus()
  }

  /*
   * ArrowDown should open the menu AND put focus on its first link, but the
   * panel does not exist yet at the moment the key is handled. An effect is
   * the reliable place to do this — it runs after React has committed the
   * panel to the DOM.
   *
   * A requestAnimationFrame callback is not reliable here: it can run before
   * React commits, in which case the focus call silently does nothing. That
   * bug reached the browser once already; a `poll`-based test had hidden it.
   *
   * The flag is a ref, not state, because it must not itself cause a render.
   */
  useEffect(() => {
    if (isOpen && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false
      focusFirstLink()
    }
  }, [isOpen])

  /*
   * Keep the open panel on screen. It opens with its left edge on its
   * trigger's (see .panel). Only when that would carry it past the edge of the
   * window is it moved: first to end where the trigger ends, so it still hangs
   * from its own button, and if even that does not fit, to just inside the
   * window. Measured before paint, so it never visibly jumps, and again
   * whenever the window is resized while it is open.
   *
   * The offset is a CSS custom property written straight to the element
   * rather than React state: it is a layout detail that must not cause a
   * second render.
   */
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!isOpen || !panel) return

    function place() {
      panel.style.setProperty('--panel-shift', '0px')
      const viewport = document.documentElement.clientWidth
      /* No layout to measure (a test environment): leave it under the trigger. */
      if (!viewport) return
      const { left, right } = panel.getBoundingClientRect()
      const triggerRight = panel.parentElement.getBoundingClientRect().right
      const limit = viewport - PANEL_MARGIN
      let shift = 0
      if (right > limit) {
        const underTrigger = triggerRight - right
        shift = left + underTrigger >= PANEL_MARGIN ? underTrigger : limit - right
      }
      if (left + shift < PANEL_MARGIN) shift = PANEL_MARGIN - left
      panel.style.setProperty('--panel-shift', `${Math.round(shift)}px`)
    }

    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [isOpen])

  function handleButtonKeyDown(event) {
    if (event.key !== 'ArrowDown') return

    event.preventDefault()

    if (isOpen) {
      focusFirstLink()
    } else {
      focusFirstOnOpen.current = true
      onToggle()
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && isOpen) {
      event.stopPropagation()
      onClose()
      buttonRef.current?.focus()
    }
  }

  // Close as soon as focus leaves the item entirely, so tabbing past an open
  // menu tidies up after itself.
  function handleBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) onClose()
  }

  return (
    <li className={styles.item} onKeyDown={handleKeyDown} onBlur={handleBlur}>
      <button
        type="button"
        id={buttonId}
        ref={buttonRef}
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={handleButtonKeyDown}
      >
        {item.label}
        <svg
          className={styles.chevron}
          data-open={isOpen || undefined}
          viewBox="0 0 12 12"
          width="12"
          height="12"
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

      {/*
        The panel is unmounted when closed rather than hidden with CSS, so its
        links cannot be reached by Tab while invisible.
      */}
      {isOpen && (
        <div
          id={panelId}
          ref={panelRef}
          className={styles.panel}
          data-columns={columnsOf(item.groups).length > 1 || undefined}
        >
          {columnsOf(item.groups).map((column) => (
            <div key={column[0].id} className={styles.column}>
              {column.map((group) => {
                const groupLabelId = `nav-${item.id}-${group.id}-label`

                return (
                  <div key={group.id} className={styles.group}>
                    {/*
                      A plain span, not a heading: this labels a list inside a
                      navigation menu and should not appear in the page's
                      heading outline. `aria-labelledby` gives the list its
                      accessible name, so a screen reader announces "One-molecule
                      methods, list".
                    */}
                    <span id={groupLabelId} className={styles.groupLabel}>
                      {group.label}
                    </span>
                    <ul className={styles.groupList} aria-labelledby={groupLabelId}>
                      {group.items.map((link) => (
                        <li key={link.id}>
                          <MenuLink to={link.to} className={styles.panelLink}>
                            {link.label}
                          </MenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </li>
  )
}
