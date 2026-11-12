import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * The two themes' design tokens (tokens.css).
 *
 * The dark theme is written twice, once for <html data-theme="dark"> and
 * once for a dark system with JavaScript off; the two must be the same. Its
 * text must meet WCAG AA against every surface it is drawn on, and its focus
 * ring and lesson graphics the 3:1 asked of non-text contrast.
 */

const css = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
)

function declarations(body) {
  const tokens = {}
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim().replace(/\s+/g, ' ')
  }
  return tokens
}

const block = (pattern) => {
  const match = css.match(pattern)
  if (!match) throw new Error(`tokens.css: no block for ${pattern}`)
  return match[1]
}

const light = declarations(block(/^:root\s*\{([^}]*)\}/m))
const darkByAttribute = declarations(block(/:root\[data-theme="dark"\]\s*\{([^}]*)\}/))
const darkBySystem = declarations(
  block(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-theme\]\)\s*\{([^}]*)\}/),
)

/* A token's value in a theme, following var() back to the light :root. */
function value(theme, name) {
  const raw = theme[name] ?? light[name]
  const ref = raw?.match(/^var\((--[\w-]+)\)$/)
  return ref ? value(theme, ref[1]) : raw
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const channel = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const SURFACES = [
  '--color-background',
  '--color-panel',
  '--color-surface',
  '--color-surface-raised',
  '--color-primary-light',
]

const TEXT_PAIRS = [
  ...['--color-text', '--color-text-muted', '--color-primary'].flatMap((fg) =>
    SURFACES.map((bg) => [fg, bg]),
  ),
  ['--color-primary-dark', '--color-primary-light'],
  ['--color-primary-dark', '--color-surface-raised'],
  ['--color-on-primary', '--color-primary'],
  ['--color-on-primary', '--color-primary-dark'],
  ['--color-code-text', '--color-code-bg'],
  ['--color-text', '--color-warning-bg'],
  ['--lesson-on-tri', '--lesson-tri'],
  ['--lesson-tri-text', '--lesson-tri-soft'],
  ['--lesson-same', '--lesson-same-soft'],
  ['--color-text', '--lesson-tri-soft'],
  ['--color-text-muted', '--lesson-same-soft'],
]

/* The focus ring, and the lesson's lines and atoms on its canvas. */
const GRAPHIC_PAIRS = [
  ...SURFACES.slice(0, 4).map((bg) => ['--color-focus', bg]),
  ...['--lesson-tri', '--lesson-atom', '--lesson-helix', '--lesson-strand', '--lesson-coil'].map(
    (fg) => [fg, '--color-surface'],
  ),
]

describe('the dark theme tokens', () => {
  it('are written the same way for data-theme="dark" and for a dark system without JavaScript', () => {
    expect(darkBySystem).toEqual(darkByAttribute)
  })

  it('only redefine tokens the light theme has', () => {
    const unknown = Object.keys(darkByAttribute).filter((name) => !(name in light))
    expect(unknown).toEqual([])
  })

  it('set color-scheme, so form controls and scrollbars follow', () => {
    expect(css).toMatch(/:root\[data-theme="dark"\]\s*\{\s*color-scheme: dark;/)
    expect(css).toMatch(/^:root\s*\{\s*color-scheme: light;/m)
  })

  it.each(TEXT_PAIRS)('give %s on %s at least 4.5:1', (fg, bg) => {
    expect(contrast(value(darkByAttribute, fg), value(darkByAttribute, bg))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(GRAPHIC_PAIRS)('give %s on %s at least 3:1', (fg, bg) => {
    expect(contrast(value(darkByAttribute, fg), value(darkByAttribute, bg))).toBeGreaterThanOrEqual(3)
  })
})

/*
 * The light theme was kept as it was, with two lesson colours corrected: the
 * digits on the amber tag (normal-size text, 4.5:1) and the coil line (a
 * graphical object, 3:1 against the canvas it is drawn on).
 */
describe('the light theme lesson colours', () => {
  it('give the amber tag digits at least 4.5:1, on the same amber', () => {
    expect(value(light, '--lesson-tri')).toBe('#c26a00')
    expect(contrast(value(light, '--lesson-on-tri'), value(light, '--lesson-tri'))).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['--lesson-tri', '--lesson-atom', '--lesson-helix', '--lesson-strand', '--lesson-coil'])(
    'give %s at least 3:1 against the canvas',
    (name) => {
      expect(contrast(value(light, name), value(light, '--color-surface'))).toBeGreaterThanOrEqual(3)
    },
  )
})

describe('both themes', () => {
  /* triangleGeometry.js fades these with depth by adding an alpha to the hex. */
  it.each(['--lesson-coil', '--lesson-helix', '--lesson-strand', '--lesson-atom'])(
    'give %s as six-digit hex, which the lesson canvas needs',
    (name) => {
      expect(value(light, name)).toMatch(/^#[0-9a-f]{6}$/i)
      expect(value(darkByAttribute, name)).toMatch(/^#[0-9a-f]{6}$/i)
    },
  )

  it('keep the heat map scale the same, so darker still means more similar', () => {
    for (const name of ['--color-heatmap-similar', '--color-heatmap-distant']) {
      expect(darkByAttribute[name]).toBeUndefined()
    }
    expect(value(light, '--color-heatmap-similar')).toBe(value(light, '--color-primary'))
    expect(value(light, '--color-heatmap-distant')).toBe(value(light, '--color-background'))
  })

  it('keep figures and the QR code on white', () => {
    expect(value(light, '--color-figure-bg')).toBe('#ffffff')
    expect(value(darkByAttribute, '--color-figure-bg')).toBe('#ffffff')
  })

  it('leave the light theme exactly as it was where the dark one adds a token', () => {
    /* New tokens whose light value is the old literal or the page itself. */
    expect(value(light, '--color-panel')).toBe(value(light, '--color-background'))
    expect(value(light, '--color-on-primary')).toBe('#ffffff')
    expect(value(light, '--code-outline-width')).toBe('0px')
    expect(value(light, '--figure-inset')).toBe('0px')
    expect(value(light, '--mark-radius')).toBe('0')
  })
})
