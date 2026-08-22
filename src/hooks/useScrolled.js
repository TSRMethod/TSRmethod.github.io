import { useEffect, useState } from 'react'

/*
 * True once the page has been scrolled past a small threshold.
 *
 * Used for the header's scrolled state, and written to be cheap enough to run
 * on every scroll event of every page:
 *
 *   - the listener is PASSIVE, so it can never delay a scroll;
 *   - work is coalesced into one requestAnimationFrame, so a burst of events
 *     between two frames results in a single read;
 *   - `scrollY` is read and compared to a number — no element measurement, so
 *     nothing here forces the browser to recalculate layout;
 *   - React state is set only when the boolean actually flips, so scrolling
 *     down a long page re-renders the header once, not once per event.
 *
 * The threshold is deliberately small. This is not a "scrolled a long way"
 * signal; it answers "has the page moved at all", which is the moment the
 * header stops being part of the top of the page and starts floating over it.
 */
export default function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    let pending = false

    const read = () => {
      /*
       * Cleared before the read, not after the frame id is stored: a
       * synchronous requestAnimationFrame — a test double, or a browser
       * running the callback during the same task — would otherwise leave
       * `pending` set forever and the header stuck in one state.
       */
      pending = false
      setScrolled(window.scrollY > threshold)
    }

    const onScroll = () => {
      if (pending) return
      pending = true
      frame = window.requestAnimationFrame(read)
    }

    /* The page may already be scrolled — a reload part-way down, or a link
       with a hash — so the first value is taken now rather than on the first
       scroll event. */
    read()

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [threshold])

  return scrolled
}
