import { useSyncExternalStore } from 'react'
import {
  getResolvedTheme,
  getThemePreference,
  setThemePreference,
  subscribeTheme,
} from '../lib/theme'

/*
 * The colour theme, for the few components that need to know it: the theme
 * control, and the lesson's canvas, which redraws in the new colours.
 *
 * Styling never needs this; tokens.css follows <html data-theme> by itself.
 *
 * While the page is built, and while the browser takes that HTML over, the
 * answer is the server's: 'system', and null for what is showing, because
 * neither can be known without a browser. React re-renders with the real
 * values straight after hydration, so the HTML always matches. The control's
 * visible state does not wait for that: it is drawn from <html
 * data-theme-preference> in CSS (ThemeControl.module.css).
 */
const serverPreference = () => 'system'
const serverTheme = () => null

export function useThemePreference() {
  return useSyncExternalStore(subscribeTheme, getThemePreference, serverPreference)
}

export function useResolvedTheme() {
  return useSyncExternalStore(subscribeTheme, getResolvedTheme, serverTheme)
}

export { setThemePreference }
