import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import TsrOverview, { TsrWorkedExample } from './TsrOverview'
import example from './tsrOverviewExample.json'

/*
 * The figure's numbers come from a real BioTSR 1.0.0 calculation
 * (scripts/figures/tsr-overview-example.py). These tests hold them to the
 * rules the figure illustrates, so an edit to the JSON that breaks the
 * science fails here rather than on the page.
 */
describe('the TSR overview example', () => {
  it('is one integer per labels-and-bins combination, by the mixed-radix rule', () => {
    const [l1, l2, l3] = example.vertices.map((v) => v.label)
    const L = example.labelRadix
    const block = example.distanceClasses * example.thetaClasses
    const key =
      block * (L * L * (l1 - 1) + L * (l2 - 1) + (l3 - 1)) +
      example.thetaClasses * (example.distanceClass - 1) +
      (example.thetaClass - 1)

    expect(key).toBe(example.key)
  })

  it('orders the three distinct labels from highest to lowest', () => {
    const labels = example.vertices.map((v) => v.label)
    expect(labels).toEqual([...labels].sort((a, b) => b - a))
  })

  it('takes the distance from the longest edge, which here is not the base', () => {
    expect(example.maxDistance).toBe(Math.max(example.base, example.edge13, example.edge23))
    expect(example.maxDistance).not.toBe(example.base)
  })

  it('folds the angle into 0–90°', () => {
    expect(example.theta).toBeCloseTo(180 - example.thetaRaw, 1)
    expect(example.theta).toBeLessThanOrEqual(90)
  })

  it('counts every triangle of the chain', () => {
    const n = example.points
    expect(example.triangles).toBe((n * (n - 1) * (n - 2)) / 6)
    expect(example.sameKey).toHaveLength(example.keyFrequency)
  })

  it('puts every triangle with this key in the same two classes', () => {
    const [thetaLow, thetaHigh] = example.thetaClassRange
    const [distanceLow, distanceHigh] = example.distanceClassRange
    for (const triangle of example.sameKey) {
      expect(triangle.theta).toBeGreaterThanOrEqual(thetaLow)
      expect(triangle.theta).toBeLessThan(thetaHigh)
      expect(triangle.maxDistance).toBeGreaterThanOrEqual(distanceLow)
      expect(triangle.maxDistance).toBeLessThan(distanceHigh)
      expect(triangle.maxDistance).toBe(Math.max(...triangle.edges))
    }
  })

  it('shows that a shared key does not mean the same triangle', () => {
    /* The claim the figure makes instead of "similar triangles share a key":
       same labels and classes, measurably different shapes. */
    const bases = example.sameKey.map((t) => t.edges[0])
    expect(Math.max(...bases) - Math.min(...bases)).toBeGreaterThan(2)
  })
})

/* /tsr places the figure and, under its own heading, the worked example. */
function FullFigure() {
  return (
    <>
      <TsrOverview />
      <TsrWorkedExample />
    </>
  )
}

describe('the TSR overview figure', () => {
  it('is an ordered list of six steps, captioned', () => {
    render(<FullFigure />)

    const figure = screen.getByRole('figure', { name: /From a structure to TSR keys/ })
    expect(within(figure).getAllByRole('listitem')).toHaveLength(6)
  })

  it('carries its meaning in text; the drawings are decoration', () => {
    const { container } = render(<FullFigure />)

    for (const svg of container.querySelectorAll('svg')) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
    expect(screen.getByText(/mixed-radix integer/, { selector: 'p' }).textContent).toMatch(
      /= 17,637,781/,
    )
    expect(screen.getByText(/here L2–L3, not the base/)).toBeInTheDocument()
  })

  it('keeps every card to a drawing and a sentence or two', () => {
    /* The numbers live in the worked example; a card that grows a paragraph
       stretches its whole row, which is the fault this layout replaced. */
    render(<FullFigure />)
    const figure = screen.getByRole('figure', { name: /From a structure to TSR keys/ })
    for (const card of within(figure).getAllByRole('listitem')) {
      const text = Array.from(card.querySelectorAll('p'))
        .slice(1)
        .map((p) => p.textContent)
        .join(' ')
      expect(card.querySelectorAll('p')).toHaveLength(2)
      expect(text.length, text).toBeLessThanOrEqual(160)
      expect(text.split(/[.;] /).length, text).toBeLessThanOrEqual(3)
    }
  })

  it('shows the whole key in the key panel, and does not clip it', () => {
    const { container } = render(<FullFigure />)
    const panel = container.querySelector('[class*="keyPanel"]')
    expect(panel.textContent).toContain('17,637,781')
    expect(getComputedStyle(panel).overflow).not.toBe('hidden')
  })

  it('gives the worked example its numbers, without a heading of its own', () => {
    /* The page writes the "Worked example" heading in its Markdown, so the
       heading sits in the outline and the sidebar where the text puts it. */
    const { container } = render(<TsrWorkedExample />)
    expect(container.querySelector('h1, h2, h3, h4')).toBeNull()

    const facts = screen.getAllByRole('term').map((term) => term.textContent)
    expect(facts).toEqual([
      'Vertices, in label order',
      'Base, L1–L2',
      'L1–L3',
      'L2–L3',
      'θ',
      'θ class',
      'Distance class',
      'Key',
    ])
    expect(screen.getByText(/11\.96 Å, the longest edge, so maxDist/)).toBeInTheDocument()
    expect(screen.getByText('11 of 29: 42.64° to under 45.17°')).toBeInTheDocument()
    expect(screen.getByText('5 of 35: 11.00 to under 14.00 Å')).toBeInTheDocument()
    expect(screen.getByText('17,637,781')).toBeInTheDocument()
  })

  it('keeps the encoding and the other triangles in closed disclosures', () => {
    const { container } = render(<TsrWorkedExample />)
    const disclosures = container.querySelectorAll('details')
    expect(disclosures).toHaveLength(2)
    for (const details of disclosures) expect(details.open).toBe(false)

    const rows = within(disclosures[1]).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(example.keyFrequency)
    /* The triangle in the figure first. */
    expect(rows[0]).toHaveTextContent(/^Val70–Ile44–Leu8/)
  })

  it('shows the key as weighted place values, not a sum of labels and bins', () => {
    render(<FullFigure />)
    const text = screen.getByText(/mixed-radix integer/, { selector: 'p' }).textContent
    expect(text).toMatch(/19·30² \+ 9·30 \+ 7 = 17,377/)
    expect(text).toMatch(/17,377·35·29 \+ 4·29 \+ 10 = 17,637,781/)
  })

  it('describes the other triangles with the key by their measurements, not as similar', () => {
    render(<FullFigure />)
    expect(screen.queryByText(/Similar triangles share a key/)).not.toBeInTheDocument()
    const text = screen.getByText(/not the whole triangle/, { selector: 'p' }).textContent
    expect(text).toMatch(/θ lies between 43\.3° and 44\.4°/)
    expect(text).toMatch(/longest edges between 11\.0 and 13\.2 Å/)
    expect(text).toMatch(/bases run from 7\.8 to 12\.2 Å/)
  })

  it('labels the base and the longest edge as different edges in the drawing', () => {
    const { container } = render(<FullFigure />)
    const labels = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent)
    expect(labels).toContain(`base ${example.base} Å`)
    expect(labels).toContain(`maxDist ${example.maxDistance} Å`)
  })

  it('labels the schematic step as schematic', () => {
    render(<FullFigure />)
    expect(screen.getByText(/Step 6 is schematic/)).toBeInTheDocument()
  })
})

describe('the compact overview on the home page', () => {
  it('is the same figure in four steps, from the same calculation', () => {
    render(<TsrOverview variant="compact" />)
    const figure = screen.getByRole('figure', { name: /From a structure to TSR keys/ })
    expect(within(figure).getAllByRole('listitem')).toHaveLength(4)
    expect(within(figure).getByText(/Computed with BioTSR 1\.0\.0/)).toBeInTheDocument()
    expect(within(figure).getByText('17,637,781')).toBeInTheDocument()
  })

  it('says that maxDist is the longest edge, not the base', () => {
    render(<TsrOverview variant="compact" />)
    expect(screen.getByText(/The longest\s+edge, here L2–L3, gives maxDist/)).toBeInTheDocument()
  })

  it('has no worked example of its own; the home page links to /tsr', () => {
    render(<TsrOverview variant="compact" />)
    expect(screen.queryByRole('term')).not.toBeInTheDocument()
  })
})
