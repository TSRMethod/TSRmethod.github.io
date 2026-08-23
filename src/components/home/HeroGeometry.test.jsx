import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { load as parseYaml } from 'js-yaml'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import Hero from './Hero'
import { home } from '../../content'
import { ALPHA_CARBONS } from './ubiquitin'
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
  container.querySelector('section div[aria-hidden="true"]')

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

  it('says what the drawing is, in text anyone can read', () => {
    /*
     * The caption is the one part of the figure that is NOT decorative: it
     * credits a real structure, which is worth as much to someone using a
     * screen reader as to anyone looking at it. So it lives outside the
     * aria-hidden layer, and it is ordinary text — no role, no label, nothing
     * to interact with.
     */
    const { container } = renderHero()

    /*
     * The exact string, asserted rather than matched loosely. Its whole job
     * is to name a real Protein Data Bank entry; a caption that drifted into
     * describing the method again — which is what the animation is for —
     * would still pass a substring check for "1UBQ".
     */
    const caption = screen.getByText('PDB ID: 1UBQ')

    expect(caption).toBeInTheDocument()
    expect(caption.closest('[aria-hidden="true"]')).toBeNull()
    expect(caption.getAttribute('role')).toBeNull()
    expect(caption.querySelectorAll('a, button, [tabindex]')).toHaveLength(0)
    /* Below the drawing, inside the same region, not out in the hero text. */
    expect(figureLayer(container).compareDocumentPosition(caption) &
      Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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

describe('the figure is built from the real structure', () => {
  it('draws its triangles between actual α-carbons of the fold', () => {
    /*
     * The claim the figure makes is that this is ubiquitin and these are
     * spatial relationships between its residues. That claim is only true if
     * every corner is a real α-carbon, so it is checked rather than trusted:
     * each vertex must be a point in the derived structure, not a coordinate
     * someone typed to make a nice shape.
     */
    const { container } = renderHero()

    const known = new Set(ALPHA_CARBONS.map(([x, y]) => `${x},${y}`))
    const polygons = [...figureLayer(container).querySelectorAll('polygon')]

    expect(polygons.length).toBeGreaterThanOrEqual(1)

    for (const polygon of polygons) {
      const vertices = polygon.getAttribute('points').split(' ')
      expect(vertices).toHaveLength(3)
      for (const vertex of vertices) {
        expect(known.has(vertex), vertex).toBe(true)
      }
    }
  })

  it('marks every triangle corner with the residue it is drawn from', () => {
    /*
     * The invariant that replaces the old figure's worst artifact: a corner
     * and its residue are not two things kept in step, they are one
     * coordinate used twice. Nothing in this component can move one without
     * the other, and this is what says so.
     */
    const { container } = renderHero()

    for (const triplet of figureLayer(container).querySelectorAll(
      'g[class*="triplet"]',
    )) {
      const vertices = triplet
        .querySelector('polygon')
        .getAttribute('points')
        .split(' ')

      const markers = new Set(
        [...triplet.querySelectorAll('circle')].map(
          (circle) =>
            `${circle.getAttribute('cx')},${circle.getAttribute('cy')}`,
        ),
      )

      for (const vertex of vertices) {
        expect(markers.has(vertex), vertex).toBe(true)
      }
    }
  })

  it('gives no element its own transform to drift with', () => {
    /*
     * Movement belongs to the structure as a whole. The one exception is the
     * ring around a selected residue, which scales about its own centre — the
     * centre being the residue, so it cannot take the point anywhere.
     */
    const { container } = renderHero()

    for (const element of figureLayer(container).querySelectorAll(
      'path, polygon, circle',
    )) {
      const className = element.getAttribute('class') ?? ''
      if (className.includes('selectedRing')) continue
      expect(element.style.transform, className).toBeFalsy()
      expect(element.getAttribute('transform'), className).toBeNull()
    }
  })

  it('draws triangles that are properly scalene', () => {
    /*
     * Not a coordinate test — a meaning test. A TSR key is distinctive
     * because the three sides of the triangle differ; the derivation script
     * selects triplets on exactly that basis, and this holds the shipped
     * figure to it.
     */
    const { container } = renderHero()

    for (const polygon of figureLayer(container).querySelectorAll('polygon')) {
      const points = polygon
        .getAttribute('points')
        .split(' ')
        .map((pair) => pair.split(',').map(Number))

      const [a, b, c] = points
      const side = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1])
      const sides = [side(a, b), side(b, c), side(a, c)].sort((x, y) => x - y)

      expect(sides[2] / sides[0]).toBeGreaterThan(1.4)
      expect(sides[1] / sides[0]).toBeGreaterThan(1.15)
      /* Mutually different, not merely the extremes. */
      expect(sides[2] / sides[1]).toBeGreaterThan(1.1)
    }
  })
})

describe('the figure below the tablet breakpoint', () => {
  /*
   * jsdom has no layout engine, so a media query cannot be exercised by
   * rendering. The stylesheet is read instead — which is the right level
   * anyway, because what is being protected here is a decision rather than a
   * computed pixel: below 768px the hero is text only, and someone reinstating
   * a "simplified" phone figure should have to delete a test that says why not.
   */
  const stylesheet = (name) =>
    readFileSync(resolve(root, 'src/components/home', name), 'utf8')

  /** The body of the one `max-width: 767px` block in a stylesheet, or ''. */
  function phoneBlock(css) {
    const start = css.indexOf('@media (max-width: 767px)')
    if (start === -1) return ''
    let depth = 0
    for (let i = css.indexOf('{', start); i < css.length; i += 1) {
      if (css[i] === '{') depth += 1
      else if (css[i] === '}') {
        depth -= 1
        if (depth === 0) return css.slice(css.indexOf('{', start) + 1, i)
      }
    }
    return ''
  }

  it('hides the whole figure — drawing, triangle and caption alike', () => {
    const block = phoneBlock(stylesheet('HeroGeometry.module.css'))

    /*
     * `.region` is the single box holding the SVG and the caption, so hiding
     * it is what makes "no protein lines, no residues, no triangle, no
     * caption" one rule rather than four that can fall out of step.
     */
    expect(block).toMatch(/\.region\s*\{[^}]*display:\s*none/)
  })

  it('reserves no space for what it is no longer drawing', () => {
    /*
     * The hero band used to carry phone-only bottom padding to sit clear of
     * the caption. With the caption gone that padding would be a blank strip
     * under the buttons — the empty-looking hero this change exists to fix.
     */
    expect(phoneBlock(stylesheet('Hero.module.css'))).toBe('')
  })

  it('hides it whatever the visitor’s motion preference is', () => {
    /*
     * The figure is hidden on a phone because it is too small to read, not
     * because it moves. Nesting the rule inside a motion query — or letting
     * the reduced-motion block put it back — would leave a reduced-motion
     * phone showing the faint, unreadable still this change removed.
     */
    const css = stylesheet('HeroGeometry.module.css')
    const start = css.indexOf('@media (max-width: 767px)')

    expect(start).toBeGreaterThan(-1)
    expect(css.lastIndexOf('@media', start)).toBe(start)

    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion'))
    expect(reduced).not.toMatch(/\.region\s*\{[^}]*display:\s*(?!none)/)
  })
})

describe('the figure with animation switched off', () => {
  it('still shows the protein, its residues and one finished triangle', () => {
    /*
     * The reduced-motion composition has to be a picture in its own right —
     * the fold, the points a key is built from, and one completed
     * relationship — rather than an animation stopped halfway. Nothing may be
     * hidden inline: the visible state is the base state, and the stylesheet
     * only cycles around it.
     */
    setReducedMotion(true)
    const { container } = renderHero()

    const svg = figureLayer(container).querySelector('svg')

    /* The structure: a backbone trace and its residue points. */
    expect(svg.querySelectorAll('path').length).toBeGreaterThanOrEqual(1)
    expect(svg.querySelectorAll('circle').length).toBeGreaterThanOrEqual(12)
    /* At least one relationship to read. */
    expect(svg.querySelectorAll('polygon').length).toBeGreaterThanOrEqual(1)

    for (const shape of svg.querySelectorAll('path, polygon, circle')) {
      expect(shape.style.opacity, shape.tagName).not.toBe('0')
      expect(shape.style.display, shape.tagName).not.toBe('none')
      expect(shape.getAttribute('visibility')).not.toBe('hidden')
    }
  })

  it('marks exactly one triplet as the one shown when nothing animates', () => {
    /*
     * Reduced motion keeps one relationship and drops the rest, so which one
     * has to be named rather than found by position — a positional selector
     * would have matched the residues group instead and left the still with
     * no triangle at all.
     */
    const { container } = renderHero()

    const triplets = [
      ...figureLayer(container).querySelectorAll('g[class*="triplet"]'),
    ]
    const primary = triplets.filter((group) =>
      (group.getAttribute('class') ?? '').includes('primaryTriplet'),
    )

    expect(triplets.length).toBeGreaterThanOrEqual(1)
    expect(primary).toHaveLength(1)
    expect(primary[0]).toBe(triplets[0])
  })
})
