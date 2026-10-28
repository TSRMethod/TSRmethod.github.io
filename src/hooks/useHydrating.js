import { useSyncExternalStore } from 'react'

/*
 * True while React is building the page at build time, or taking over that
 * prerendered HTML in the browser; false for every other render.
 *
 * `useSyncExternalStore` reads its server snapshot in exactly those two
 * situations, which is what makes this reliable without a global flag: a
 * method page whose code arrives a moment after the rest of the page is
 * still hydrating when it renders, and reports true then too.
 */
const subscribe = () => () => {}

export default function useHydrating() {
  return useSyncExternalStore(
    subscribe,
    () => false,
    () => true,
  )
}
