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

/** Width at which the desktop navigation replaces the mobile drawer. */
export const DESKTOP_QUERY = '(min-width: 1024px)'
