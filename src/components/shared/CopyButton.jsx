import { useEffect, useRef, useState } from 'react'
import styles from './CopyButton.module.css'

/*
 * Copies a short string to the clipboard and says so.
 *
 * A real <button>, so it is focusable, works on Enter and Space, and takes the
 * site's focus ring without anything being added here.
 *
 * The confirmation is an aria-live region rather than a swapped label. If the
 * button's own text changed from "Copy" to "Copied", a screen reader would
 * announce the change only if focus happened to be on it, and the accessible
 * name of the control would keep moving; a polite live region announces the
 * result and leaves the button called what it does.
 *
 * Failure is a state, not a crash. `navigator.clipboard` is undefined outside
 * a secure context and `writeText` rejects when the document is not focused or
 * permission is refused, so both are handled and the address stays visible and
 * selectable next to the button either way.
 */

const RESET_AFTER_MS = 2500

export default function CopyButton({ value, label, copiedLabel, failedLabel }) {
  const [state, setState] = useState('idle')
  const timer = useRef(null)

  /* Clear a pending reset if the component goes away first. */
  useEffect(() => () => clearTimeout(timer.current), [])

  async function handleClick() {
    clearTimeout(timer.current)

    try {
      if (!navigator.clipboard?.writeText) throw new Error('no clipboard')
      await navigator.clipboard.writeText(value)
      setState('copied')
    } catch {
      setState('failed')
    }

    timer.current = setTimeout(() => setState('idle'), RESET_AFTER_MS)
  }

  return (
    <span className={styles.wrapper}>
      <button type="button" className={styles.button} onClick={handleClick}>
        {label}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={styles.status}
        data-state={state}
      >
        {state === 'copied' && copiedLabel}
        {state === 'failed' && failedLabel}
      </span>
    </span>
  )
}
