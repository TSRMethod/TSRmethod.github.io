import { useLayoutEffect, useState } from 'react'

/**
 * Keeps content mounted long enough for its closing animation to be seen.
 *
 * React removes an element the moment its condition goes false, which is why
 * things that fade in tend to vanish. This holds the element in the tree for
 * one extra phase — "exiting" — and takes it out when the browser says the
 * animation has finished.
 *
 * THERE IS NO TIMER. A duration written in JavaScript is a second source of
 * truth for something the stylesheet already knows, and the two drift: change
 * the CSS and the element is either cut off early or left behind. The end of
 * the animation is an event, so the event is what is listened to.
 *
 * IT NEVER WAITS FOR SOMETHING THAT WILL NOT HAPPEN. If the element has no
 * animation to run — a reader who asked for reduced motion, a browser that
 * does not support the property being animated, or a test environment with no
 * stylesheet at all — no `animationend` will ever arrive, and waiting for one
 * would leave the drawer mounted for ever. The element is therefore asked
 * whether it is actually going to move, and if not it is removed at once. That
 * is also what keeps this invisible to the existing tests: in jsdom nothing
 * animates, so closing is immediate, exactly as it was before.
 *
 * REOPENING CANCELS THE EXIT. The phase is derived from the caller's own flag
 * during render, so a drawer reopened mid-close is simply open again — there
 * is no half-closed state left behind, and no stale class to clean up.
 *
 * @param {boolean} isOpen whether the caller wants the content shown
 * @param {{current: Element | null}} nodeRef the element that animates —
 *   supplied by the caller so that a component which already holds a ref to
 *   it (the drawer does, for its focus trap) keeps using one ref for one
 *   element rather than two that have to be kept in step
 * @returns {{isMounted: boolean, isExiting: boolean}}
 */
export default function useExitTransition(isOpen, nodeRef) {
  const [isExiting, setIsExiting] = useState(false)
  const [wasOpen, setWasOpen] = useState(isOpen)

  /*
   * Adjusted during render rather than in an effect, the same way the drawer
   * reacts to a route change: React re-runs this component immediately and
   * without painting, so the exiting class is on the element in the very
   * frame it stops being open. Doing it in an effect would paint one frame of
   * the closed state first, which is the flash this exists to prevent.
   */
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    setIsExiting(!isOpen)
  }

  useLayoutEffect(() => {
    if (!isExiting) return

    const node = nodeRef.current
    if (!node || !willAnimate(node) || !isRendering()) {
      setIsExiting(false)
      return
    }

    /*
     * Native listeners rather than React's `onAnimationEnd`, for two reasons.
     * They are attached to the element itself, so an animation finishing on a
     * child — a chevron, a nested panel — is filtered out by comparing
     * targets rather than relying on where React happened to delegate. And
     * `animationcancel` is included, which React does not surface at all:
     * without it, an exit interrupted by the element being hidden would leave
     * the phase stuck on.
     */
    const finish = (event) => {
      if (event.target === node) setIsExiting(false)
    }

    for (const type of ['animationend', 'animationcancel', 'transitionend']) {
      node.addEventListener(type, finish)
    }

    /*
     * A browser does not run animations in a document it is not rendering, so
     * a tab sent to the background mid-exit would never deliver the event
     * that ends this phase and the panel would sit there until the reader
     * came back. Nothing is visible to animate at that point anyway, so the
     * exit is simply finished.
     */
    const finishIfHidden = () => {
      if (!isRendering()) setIsExiting(false)
    }
    document.addEventListener('visibilitychange', finishIfHidden)

    return () => {
      for (const type of ['animationend', 'animationcancel', 'transitionend']) {
        node.removeEventListener(type, finish)
      }
      document.removeEventListener('visibilitychange', finishIfHidden)
    }
  }, [isExiting, nodeRef])

  return { isMounted: isOpen || isExiting, isExiting }
}

/** Is the document being painted at all? Nothing animates in a hidden tab. */
function isRendering() {
  return typeof document === 'undefined' || document.visibilityState !== 'hidden'
}

/** Is this element actually going to move when its class changes? */
function willAnimate(node) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return false

  const style = window.getComputedStyle(node)
  return longest(style.animationDuration) > 0 || longest(style.transitionDuration) > 0
}

/** The longest duration in a comma-separated CSS duration list, in seconds. */
function longest(value) {
  if (!value) return 0

  return value
    .split(',')
    .reduce((max, part) => Math.max(max, Number.parseFloat(part) || 0), 0)
}
