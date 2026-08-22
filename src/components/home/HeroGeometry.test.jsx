import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { load as parseYaml } from 'js-yaml'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import Hero from './Hero'
import { home } from '../../content'
import { siteConfig } from '../../app/siteConfig'
import { setReducedMotion } from '../../test/viewport'

/*
 * The hero's decorative figure.
 *
 * What is worth asserting is not where any point sits — that is a drawing,
 * and it should be free to change — but that adding a picture behind the
 * hero did not cost anything: the heading is still the page's only h1, the
 * words still come from the CMS, and the figure is invisible to assistive
 * technology, unreachable by keyboard, and present rather than blank when
 * animation is switched off.
 */

const root = process.cwd()

function renderHero() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Hero />
    </MemoryRouter>,
  )
}

/** The decorative layer: the one element in the hero hidden from the tree. */
const figureLayer = (container) =>
  container.querySelector('section > div[aria-hidden="true"]')

describe('the hero still says what it said', () => {
  it('keeps the group name as the page heading', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(siteConfig.name)
  })

  it('takes its words and both calls to action from content', () => {
    renderHero()

    expect(screen.getByText(home.hero.lede)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: home.hero.primaryCta }),
    ).toHaveAttribute('href', '/tsr')
    expect(
      screen.getByRole('link', { name: home.hero.secondaryCta }),
    ).toHaveAttribute('href', '#methods')
  })

  it('writes none of that in the component', () => {
    const source = readFileSync(resolve(root, 'src/components/home/Hero.jsx'), 'utf8')

    expect(source).not.toContain(home.hero.lede)
    expect(source).not.toContain(home.hero.primaryCta)
    expect(source).not.toContain(home.hero.secondaryCta)
  })

  it('needs no new field in the CMS to draw a picture', () => {
    /*
     * The figure is code, not content. An editor has no business positioning
     * decoration, and nothing about the hero's schema changed to add it.
     */
    const config = parseYaml(readFileSync(resolve(root, '.pages.yml'), 'utf8'))
    const homeEntry = config.content.find((entry) => entry.name === 'home')
    const hero = homeEntry.fields.find((field) => field.name === 'hero')

    expect(hero.fields.map((field) => field.name)).toEqual([
      'lede',
      'primaryCta',
      'secondaryCta',
    ])
  })
})

describe('the figure is decoration and nothing else', () => {
  it('is hidden from the accessibility tree, twice over', () => {
    const { container } = renderHero()

    const layer = figureLayer(container)
    expect(layer).toBeTruthy()
    expect(layer).toHaveAttribute('aria-hidden', 'true')

    const svg = layer.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    /* IE-era SVGs are focusable by default; some browsers still honour it. */
    expect(svg).toHaveAttribute('focusable', 'false')
  })

  it('adds nothing a keyboard can reach', () => {
    const { container } = renderHero()

    expect(
      figureLayer(container).querySelectorAll('a, button, [tabindex], input'),
    ).toHaveLength(0)
  })

  it('adds no text, image or landmark to the hero', () => {
    const { container } = renderHero()
    const layer = figureLayer(container)

    expect(layer.textContent).toBe('')
    expect(within(layer).queryAllByRole('img')).toHaveLength(0)
    expect(layer.querySelector('title, desc')).toBeNull()
  })

  it('leaves the hero links as the only interactive things in it', () => {
    renderHero()

    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      home.hero.primaryCta,
      home.hero.secondaryCta,
    ])
  })
})

describe('the figure with animation switched off', () => {
  it('still draws the geometry rather than an empty band', () => {
    /*
     * The failure this guards is a decorative layer that starts at opacity 0
     * and waits for an animation that reduced motion has removed. Nothing
     * here may be hidden inline: the visible state is the base state, and the
     * stylesheet only cycles around it.
     */
    setReducedMotion(true)
    const { container } = renderHero()

    const svg = figureLayer(container).querySelector('svg')

    expect(svg.querySelectorAll('polygon').length).toBeGreaterThanOrEqual(3)
    expect(svg.querySelectorAll('line').length).toBeGreaterThanOrEqual(8)
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(12)

    for (const shape of svg.querySelectorAll('polygon, line, circle')) {
      expect(shape.style.opacity, shape.tagName).not.toBe('0')
      expect(shape.style.display, shape.tagName).not.toBe('none')
      expect(shape.getAttribute('visibility')).not.toBe('hidden')
    }
  })

  it('draws triangles that are properly scalene', () => {
    /*
     * Not a coordinate test — a meaning test. TSR keys exist because the
     * three sides of a triangle differ; a row of equilateral triangles would
     * illustrate the wrong idea, however pretty it looked. Each triangle's
     * longest side must be clearly longer than its shortest.
     */
    const { container } = renderHero()

    const polygons = [...figureLayer(container).querySelectorAll('polygon')]
    expect(polygons.length).toBeGreaterThanOrEqual(3)

    for (const polygon of polygons) {
      const points = polygon
        .getAttribute('points')
        .split(' ')
        .map((pair) => pair.split(',').map(Number))

      expect(points).toHaveLength(3)

      const [a, b, c] = points
      const side = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])
      const sides = [side(a, b), side(b, c), side(a, c)].sort((x, y) => x - y)

      expect(sides[2] / sides[0]).toBeGreaterThan(1.4)
      expect(sides[1] / sides[0]).toBeGreaterThan(1.15)
    }
  })
})
