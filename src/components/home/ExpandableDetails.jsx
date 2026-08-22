import { Children, useRef, useState } from 'react'
import useExitTransition from '../../hooks/useExitTransition'
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
 * IT OPENS AND CLOSES SMOOTHLY, and that is the one reason `open` is
 * controlled here rather than left entirely to the browser. A native
 * <details> removes its content the instant it closes, so there is nothing
 * left to animate out; holding the attribute on for the length of the
 * collapse — and only that long — is what makes the panel close rather than
 * vanish. The summary's own click is what drives it, so Enter, Space and a
 * pointer all still work exactly as the element defines them, and the
 * element is still a real <details>: no ARIA is added, and none is needed.
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
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)
  const panel = useExitTransition(isOpen, panelRef)

  const content = (paragraphs ?? []).filter(
    (paragraph) => typeof paragraph === 'string' && paragraph.trim() !== '',
  )
  const structured = Children.toArray(children)

  if ((content.length === 0 && structured.length === 0) || !label?.trim()) {
    return null
  }

  return (
    <details
      className={[styles.details, className].filter(Boolean).join(' ')}
      /*
       * Stays open while the panel is collapsing, so there is something to
       * collapse: the browser hides a closed details' content outright, and
       * an element it has stopped rendering cannot animate.
       * `useExitTransition` ends that phase on the browser's own animation
       * event — and immediately, with no phase at all, when reduced motion
       * means nothing is going to move.
       */
      open={panel.isMounted}
    >
      <summary
        className={styles.summary}
        onClick={(event) => {
          /*
           * The browser's own toggle is declined so that closing can be
           * animated; everything else about the element is untouched. This
           * fires for a click, for Enter and for Space, because that is how
           * a summary reports all three.
           */
          event.preventDefault()
          setIsOpen((open) => !open)
        }}
      >
        {label}
      </summary>

      {/*
        * ALWAYS RENDERED, exactly as a native <details> keeps its content.
        * The browser hides it while the element is closed; it is not removed.
        * That is what lets find-in-page reach it — browsers will open a
        * details to show a match — and what keeps it in the page for anything
        * reading the document rather than looking at it. Mounting it only
        * while open would have been simpler here and worse everywhere else.
        */}
      <div
        ref={panelRef}
        className={[styles.panel, panel.isExiting ? styles.leaving : null]
          .filter(Boolean)
          .join(' ')}
      >
        {/* The row grows; this is the window it grows into. */}
        <div className={styles.content}>
          {structured.length > 0
            ? structured
            : content.map((paragraph) => (
                <p key={paragraph.slice(0, 60)}>{paragraph}</p>
              ))}
        </div>
      </div>
    </details>
  )
}
