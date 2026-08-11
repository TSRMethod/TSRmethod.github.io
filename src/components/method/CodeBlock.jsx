import { useEffect, useRef, useState } from 'react'
import styles from './CodeBlock.module.css'

/*
 * A fenced code block: language label, copy button, and a horizontally
 * scrollable code area.
 *
 * Accessibility notes:
 *
 *   - The <pre> is `tabindex="0"` because it scrolls sideways. A region that
 *     scrolls must be reachable by keyboard, otherwise someone who cannot use
 *     a mouse cannot read the right-hand end of a long line (WCAG 2.1.1).
 *
 *   - The block is a <figure> with a <figcaption>, so the language label
 *     gives the focusable area an accessible name. Using role="region" would
 *     also do that, but it would register every code block on the page as a
 *     landmark, which makes the landmark list useless on a tutorial page with
 *     a dozen examples.
 *
 *   - The copy button reports its result in an aria-live region rather than
 *     only changing colour.
 *
 * There is deliberately no syntax highlighting. It was judged not worth the
 * bundle cost for now; adding a rehype highlighter later would not change
 * this component's interface.
 */
export default function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const timeout = useRef(null)

  useEffect(() => () => clearTimeout(timeout.current), [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setCopyFailed(false)
    } catch {
      // Clipboard access can be refused (insecure origin, denied permission).
      // Say so rather than showing a success state that did not happen.
      setCopyFailed(true)
      setCopied(false)
    }
    clearTimeout(timeout.current)
    timeout.current = setTimeout(() => {
      setCopied(false)
      setCopyFailed(false)
    }, 2000)
  }

  const label = filename ?? language ?? 'code'
  const state = copied ? 'Copied' : copyFailed ? 'Copy failed' : 'Copy'

  return (
    <figure className={styles.wrapper}>
      <figcaption className={styles.header}>
        <span className={styles.label}>{label}</span>
        {/*
          The name is set with aria-label rather than a visually-hidden span.
          The accessible-name algorithm concatenates child text without
          inserting separators, so "Copy" plus a hidden " tsr_keys.sbatch"
          was being announced as "Copytsr_keys.sbatch". aria-label is
          unambiguous, and is rebuilt from `state` so the name stays in step
          with the visible label.
        */}
        <button
          type="button"
          className={styles.copy}
          onClick={handleCopy}
          aria-label={`${state} ${label}`}
        >
          {state}
        </button>
      </figcaption>

      {/* tabIndex makes the scroll area keyboard-reachable. */}
      <pre className={styles.pre} tabIndex={0}>
        <code className={language ? `language-${language}` : undefined}>
          {code}
        </code>
      </pre>

      <span aria-live="polite" className="visually-hidden">
        {copied ? `${label} copied to clipboard` : ''}
        {copyFailed ? 'Copying failed. Select the text and copy manually.' : ''}
      </span>
    </figure>
  )
}
