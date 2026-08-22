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
 * IT OPENS AND CLOSES SMOOTHLY, and there is no JavaScript in that at all.
 * The expansion is a CSS transition on `::details-content` — the box the
 * browser itself wraps a disclosure's content in — so the browser owns the
 * state, the timing and the order of events. An earlier version animated
 * this from React by holding the `open` attribute on during the collapse,
 * and it bought two bugs with it: the first opening after a page load did
 * not animate, because the entrance animation had been attached to the
 * panel since mount rather than started by the opening; and the collapse
 * finished in two steps, because the attribute — and therefore the arrow and
 * the last of the layout — only came off once an animation event said so.
 * Neither is possible here: there is nothing to keep in step.
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
