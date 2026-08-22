import { Children } from 'react'
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
 * Two ways to fill it. `paragraphs` is the common case — a list of prose from
 * the CMS, one paragraph each. `children` is for a section whose detail has
 * real structure, such as funding's award list; passing markup rather than
 * pre-formatted text is what stops an editor having to build a layout out of
 * line breaks in a text box.
 *
 * Renders NOTHING when there is nothing behind the label. That is the whole
 * reason this is a component rather than markup repeated twice: an editor who
 * clears the content in the CMS should get no disclosure, not a control that
 * opens onto an empty box. A `false` child — the caller's own "there are no
 * awards" test — counts as nothing, which is why children are counted with
 * Children.toArray rather than by their presence.
 */
export default function ExpandableDetails({
  label,
  paragraphs,
  children,
  className,
}) {
  const content = (paragraphs ?? []).filter(
    (paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '',
  )
  const structured = Children.toArray(children)

  if ((content.length === 0 && structured.length === 0) || !label?.trim()) {
    return null
  }

  return (
    <details className={[styles.details, className].filter(Boolean).join(' ')}>
      <summary className={styles.summary}>{label}</summary>
      <div className={styles.content}>
        {structured.length > 0
          ? structured
          : content.map((paragraph) => (
              <p key={paragraph.slice(0, 60)}>{paragraph}</p>
            ))}
      </div>
    </details>
  )
}
