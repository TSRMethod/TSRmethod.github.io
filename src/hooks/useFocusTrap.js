import { useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(
    (element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true',
  )
}

/*
 * While `active`, moves focus into `containerRef` and keeps Tab and Shift+Tab
 * cycling within it. This is what makes the mobile drawer behave like a
 * dialog: a keyboard user cannot tab out of it into the page behind.
 *
 * Deliberately does NOT restore focus when it deactivates. Where focus should
 * land depends on why the drawer closed — back to the toggle button when the
 * user dismissed it, but onto the new page when they followed a link — so the
 * caller decides. Putting that policy in the hook made the two cases fight
 * each other.
 */
export default function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active) return

    const container = containerRef.current
    if (!container) return

    focusableWithin(container)[0]?.focus()

    function handleKeyDown(event) {
      if (event.key !== 'Tab') return

      const focusable = focusableWithin(container)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [containerRef, active])
}
