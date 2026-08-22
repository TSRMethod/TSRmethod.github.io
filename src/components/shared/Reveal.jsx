import { useEffect, useRef, useState } from 'react'
import useMediaQuery, { REDUCED_MOTION_QUERY } from '../../hooks/useMediaQuery'
import styles from './Reveal.module.css'

/*
 * Fades a section or a card in the first time it is scrolled to.
 *
 * NO ANIMATION LIBRARY. The whole behaviour is one IntersectionObserver and a
 * CSS transition on opacity and transform — about forty lines, no runtime, and
 * nothing to keep in step with React. The alternative was measured rather than
 * assumed: Motion, imported the light way its own documentation recommends
 * (LazyMotion with the DOM feature set), added 74 kB raw / 26 kB gzipped to
 * the main bundle, a fifth of its total, to do exactly this. Stage 9 spent
 * real effort taking that much weight out.
 *
 * ONCE, and only downwards in time: an element that has been revealed stays
 * revealed. Re-animating whenever something scrolls back into view is the
 * single most tiring pattern in this genre.
 *
 * SEMANTICS ARE THE CALLER'S. `as` decides the element, so a card inside a
 * list still renders an <li> and a section still renders a <section>. This
 * component never inserts a wrapper of its own — a <div> between <ul> and
 * <li> would quietly break the list for a screen reader.
 *
 * CONTENT IS NEVER HIDDEN BY DEFAULT. The hidden state is only ever entered
 * when this component knows it can leave it again: an environment without
 * IntersectionObserver, or a reader who has asked for reduced motion, renders
 * the content plainly on the first paint. The stylesheet repeats that rule in
 * CSS, so even a broken script cannot leave the page blank.
 */

/** Delay between neighbours in a group, and the point where it stops growing. */
const STAGGER_STEP_MS = 70
const MAX_STAGGER_STEPS = 5

export default function Reveal({
  as: Element = 'div',
  index = 0,
  className,
  children,
  ...rest
}) {
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)
  const [seen, setSeen] = useState(false)
  const ref = useRef(null)

  /*
   * Derived during render rather than stored: if the observer is missing or
   * motion is unwanted, the element is shown on its first paint with no
   * effect, no state change and no frame in which it is invisible.
   */
  const canObserve = typeof IntersectionObserver !== 'undefined'
  const shown = seen || reducedMotion || !canObserve

  useEffect(() => {
    if (shown) return

    const node = ref.current
    if (!node) return

    /*
     * A direct look at where the element is, used as a backstop for the two
     * moments an observer callback may not arrive.
     *
     * A browser suspends the rendering steps — and with them
     * IntersectionObserver delivery — while a page is in a background tab. A
     * page that loads there would paint its first frame with everything at
     * `opacity: 0`, and if the observer's first delivery were the only path
     * out of that state, whether the reader ever sees the content depends on
     * a callback that is not running. Geometry can be read at any time, so it
     * is read once when the element mounts and again if the page becomes
     * visible, and anything actually on screen is revealed either way.
     */
    const revealIfOnScreen = () => {
      const { top, bottom, height } = node.getBoundingClientRect()

      /*
       * An element with no measurable box is revealed rather than left
       * hidden. It cannot be seen either way, and between "show content that
       * might be off screen" and "hide content that might be on screen",
       * only one of the two can produce a blank page.
       */
      const onScreen = height === 0 || (top < window.innerHeight && bottom > 0)
      if (onScreen) setSeen(true)
      return onScreen
    }

    /* Next frame, so the hidden state has painted and the fade has something
       to run from rather than the element simply appearing. */
    const frame = window.requestAnimationFrame(revealIfOnScreen)

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setSeen(true)
        observer.disconnect()
      },
      /*
       * A little inside the viewport, so an element animates as it arrives
       * rather than exactly on the boundary — and `0` as a second threshold
       * so a section taller than the screen still counts as arrived.
       */
      { rootMargin: '0px 0px -8% 0px', threshold: [0, 0.01] },
    )

    observer.observe(node)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') revealIfOnScreen()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [shown])

  /* Neighbours follow each other by a beat; a long list does not cascade. */
  const delay = Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_MS

  return (
    <Element
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      data-reveal={shown ? 'shown' : 'hidden'}
      style={delay > 0 ? { '--reveal-delay': `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Element>
  )
}
