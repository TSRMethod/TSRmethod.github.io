import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './app/App'
import { NOTEBOOK, VIDEO } from './content/learnResources'
import { verifyTriangles } from './components/learn/triangleGeometry'
import D from './content/learn/fourTriangles.json'
import example from './components/figures/tsrOverviewExample.json'
import notebookHtml from './content/learn/first-10-minutes.html?raw'
import { setViewport } from './test/viewport'

/*
 * Learn BioTSR's lesson and notebook. Three resources that show the same
 * BioTSR numbers must show the same numbers, and must agree with the worked
 * example on Understand TSR; both pages must keep the site's navigation and
 * say where they sit.
 */

const PUBLIC = resolve(__dirname, '../public')
const notebook = JSON.parse(readFileSync(resolve(PUBLIC, NOTEBOOK.file), 'utf8'))

const outputsOf = (id) =>
  notebook.cells
    .find((cell) => cell.id === id)
    .outputs.map((o) => [].concat(o.text ?? o.data?.['text/markdown'] ?? o.data?.['text/plain'] ?? []).join(''))
    .join('\n')

const residues = (t) => t.vertices.map((v) => `${v.res[0]}${v.res.slice(1).toLowerCase()} ${v.seq}`)

/* Evaluate the lazily loaded pages first; see GetStarted.test.jsx. */
await import('./pages/Learn/FourTriangles')
await import('./pages/Learn/FirstTenMinutes')

async function renderAt(path, heading) {
  render(createElement(MemoryRouter, { initialEntries: [path] }, createElement(App)))
  await screen.findByRole('heading', { level: 1, name: heading })
}

describe('the notebook download', () => {
  it('is the file the page states, at its size', () => {
    expect(statSync(resolve(PUBLIC, NOTEBOOK.file)).size).toBe(NOTEBOOK.bytes)
  })
})

/*
 * The video's files: present, at the stated size, and saying what the page
 * says. The caption track and the transcript are one narration; the
 * chapters track and the chapter buttons are one list.
 */
const vtt = (path) =>
  readFileSync(resolve(PUBLIC, path.replace(/^\//, '')), 'utf8')
    .split(/\n\n+/)
    .map((block) => /(\d\d):(\d\d):(\d\d)\.(\d{3}) --> [^\n]+\n([\s\S]+)/.exec(block))
    .filter(Boolean)
    .map(([, h, m, sec, ms, text]) => ({ time: h * 3600 + m * 60 + Number(sec) + ms / 1000, text: text.trim() }))

describe('the video', () => {
  it('is the file the page states, at its size, with its poster', () => {
    expect(statSync(resolve(PUBLIC, VIDEO.src.slice(1))).size).toBe(VIDEO.bytes)
    expect(statSync(resolve(PUBLIC, VIDEO.poster.slice(1))).size).toBeGreaterThan(0)
  })

  it('has captions that say what the transcript says, when it says it', () => {
    const cues = vtt(VIDEO.captions)
    const spoken = VIDEO.transcript.filter((line) => line.speech)
    expect(cues.map((c) => c.text)).toEqual(spoken.map((line) => line.speech))
    cues.forEach((cue, i) => expect(Math.abs(cue.time - spoken[i].time)).toBeLessThan(0.05))
  })

  it('says the replaced narration line as recorded, and the corrected numbers on screen', () => {
    const line = VIDEO.transcript.find((l) => l.speech.startsWith('The carbon alpha cross method'))
    expect(line.time).toBe(54.4)
    expect(line.screen).toContain('contact cutoff set to 8 Å')
    expect(JSON.stringify(VIDEO)).not.toMatch(/bundled/i)
  })

  it('has chapters matching its chapter buttons', () => {
    expect(vtt(VIDEO.chapters)).toEqual(VIDEO.chapterList.map((c) => ({ time: c.time, text: c.title })))
  })

  it('credits its music apart from the software licence', () => {
    expect(VIDEO.credits).toMatch(/^Music: “Nebula” by The Grey Room \/ Density & Time/)
    expect(VIDEO.credits).toMatch(/not covered by BioTSR’s Apache-2\.0 software licence/)
  })
})

describe('the lesson, the notebook and the worked example agree', () => {
  it('the lesson’s data passes its own check against the coordinates', () => {
    expect(verifyTriangles(D)).toBe(true)
    const broken = structuredClone(D)
    broken.triangles[1].theta += 0.01
    expect(() => verifyTriangles(broken)).toThrow(/disagrees/)
  })

  it('on the key, its frequency and the chain totals', () => {
    expect(D.key).toBe(example.key)
    expect(D.frequency).toBe(example.keyFrequency)
    expect([D.n_triangles, D.n_unique_keys]).toEqual([example.triangles, example.distinctKeys])
    expect(outputsOf('keys-row')).toContain(`${D.key}\tregular\t${D.frequency}`)
    expect(outputsOf('counts')).toContain('rows in .triplets:          70,300')
    expect(outputsOf('counts')).toContain('distinct keys (.keys rows): 45,349')
  })

  it('on the four triangles, numbered the same way in all three', () => {
    const lesson = D.triangles.map((t) => residues(t).join(' · '))
    const worked = [
      example.sameKey.find((t) => t.residues.join() === 'VAL70,ILE44,LEU8'),
      ...example.sameKey.filter((t) => t.residues.join() !== 'VAL70,ILE44,LEU8'),
    ].map((t) => t.residues.map((r) => r.replace(/^(\w)(\w\w)(\d+)$/, (_, a, b, n) => `${a}${b.toLowerCase()} ${n}`)).join(' · '))
    expect(lesson).toEqual(worked)

    const table = outputsOf('same-key')
    D.triangles.forEach((t, i) => {
      expect(table).toContain(
        `| ${i + 1} | ${lesson[i]} | ${t.theta.toFixed(2)}° | ${t.theta_class} | ${t.max_distance.toFixed(2)} Å | ${t.distance_class} |`,
      )
    })
  })

  it('on the labels, bins and key arithmetic of triangle 1', () => {
    const [t] = D.triangles
    expect(t.vertices.map((v) => v.code)).toEqual(example.vertices.map((v) => v.label))
    expect(t.theta_bin).toEqual(example.thetaClassRange)
    expect(t.distance_bin).toEqual(example.distanceClassRange)
    const [c1, c2, c3] = t.vertices.map((v) => v.code)
    const L = example.labelRadix, T = example.thetaClasses, Dn = example.distanceClasses
    expect(Dn * T * (L * L * (c1 - 1) + L * (c2 - 1) + (c3 - 1)) + T * (t.distance_class - 1) + (t.theta_class - 1)).toBe(D.key)
    expect(outputsOf('triangle')).toContain('key:             17637781')
  })

  it('on the batch and the common keys', () => {
    expect(outputsOf('batch')).toContain('| barnase | 1BRS | A | 204156 | 125263 |')
    expect(outputsOf('check')).toContain('in all three (BioTSR\'s report):  9,523')
  })

  it('the page shows the notebook’s own stored outputs', () => {
    expect(notebookHtml).toContain('9,523')
    expect(notebookHtml).toContain('downloaded from the RCSB, checksum matches')
    expect(notebookHtml).not.toMatch(/403 Forbidden|Tunnel connection|<script|<h1/)
  })
})

describe('the lesson page', () => {
  beforeEach(() => setViewport('desktop'))
  const HEADING = 'Why do four triangles share one BioTSR key?'

  it('sits in the site: full header, BioTSR marked, breadcrumb naming the page', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    const main = screen.getByRole('navigation', { name: 'Main' })
    expect(within(main).getByRole('button', { name: 'BioTSR' })).toHaveAttribute('data-current', 'true')
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
    expect(crumbs.getByRole('link', { name: 'BioTSR' })).toHaveAttribute('href', '/software')
    expect(crumbs.getByRole('link', { name: 'Learn BioTSR' })).toHaveAttribute('href', '/software/learn')
    expect(crumbs.getByText('Four triangles, one key')).toHaveAttribute('aria-current', 'page')
    await waitFor(() => expect(document.title).toBe('Four triangles, one key | TSR Research Group'))
    expect(document.querySelector('link[rel=canonical]')).toHaveAttribute(
      'href',
      'https://tsrmethod.github.io/software/four-triangles-one-key',
    )
  })

  it('marks Learn BioTSR as the section in the open menu, without calling it the current page', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    fireEvent.click(screen.getByRole('button', { name: 'BioTSR' }))
    const menu = within(screen.getByRole('navigation', { name: 'Main' }))
    const learn = menu.getByRole('link', { name: 'Learn BioTSR' })
    expect(learn).toHaveClass('in-section')
    expect(learn).not.toHaveAttribute('aria-current')
    expect(menu.getByRole('link', { name: 'Overview' })).not.toHaveClass('in-section')
  })

  it('states triangle 1, its bins and the table of all four as text', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    expect(screen.getByText('class 11: 42.64° ≤ θ < 45.17°')).toBeInTheDocument()
    expect(screen.getByText('class 5: 11.00 Å ≤ maxDist < 14.00 Å')).toBeInTheDocument()
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1).map((tr) =>
      [...tr.cells].slice(0, 5).map((td) => td.textContent),
    )
    D.triangles.forEach((t, i) => {
      expect(rows[i]).toEqual([
        String(i + 1),
        residues(t).join(' · '),
        `${t.theta.toFixed(2)}°`,
        String(t.theta_class),
        `${t.max_distance.toFixed(2)} Å`,
      ])
    })
    expect(document.body.textContent).not.toMatch(/bundled/i)
    expect(document.body.textContent).toContain('PDB entry 1UBQ, the copy BioTSR 1.0.0 was tested with')
  })

  it('takes keys only while the picture has focus, and announces each change once', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    const canvas = document.querySelector('canvas')
    const live = document.querySelector('main [aria-live]')
    expect(document.querySelectorAll('main [aria-live]')).toHaveLength(1)
    expect(live.textContent).toBe('')

    fireEvent.keyDown(document.body, { key: '3' })
    fireEvent.keyDown(canvas, { key: '3', ctrlKey: true })
    expect(screen.getByRole('button', { name: /^Triangle 1:/ })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(canvas, { key: '3' })
    expect(screen.getByRole('button', { name: /^Triangle 3:/ })).toHaveAttribute('aria-pressed', 'true')
    expect(live.textContent).toBe(
      'Triangle 3: Val 17, Ile 61, Leu 15. Angle 44.38 degrees, longest edge 13.11 ångströms. Same key, 17637781.',
    )

    fireEvent.click(screen.getByRole('button', { name: /^Triangle 4:/ }))
    expect(screen.getAllByText(/Val 70, Ile 36, Leu 71/).length).toBeGreaterThan(0)
  })

  it('groups the instructions, Reset view and the four triangle buttons under the picture', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    const controls = document.querySelector('canvas').nextElementSibling
    const reset = within(controls).getByRole('button', { name: 'Reset view' })
    const picker = within(controls).getByRole('group', { name: 'Choose a triangle' })
    expect(within(picker).getAllByRole('button')).toHaveLength(4)
    expect(picker.contains(reset)).toBe(false)
    expect(reset.parentElement).toContainElement(controls.querySelector('p'))
  })

  it('keeps every bin marker whole inside its track', async () => {
    await renderAt('/software/four-triangles-one-key', HEADING)
    const lefts = [...document.querySelectorAll('[class*="binDot"]')].map((d) => d.style.left)
    expect(lefts).toHaveLength(8)
    for (const left of lefts) {
      const fraction = Number(/(\d\.\d{4})/.exec(left)[1])
      expect(left).toContain('11px')
      expect(left).toContain('(100% - 22px)')
      expect(fraction).toBeGreaterThanOrEqual(0)
      expect(fraction).toBeLessThanOrEqual(1)
    }
  })
})

describe('the recorded notebook page', () => {
  beforeEach(() => setViewport('desktop'))
  const HEADING = 'Your first 10 minutes with BioTSR'

  it('sits in the site, with its breadcrumb and the BioTSR menu marked', async () => {
    await renderAt('/software/first-10-minutes', HEADING)
    expect(screen.getByRole('button', { name: 'BioTSR' })).toHaveAttribute('data-current', 'true')
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
    expect(crumbs.getByText('Your first 10 minutes (recorded run)')).toHaveAttribute('aria-current', 'page')
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    await waitFor(() =>
      expect(document.title).toBe('Your first 10 minutes with BioTSR (recorded run) | TSR Research Group'),
    )
  })

  it('says it is a recording that does not run, and offers the notebook itself', async () => {
    await renderAt('/software/first-10-minutes', HEADING)
    const notice = screen.getByRole('note')
    const text = notice.textContent.replace(/\s+/g, ' ')
    expect(text).toContain('A recorded run.')
    expect(text).toContain('5 November 2026')
    expect(text).toContain('nothing here runs in your browser')
    expect(within(notice).getByRole('link', { name: 'Download the notebook (.ipynb)' })).toHaveAttribute(
      'href',
      NOTEBOOK.href,
    )
  })

  it('folds the helper code away and shows the real outputs', async () => {
    await renderAt('/software/first-10-minutes', HEADING)
    expect(document.querySelector('details.helper summary').textContent).toBe('Show the helper code')
    expect(document.body.textContent).toContain('Same keys, same count.')
  })
})

describe('the notebook', () => {
  it('uses --method protein, mentions the method column, and checks inputs before computing', () => {
    const source = notebook.cells.map((cell) => [].concat(cell.source).join('')).join('\n')
    expect(source).toContain('biotsr batch --manifest samples.csv --method protein')
    expect(source).toContain('`method` column')
    expect(source).not.toMatch(/sample_id,pdb_id,method/)
    const order = notebook.cells.map((cell) => cell.id)
    expect(order.indexOf('structures')).toBeLessThan(order.indexOf('run'))
  })

  it('was run from top to bottom without an error', () => {
    const counts = notebook.cells.filter((c) => c.cell_type === 'code').map((c) => c.execution_count)
    expect(counts).toEqual(counts.map((_, i) => i + 1))
    expect(notebook.cells.flatMap((c) => c.outputs ?? []).some((o) => o.output_type === 'error')).toBe(false)
  })
})
