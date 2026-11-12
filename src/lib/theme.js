/*
 * The colour theme: Light, Dark, or System (the default), and the one place
 * that decides which is showing.
 *
 * THE THEME IS AN ATTRIBUTE ON <html>, never React state, so nothing about it
 * is rendered and there is nothing to hydrate:
 *
 *   data-theme="light" | "dark"                  what is showing
 *   data-theme-preference="light" | "dark" | "system"   what was chosen
 *
 * tokens.css defines every colour for both values of data-theme. The first
 * time, before anything is painted, the inline script in index.html sets both
 * attributes; it repeats readStoredPreference and resolveTheme below in a few
 * lines of plain script, because it must run before any module loads.
 * theme.test.js runs that script and holds the two to the same answers.
 *
 * AN EXPLICIT CHOICE IS REMEMBERED in localStorage. Choosing System removes
 * the entry, so a visitor who never chose anything and one who chose System
 * are the same visitor. If storage cannot be read or written (blocked
 * cookies, a private window, a quota), the choice still applies for the rest
 * of the visit and the site works exactly as before; it is just not kept.
 *
 * While System is chosen the theme follows the operating system as it
 * changes, and a choice made in another tab of the site is followed here too.
 */

export const THEME_STORAGE_KEY = 'tsr-theme'
export const THEME_PREFERENCES = ['light', 'dark', 'system']
export const DARK_QUERY = '(prefers-color-scheme: dark)'

const isPreference = (value) => THEME_PREFERENCES.includes(value)

/** The visitor's saved choice, or 'system' if there is none or it cannot be read. */
export function readStoredPreference() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isPreference(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function writeStoredPreference(preference) {
  try {
    if (preference === 'system') window.localStorage.removeItem(THEME_STORAGE_KEY)
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* Not kept; still applied for this visit. */
  }
}

function systemIsDark() {
  try {
    return window.matchMedia(DARK_QUERY).matches
  } catch {
    return false
  }
}

/** 'light' or 'dark': what a preference shows on this system right now. */
export function resolveTheme(preference) {
  if (preference === 'light' || preference === 'dark') return preference
  return systemIsDark() ? 'dark' : 'light'
}

/* ---- The store ---- */

let preference = null
const listeners = new Set()

/*
 * Show the current preference. A change of theme switches every colour in
 * the same frame: the header, cards and buttons have colour transitions for
 * hover and scrolling, and left running they would fade a few elements into
 * the new theme behind the rest. base.css turns transitions off while
 * data-theme-switching is present, for the two frames the switch takes.
 */
let switching = 0

function apply({ instant = false } = {}) {
  const root = document.documentElement
  const theme = resolveTheme(preference)
  if (instant && root.dataset.theme !== theme) {
    root.dataset.themeSwitching = ''
    const id = ++switching
    const done = () => {
      if (id === switching) delete root.dataset.themeSwitching
    }
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => window.requestAnimationFrame(done))
    } else {
      setTimeout(done, 0)
    }
  }
  root.dataset.theme = theme
  root.dataset.themePreference = preference
  root.style.colorScheme = theme
}

function notify() {
  listeners.forEach((listener) => listener())
}

/*
 * The preference as the page already shows it: what the script in index.html
 * found, so the store starts from the same answer rather than asking storage
 * a second time and possibly disagreeing.
 */
function current() {
  if (preference === null) {
    const shown = document.documentElement.dataset.themePreference
    preference = isPreference(shown) ? shown : readStoredPreference()
  }
  return preference
}

/** The chosen preference: 'light', 'dark' or 'system'. */
export function getThemePreference() {
  return current()
}

/** What is showing: 'light' or 'dark'. */
export function getResolvedTheme() {
  return resolveTheme(current())
}

/** Choose a theme, show it at once, and remember it if storage allows. */
export function setThemePreference(next) {
  if (!isPreference(next)) return
  current()
  preference = next
  writeStoredPreference(next)
  apply({ instant: true })
  notify()
}

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

let stopSync = null

/*
 * Start following the system and other tabs. Called once by main.jsx; safe
 * to call again. Returns a function that stops (for tests).
 */
export function startThemeSync() {
  if (stopSync) return stopSync
  current()
  apply()

  let media = null
  try {
    media = window.matchMedia(DARK_QUERY)
  } catch {
    media = null
  }
  const onSystemChange = () => {
    if (preference !== 'system') return
    apply({ instant: true })
    notify()
  }
  const onStorage = (event) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return
    preference = readStoredPreference()
    apply({ instant: true })
    notify()
  }

  media?.addEventListener?.('change', onSystemChange)
  window.addEventListener('storage', onStorage)

  stopSync = () => {
    media?.removeEventListener?.('change', onSystemChange)
    window.removeEventListener('storage', onStorage)
    stopSync = null
  }
  return stopSync
}

/** Forget the cached preference (tests only). */
export function resetThemeStore() {
  stopSync?.()
  preference = null
  listeners.clear()
}
