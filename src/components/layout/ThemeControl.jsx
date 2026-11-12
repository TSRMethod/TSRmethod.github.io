import { useEffect, useId, useRef, useState } from 'react'
import { setThemePreference, useThemePreference } from '../../hooks/useTheme'
import { MoonIcon, SunIcon, SystemIcon } from '../shared/icons'
import styles from './ThemeControl.module.css'

/*
 * The theme control: Light, Dark or System.
 *
 * THE CHOICES ARE NATIVE RADIO BUTTONS in a fieldset, so each has a label, a
 * checked state and a group name that every screen reader announces, and the
 * arrow keys move between them without any code here. Choosing applies at
 * once; there is no Save.
 *
 * Two presentations of the same group:
 *   - ThemeMenu, in the desktop header: one compact button that opens the
 *     three choices under it, on the ARIA disclosure pattern the navigation
 *     dropdowns use (NavDropdown.jsx).
 *   - ThemeOptions on its own, at the foot of the mobile menu, always open.
 *
 * Nothing here is rendered differently for one theme or another, so the
 * page's HTML is the same for every visitor and hydrates cleanly. The button's
 * icon is the one thing that must be right before React has run; all three
 * are in the HTML and CSS shows the one <html data-theme-preference> names.
 * Without JavaScript the control could do nothing, so it is not shown at all
 * (the attribute is only set by script).
 */

const OPTIONS = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
  { value: 'system', label: 'System', Icon: SystemIcon },
]

const LABELS = Object.fromEntries(OPTIONS.map((o) => [o.value, o.label]))

export function ThemeOptions({ variant = 'drawer', onPointerChoice }) {
  const preference = useThemePreference()
  const name = useId()
  /*
   * Whether the last choice came from a pointer. A pointer choice closes the
   * desktop menu; a keyboard one does not, because the arrow keys choose as
   * they move and closing would end the move. Both reach the radio as a
   * click, so this is told apart by what came just before it.
   */
  const byPointer = useRef(false)

  const choose = (value, event) => {
    setThemePreference(value)
    if (event.type === 'click' && byPointer.current) onPointerChoice?.()
  }

  return (
    <fieldset
      className={`${styles.fieldset} ${styles[variant]}`}
      onPointerDown={() => (byPointer.current = true)}
      onKeyDown={() => (byPointer.current = false)}
    >
      <legend className={styles.legend}>Theme</legend>
      <div className={styles.options}>
        {OPTIONS.map(({ value, label, Icon }) => (
          <label key={value} className={styles.option} data-checked={preference === value || undefined}>
            <input
              type="radio"
              className={styles.radio}
              name={name}
              value={value}
              checked={preference === value}
              /* The click also covers choosing the option already chosen,
                 which fires no change but should still close the menu. */
              onClick={(event) => choose(value, event)}
              onChange={(event) => choose(value, event)}
            />
            <Icon className={styles.icon} width="18" height="18" />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export default function ThemeMenu() {
  const preference = useThemePreference()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen])

  /*
   * Opening puts focus on the chosen option, as a radio group expects.
   *
   * Both focus moves pass preventScroll. The control is in the sticky header,
   * which is always on screen, but a browser asked to reveal an element in a
   * sticky box scrolls towards where the box would sit in the flow — the top
   * of the page — so a reader halfway down the lesson was thrown back to the
   * start by choosing a theme (MobileNav.jsx has the same guard).
   */
  useEffect(() => {
    if (isOpen) rootRef.current?.querySelector('input:checked')?.focus({ preventScroll: true })
  }, [isOpen])

  function close({ restoreFocus }) {
    setIsOpen(false)
    if (restoreFocus) buttonRef.current?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={rootRef}
      className={styles.menu}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          event.stopPropagation()
          close({ restoreFocus: true })
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <button
        type="button"
        ref={buttonRef}
        className={styles.trigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={`Theme: ${LABELS[preference]}`}
        title="Theme"
        onClick={() => setIsOpen(!isOpen)}
      >
        {OPTIONS.map(({ value, Icon }) => (
          <Icon key={value} className={styles.triggerIcon} data-for={value} width="20" height="20" />
        ))}
      </button>

      {isOpen && (
        <div id={panelId} className={styles.panel}>
          <ThemeOptions variant="popover" onPointerChoice={() => close({ restoreFocus: true })} />
        </div>
      )}
    </div>
  )
}
