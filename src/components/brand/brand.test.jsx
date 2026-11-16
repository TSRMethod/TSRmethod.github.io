import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../../app/App'
import BrandSymbol from './BrandSymbol'
import symbol from './symbol.json'

/*
 * The group's identity on the site: one geometry (symbol.json) drawn inline
 * by the header and footer and baked into the favicon and other images by
 * scripts/brand-assets.mjs, and one licensed typeface for the wordmark.
 */

const root = process.cwd()
const pngSize = (path) => {
  const b = readFileSync(resolve(root, path))
  expect(b.subarray(1, 4).toString('latin1')).toBe('PNG')
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

describe('BrandSymbol', () => {
  it('is decorative, so it never adds to an accessible name', () => {
    const { container } = render(<BrandSymbol />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('focusable', 'false')
    expect(svg).not.toHaveAttribute('role')
  })

  it('keeps the artwork\'s proportions', () => {
    const { container } = render(<BrandSymbol />)
    const v = symbol.versions.full
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', `0 0 ${v.width} ${v.height}`)
  })

  it('draws the one-colour small version in currentColor, without the θ sector', () => {
    const { container } = render(<BrandSymbol version="small" tone="mono" />)
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(2)
    for (const path of paths) expect(path).not.toHaveAttribute('class')
    expect(symbol.versions.small.sector).toBeNull()
  })
})

describe('the footer', () => {
  it('signs the group\'s column with the muted symbol, hidden from assistive technology', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    )
    const footer = screen.getByRole('contentinfo')
    const svg = footer.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('data-version', 'small')
    expect(svg).toHaveAttribute('data-tone', 'mono')
    /* Beside the group's name, which still heads the column. */
    expect(within(svg.closest('div')).getByRole('heading', { level: 2 })).toHaveTextContent('TSR Research Group')
  })
})

describe('the brand images', () => {
  it('draws the favicon from the same geometry as the header', () => {
    const favicon = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8')
    expect(favicon).toContain(symbol.versions.small.partA)
    expect(favicon).toContain(symbol.versions.small.partB)
    expect(favicon).toContain('prefers-color-scheme:dark')
  })

  it('keeps the favicon and touch-icon addresses every page names', () => {
    const html = readFileSync(resolve(root, 'index.html'), 'utf8')
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />')
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" />')
  })

  it('exports each image at its intended size', () => {
    expect(pngSize('public/apple-touch-icon.png')).toEqual([180, 180])
    expect(pngSize('public/images/brand/tsr-logo.png')).toEqual([512, 512])
    expect(pngSize('public/share/social-card.png')).toEqual([1200, 630])
  })
})

describe('the wordmark\'s typeface', () => {
  const FONTS = 'public/fonts/ibm-plex-sans'

  it('serves IBM Plex Sans with the licence that must accompany it', () => {
    const files = readdirSync(resolve(root, FONTS)).sort()
    expect(files).toEqual(['IBMPlexSans-Regular-Latin1.woff2', 'IBMPlexSans-SemiBold-Latin1.woff2', 'OFL.txt'])
    const licence = readFileSync(resolve(root, FONTS, 'OFL.txt'), 'utf8')
    expect(licence).toContain('SIL OPEN FONT LICENSE Version 1.1')
    expect(licence).toContain('Reserved Font Name "Plex"')
  })

  it('keeps the licence beside the copy used to regenerate the images', () => {
    expect(existsSync(resolve(root, 'assets/brand/fonts/OFL.txt'))).toBe(true)
    expect(existsSync(resolve(root, 'assets/brand/fonts/IBMPlexSans-Regular.ttf'))).toBe(true)
  })

  it('declares only fonts that exist, and only for the brand token', () => {
    const css = readFileSync(resolve(root, 'src/styles/base.css'), 'utf8')
    const urls = [...css.matchAll(/url\("([^"]+\.woff2)"\)/g)].map((m) => m[1])
    expect(urls).toHaveLength(2)
    for (const url of urls) expect(existsSync(resolve(root, 'public', url.slice(1)))).toBe(true)
    const tokens = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8')
    /* The body text keeps the system stack; Plex is the wordmark's alone. */
    expect(/--font-sans:[^;]*Plex/.test(tokens)).toBe(false)
    expect(tokens).toContain('--font-brand: "IBM Plex Sans", var(--font-sans);')
  })
})
