import { useCallback, useSyncExternalStore } from 'react'

/*
 * Subscribes to a CSS media query.
 *
 * Used to decide whether to render the desktop navigation or the mobile
 * drawer. Only ONE of the two is ever in the DOM, which is what keeps element
 * IDs unique and stops a hidden menu from holding invisible tab stops — a
 * problem the previous site had, because it rendered both and hid one in CSS.
 *
 * `useSyncExternalStore` (rather than useState + useEffect) means the correct
 * value is available on the very first render, so there is no flash of the
 * wrong navigation.
 */
export default function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  )

  // Server snapshot: unused today (the site is client-rendered) but required
  // by the hook signature.
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Width at which a page's content switches to its two-column desktop layout —
 * the method-page section sidebar, and the home introduction's side-by-side
 * text and diagram.
 */
export const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Width at which the desktop navigation bar replaces the mobile drawer.
 *
 * DELIBERATELY HIGHER than the content breakpoint, and the number is measured
 * rather than chosen. The header lays out as:
 *
 *   mark 40 + gap 12 + "TSR Research Group" 177 + gap 16 + nav 833 + padding 32
 *   = 1110px
 *
 * Below that the group's own name is the thing that gives way, because it is
 * the only flexible item in the row: at 1100px it was ellipsised, and at
 * 1024px — exactly where the desktop navigation used to switch on — it
 * collapsed to nothing, leaving a bare logo and no site name at all.
 *
 * The bar is what does not fit, so the bar is what moves. 1150px is the
 * measured minimum plus enough slack that a menu label can grow a little
 * without the identity paying for it. Between 1024 and 1150 the page content
 * is in its desktop layout while navigation is still the drawer, which is a
 * combination tablets have used for years.
 *
 * If a menu item is ever added, re-measure. Do not shave the brand instead.
 */
export const NAV_QUERY = '(min-width: 1150px)'

/**
 * Set when the reader has asked their system for less motion.
 *
 * Everything decorative on this site is expected to consult this: the CSS
 * reset already shortens transitions to nothing, but a scroll reveal starts
 * from `opacity: 0`, and a transition that has been shortened away would
 * leave that element invisible forever. Components read this and skip the
 * hidden state entirely, so the content is simply there.
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
