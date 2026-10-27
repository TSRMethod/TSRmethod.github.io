import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MethodPage from '../method/MethodPage'
import { DIAGRAMS } from './diagrams'
import { DIAGRAM_IDS, publishedMethods } from '../../content'
import ModifierScope from './ModifierScope'
import CrossTriangles from './CrossTriangles'
import PointChoice from './PointChoice'
import ClusteringExample from './ClusteringExample'
import capabilities from '../../../scripts/figures/data/biotsr-1.0.0-capabilities.json'
import cross from './crossExample.json'
import points from './pointChoiceExample.json'
import clustering from './clusteringExample.json'

/*
 * The site's drawn figures. Each one's numbers come from a BioTSR 1.0.0 run
 * (scripts/figures/*), and these tests hold the data to the rules each
 * figure illustrates, and each figure to what it may and may not claim.
 */

const choose = (n, k) => (k === 2 ? (n * (n - 1)) / 2 : (n * (n - 1) * (n - 2)) / 6)

describe('the diagram registry', () => {
  it('knows the same ids as the content validator', () => {
    expect(Object.keys(DIAGRAMS).sort()).toEqual([...DIAGRAM_IDS].sort())
  })

  it('renders a figure placed in a page’s Markdown, where it was placed', () => {
    render(
      <MemoryRouter>
        <MethodPage slug="nucleotide-protein" />
      </MemoryRouter>,
    )
    const figure = screen.getByRole('figure', { name: /Cross TSR for DG 8/ })
    const heading = screen.getByRole('heading', { level: 2, name: 'Run it with BioTSR' })
    // After its section heading, not hoisted to the top of the page.
    expect(heading.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(figure.closest('p')).toBeNull()
  })

  it('places every new figure on at least one published page', () => {
    const used = publishedMethods.flatMap((m) => [
      ...(m.diagram ? [m.diagram] : []),
      ...[...m.body.matchAll(/\]\(diagram:([a-z-]+)/g)].map((match) => match[1]),
    ])
    for (const id of DIAGRAM_IDS) expect(used, id).toContain(id)
  })
})

describe('which methods take which option', () => {
  const methodsTaking = (key) => capabilities.methods.filter((m) => m[key]).map((m) => m.id).sort()

  it('reads the released capability matrix', () => {
    expect(capabilities.methods).toHaveLength(20)
    expect(capabilities.source).toMatch(/v1\.0\.0/)
  })

  it('matches the user guide: grouping and SSE on the Cα methods, mirror off the cross ones', () => {
    expect(methodsTaking('aaGrouping')).toEqual(['aa_selection', 'protein'])
    expect(methodsTaking('sse')).toEqual(['aa_selection', 'protein'])
    expect(methodsTaking('mirror')).toHaveLength(15)
    expect(capabilities.methods.filter((m) => m.mirror && m.cross)).toEqual([])
    expect(methodsTaking('sizeFilter')).toHaveLength(20)
  })

  it('marks the page’s own option in words, not only by colour', () => {
    render(<ModifierScope highlight="mirror" />)
    const row = screen.getByRole('rowheader', { name: /Mirror images/ }).closest('tr')
    expect(within(row).getByText('this page')).toBeInTheDocument()
    // Every cell says in text whether the family takes it.
    expect(within(row).getAllByText(/^(all methods|not available)$/)).toHaveLength(4)
  })

  it('says SSE changes no key', () => {
    render(<ModifierScope />)
    const row = screen.getByRole('rowheader', { name: /Secondary structure/ }).closest('tr')
    expect(row).toHaveTextContent(/Keys unchanged/)
  })
})

describe('cross TSR', () => {
  it('counts exactly the mixed-side triangles, in every recorded run', () => {
    for (const example of Object.values(cross.examples)) {
      for (const run of example.runs) {
        const [a, b] = [run.poolA, run.poolB]
        expect(run.triangles).toBe(a * choose(b, 2) + b * choose(a, 2))
        expect(run.atomsA).toHaveLength(a)
        expect(run.atomsB).toHaveLength(b)
      }
    }
  })

  it('prints the formula with the run’s own numbers', () => {
    render(<CrossTriangles />)
    expect(screen.getByText(/4 × C\(7, 2\) \+\s*7 × C\(4, 2\) = 84 \+ 42 =/)).toBeInTheDocument()
    expect(screen.getByText('126 triangles')).toBeInTheDocument()
    expect(screen.getByText(/At a 3.0 Å cutoff/)).toHaveTextContent(/4 protein atoms .* 48 triangles/)
  })

  it('puts the ligand on the left even where BioTSR calls the protein side A', () => {
    render(<CrossTriangles example="drug" />)
    expect(screen.getByText('Ligand BEN 1')).toBeInTheDocument()
    expect(screen.getByText(/3 of 9 heavy atoms in contact/)).toBeInTheDocument()
  })

  it('says the drawing is schematic and the atoms are BioTSR’s', () => {
    render(<CrossTriangles />)
    expect(screen.getByRole('figure')).toHaveTextContent(/drawing between them is schematic/)
  })
})

describe('Cα or atoms', () => {
  it('draws Leu15’s heavy atoms, and their count matches the triangles', () => {
    expect(points.atoms).toHaveLength(8)
    expect(points.triangles).toBe(choose(points.atoms.length, 3))
    expect(points.atoms.map((a) => a.label).sort()).toEqual([106, 106, 106, 106, 106, 106, 108, 109])
  })

  it('says the bonds are for orientation only', () => {
    render(<PointChoice />)
    expect(screen.getByRole('figure')).toHaveTextContent(/TSR does not use them/)
  })
})

describe('the clustering example', () => {
  it('is BioTSR’s tree: 22 samples, 21 merges, monotonic heights', () => {
    expect(clustering.leaves).toHaveLength(22)
    expect(clustering.merges).toHaveLength(21)
    const heights = clustering.merges.map((m) => m.height)
    expect(heights).toEqual([...heights].sort((a, b) => a - b))
    expect(clustering.flatPartition).toBeNull()
  })

  it('draws a symmetric distance matrix with zero on the diagonal', () => {
    const d = clustering.distance
    for (let i = 0; i < d.length; i++) {
      expect(d[i][i]).toBe(0)
      for (let j = 0; j < d.length; j++) expect(d[i][j]).toBe(d[j][i])
    }
  })

  it('chooses no number of clusters, and says so', () => {
    render(<ClusteringExample />)
    const figure = screen.getByRole('figure')
    expect(figure).toHaveTextContent(/No number of clusters was chosen/)
    expect(figure).not.toHaveTextContent(/\d+ clusters/)
  })

  it('counts the same-base merges from the data, matching the tutorial', () => {
    render(<ClusteringExample />)
    expect(screen.getByRole('figure')).toHaveTextContent(
      /the first 18 of the 21 merges,\s*up to a distance of 0\.63/,
    )
  })

  it('describes the heat map in text for a screen reader', () => {
    render(<ClusteringExample />)
    expect(screen.getByRole('img')).toHaveAccessibleName(/Rows, top to bottom, are DA ×4, DG ×8, DT ×4, DC ×6/)
  })
})
