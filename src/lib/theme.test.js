import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  getResolvedTheme,
  getThemePreference,
  readStoredPreference,
  resolveTheme,
  setThemePreference,
  startThemeSync,
  subscribeTheme,
} from './theme'
import { setColorScheme } from '../test/viewport'

/*
 * The theme preference: Light, Dark or System, remembered when storage
 * allows, following the system while System is chosen, and applied as
 * attributes on <html> (src/lib/theme.js). The first application is the
 * inline script in index.html, which is run here too and held to the same
 * answers.
 */

const root = document.documentElement
const shown = () => ({
  theme: root.dataset.theme,
  preference: root.dataset.themePreference,
  colorScheme: root.style.colorScheme,
})

/* Replace localStorage with one whose every call throws, as a browser with
   storage blocked does. */
function blockStorage() {
  const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
  const fail = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError')
  }
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => ({ getItem: fail, setItem: fail, removeItem: fail, clear: fail }),
  })
  return () => Object.defineProperty(window, 'localStorage', original)
}

describe('the theme preference', () => {
  let stop = null
  afterEach(() => stop?.())

  it('is System on a first visit, showing whatever the system shows', () => {
    setColorScheme('dark')
    stop = startThemeSync()
    expect(getThemePreference()).toBe('system')
    expect(shown()).toEqual({ theme: 'dark', preference: 'system', colorScheme: 'dark' })
  })

  it('shows light on a first visit to a light system', () => {
    stop = startThemeSync()
    expect(shown()).toEqual({ theme: 'light', preference: 'system', colorScheme: 'light' })
  })

  it('applies an explicit choice at once and remembers it', () => {
    stop = startThemeSync()
    setThemePreference('dark')
    expect(shown().theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    setThemePreference('light')
    expect(shown()).toEqual({ theme: 'light', preference: 'light', colorScheme: 'light' })
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('forgets the entry when System is chosen, so it is a first visit again', () => {
    stop = startThemeSync()
    setThemePreference('dark')
    setThemePreference('system')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(shown().preference).toBe('system')
  })

  it('reads a saved choice back on the next visit', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    stop = startThemeSync()
    expect(getThemePreference()).toBe('dark')
    expect(shown().theme).toBe('dark')
  })

  it('ignores a saved value that is not a choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredPreference()).toBe('system')
  })

  it('ignores anything other than the three choices', () => {
    stop = startThemeSync()
    setThemePreference('sepia')
    expect(getThemePreference()).toBe('system')
  })

  it('switches every colour in one frame: transitions are held off while it does', async () => {
    stop = startThemeSync()
    setThemePreference('dark')
    expect(root.dataset.themeSwitching).toBe('')
    await vi.waitFor(() => expect(root.dataset.themeSwitching).toBeUndefined())
    expect(shown().theme).toBe('dark')
  })

  it('tells subscribers, so the control and the canvas can follow', () => {
    stop = startThemeSync()
    const listener = vi.fn()
    const unsubscribe = subscribeTheme(listener)
    setThemePreference('dark')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    setThemePreference('light')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('following the system', () => {
  let stop = null
  afterEach(() => stop?.())

  it('changes with the system while System is chosen', () => {
    stop = startThemeSync()
    const listener = vi.fn()
    subscribeTheme(listener)

    setColorScheme('dark')
    expect(shown().theme).toBe('dark')
    expect(getResolvedTheme()).toBe('dark')
    setColorScheme('light')
    expect(shown().theme).toBe('light')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('stays put when the visitor chose a theme themselves', () => {
    stop = startThemeSync()
    setThemePreference('light')
    setColorScheme('dark')
    expect(shown().theme).toBe('light')
  })

  it('follows a choice made in another tab', () => {
    stop = startThemeSync()
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }))
    expect(getThemePreference()).toBe('dark')
    expect(shown().theme).toBe('dark')
  })
})

describe('without storage', () => {
  let stop = null
  let restore = null
  afterEach(() => {
    stop?.()
    restore?.()
  })

  it('still works for the visit: System first, a choice applied, nothing thrown', () => {
    restore = blockStorage()
    setColorScheme('dark')
    expect(readStoredPreference()).toBe('system')
    stop = startThemeSync()
    expect(shown().theme).toBe('dark')

    expect(() => setThemePreference('light')).not.toThrow()
    expect(shown()).toEqual({ theme: 'light', preference: 'light', colorScheme: 'light' })
    expect(() => setThemePreference('system')).not.toThrow()
    expect(shown().theme).toBe('dark')
  })

  it('still works if the system cannot be asked', () => {
    const matchMedia = window.matchMedia
    window.matchMedia = undefined
    try {
      expect(resolveTheme('system')).toBe('light')
      expect(resolveTheme('dark')).toBe('dark')
    } finally {
      window.matchMedia = matchMedia
    }
  })
})

/*
 * The script in index.html, which sets the theme before the first paint. It
 * cannot import theme.js, so it repeats it; here it must agree with it in
 * every case, and theme.js must start from what it found.
 */
describe('the script in index.html', () => {
  const html = readFileSync(resolve(import.meta.dirname, '../../index.html'), 'utf8')
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  const boot = scripts.find((s) => s.includes('data-theme'))

  const run = () => new Function(boot)()

  it('is in the <head>, before the stylesheets and the app, and uses the same key', () => {
    expect(boot).toBeDefined()
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain(boot)
    expect(html.indexOf(boot)).toBeLessThan(html.indexOf('src="/src/main.jsx"'))
    expect(boot).toContain(`'${THEME_STORAGE_KEY}'`)
  })

  it.each([
    [null, 'light'],
    [null, 'dark'],
    ['light', 'dark'],
    ['dark', 'light'],
    ['system', 'dark'],
    ['nonsense', 'dark'],
  ])('with %s saved on a %s system, agrees with theme.js', (saved, scheme) => {
    if (saved) window.localStorage.setItem(THEME_STORAGE_KEY, saved)
    setColorScheme(scheme)
    run()
    const preference = readStoredPreference()
    expect(shown()).toEqual({
      theme: resolveTheme(preference),
      preference,
      colorScheme: resolveTheme(preference),
    })
    /* And the store takes over from exactly that. */
    expect(getThemePreference()).toBe(preference)
  })

  it('still sets a theme when storage is blocked', () => {
    const restore = blockStorage()
    try {
      setColorScheme('dark')
      expect(run).not.toThrow()
      expect(shown()).toEqual({ theme: 'dark', preference: 'system', colorScheme: 'dark' })
    } finally {
      restore()
    }
  })
})
