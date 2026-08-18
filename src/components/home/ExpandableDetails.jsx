import styles from './ExpandableDetails.module.css'

/*
 * Supporting detail, folded away until someone wants it.
 *
 * Native <details>/<summary>, not a stateful accordion. It is keyboard
 * operable, announced correctly and works before JavaScript has run, all
 * without a line of code here — a hand-built version would be more code doing
 * the same job slightly worse. The site already uses the same element for
 * publication abstracts and the mobile section menu.
 *
 * NO ARIA. `aria-expanded` and `role="button"` on a summary duplicate what the
 * element already reports and can override it with something less accurate.
 *
 * Renders NOTHING when there are no paragraphs. That is the whole reason this
 * is a component rather than markup repeated twice: an editor who clears the
 * acknowledgments in the CMS should get no section, not a control that opens
 * onto an empty box.
 */
export default function ExpandableDetails({ label, paragraphs, className }) {
  const content = (paragraphs ?? []).filter(
    (paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '',
  )

  if (content.length === 0 || !label?.trim()) return null

  return (
    <details className={[styles.details, className].filter(Boolean).join(' ')}>
      <summary className={styles.summary}>{label}</summary>
      <div className={styles.content}>
        {content.map((paragraph) => (
          <p key={paragraph.slice(0, 60)}>{paragraph}</p>
        ))}
      </div>
    </details>
  )
}
