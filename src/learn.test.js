import { describe, it, expect } from 'vitest'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { LEARNING_PAGES, NOTEBOOK } from './content/learnResources'
import { HTML_PAGES } from '../scripts/site-routes.mjs'
import example from './components/figures/tsrOverviewExample.json'

/*
 * The Learn BioTSR files outside the app: the lesson page, the notebook and
 * its recorded run. Three resources that show the same BioTSR numbers must
 * show the same numbers, and must agree with the worked example on
 * Understand TSR; each hand-written page must work, and be honest, without
 * the app around it.
 */

const PUBLIC = resolve(__dirname, '../public')
const read = (file) => readFileSync(resolve(PUBLIC, file), 'utf8')

const lessonHtml = read(LEARNING_PAGES.lesson.file)
const previewHtml = read(LEARNING_PAGES.notebookPreview.file)
const notebook = JSON.parse(read(NOTEBOOK.file))
const D = JSON.parse(/const D = (\{.*?\});\n/s.exec(lessonHtml)[1])

const outputsOf = (id) =>
  notebook.cells
    .find((cell) => cell.id === id)
    .outputs.map((o) => [].concat(o.text ?? o.data?.['text/markdown'] ?? o.data?.['text/plain'] ?? []).join(''))
    .join('\n')

const residues = (t) => t.vertices.map((v) => `${v.res[0]}${v.res.slice(1).toLowerCase()} ${v.seq}`)

describe('Learn BioTSR files', () => {
  it('lists the same hand-written pages for the sitemap as for the app', () => {
    expect(HTML_PAGES).toEqual(Object.values(LEARNING_PAGES))
  })

  it('has every file it links to, at the size the page states', () => {
    for (const page of Object.values(LEARNING_PAGES)) expect(existsSync(resolve(PUBLIC, page.file))).toBe(true)
    expect(statSync(resolve(PUBLIC, NOTEBOOK.file)).size).toBe(NOTEBOOK.bytes)
    expect(existsSync(resolve(PUBLIC, 'learn-files/static-page.css'))).toBe(true)
  })
})

describe('the lesson, the notebook and the worked example agree', () => {
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
})

describe('the lesson page', () => {
  it('reads without JavaScript: explanation, triangle 1 and the four-triangle table are in the HTML', () => {
    const doc = new JSDOM(lessonHtml).window.document
    expect(doc.querySelector('h1').textContent).toBe('Why do four triangles share one BioTSR key?')
    expect(doc.getElementById('verts').textContent).toContain('Val 70, Ile 44, Leu 8')
    expect(doc.getElementById('theta').textContent).toBe('43.25°')
    expect(doc.getElementById('tclass').textContent).toBe('class 11: 42.64° ≤ θ < 45.17°')
    expect(doc.getElementById('dclass').textContent).toBe('class 5: 11.00 Å ≤ maxDist < 14.00 Å')
    expect(doc.getElementById('key').textContent).toBe('17637781')
    const rows = [...doc.querySelectorAll('#comparison-rows tr')].map((tr) =>
      [...tr.cells].map((td) => td.textContent),
    )
    expect(rows).toHaveLength(4)
    D.triangles.forEach((t, i) => {
      expect(rows[i].slice(0, 5)).toEqual([
        String(i + 1),
        residues(t).join(' · '),
        `${t.theta.toFixed(2)}°`,
        String(t.theta_class),
        `${t.max_distance.toFixed(2)} Å`,
      ])
    })
    expect(doc.querySelector('noscript').textContent).toContain('worked example on Understand TSR')
  })

  it('says where the coordinates come from without calling them bundled', () => {
    expect(lessonHtml).not.toMatch(/bundled/i)
    expect(lessonHtml).toContain('PDB entry 1UBQ, the copy BioTSR 1.0.0 was tested with')
  })

  it('has its own address, metadata and a way back to the site', () => {
    const doc = new JSDOM(lessonHtml).window.document
    const url = 'https://tsrmethod.github.io/software/four-triangles-one-key'
    expect(doc.querySelector('link[rel=canonical]').href).toBe(url)
    expect(doc.querySelector('meta[property="og:url"]').content).toBe(url)
    expect(doc.querySelector('meta[name=robots]')).toBeNull()
    const links = [...doc.querySelectorAll('header a, .breadcrumb a')].map((a) => a.getAttribute('href'))
    expect(links).toEqual(expect.arrayContaining(['/', '/software/learn', '/tsr']))
    expect(doc.querySelectorAll('script[src], link[rel=stylesheet][href^="http"]')).toHaveLength(0)
  })

  /* Runs the page's own script, with a canvas that draws nothing. */
  function runLesson() {
    const dom = new JSDOM(lessonHtml, {
      runScripts: 'dangerously',
      pretendToBeVisual: true,
      beforeParse(window) {
        window.HTMLCanvasElement.prototype.getContext = () =>
          new Proxy({}, { get: (_, key) => (key === 'measureText' ? () => ({ width: 40 }) : () => {}) })
        window.ResizeObserver = class { observe() {} }
        window.matchMedia = () => ({ matches: false, addEventListener() {} })
      },
    })
    return dom.window
  }

  it('passes its own check of the drawn geometry against BioTSR’s values', () => {
    const window = runLesson()
    expect(window.__demo.triangles.map((t) => t.key)).toEqual([D.key, D.key, D.key, D.key])
    expect(window.document.querySelectorAll('.pick')).toHaveLength(4)
  })

  it('takes keys only while the picture has focus, and announces each change once', () => {
    const window = runLesson()
    const { document } = window
    const press = (target, key, extra = {}) =>
      target.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra }))

    expect(document.querySelectorAll('[aria-live]')).toHaveLength(1)
    expect(document.getElementById('live').textContent).toBe('')

    press(document.body, '3')
    expect(window.__demo.state().selected).toBe(0)

    const canvas = document.getElementById('mol')
    press(canvas, '3', { ctrlKey: true })
    expect(window.__demo.state().selected).toBe(0)

    press(canvas, '3')
    expect(window.__demo.state().selected).toBe(2)
    expect(document.getElementById('live').textContent).toBe(
      'Triangle 3: Val 17, Ile 61, Leu 15. Angle 44.38 degrees, longest edge 13.11 ångströms. Same key, 17637781.',
    )
    expect(document.getElementById('tclass').textContent).toBe('class 11: 42.64° ≤ θ < 45.17°')

    document.querySelectorAll('.pick')[3].click()
    expect(window.__demo.state().selected).toBe(3)
    expect(document.getElementById('verts').textContent).toContain('Val 70, Ile 36, Leu 71')
  })

  it('keeps every bin marker whole inside its track', () => {
    const window = runLesson()
    const lefts = [...window.document.querySelectorAll('#dbin .bin-dot')].map((d) => d.style.left)
    expect(lefts).toHaveLength(4)
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
  const doc = new JSDOM(previewHtml).window.document

  it('says it is a recording that does not run, and offers the notebook itself', () => {
    const notice = doc.querySelector('.recorded')
    const text = notice.textContent.replace(/\s+/g, ' ')
    expect(text).toContain('A recorded run.')
    expect(text).toContain('nothing here runs in your browser')
    expect(notice.querySelector('a[download]').getAttribute('href')).toBe(NOTEBOOK.href)
    expect(doc.querySelectorAll('script')).toHaveLength(0)
    expect(doc.querySelectorAll('h1')).toHaveLength(1)
  })

  it('folds the helper code away and shows the notebook’s real outputs', () => {
    expect(doc.querySelector('.celltag_helper details.helper summary').textContent).toBe('Show the helper code')
    expect(doc.body.textContent).toContain('in all three (BioTSR\'s report):  9,523')
    expect(doc.body.textContent).toContain('downloaded from the RCSB, checksum matches')
    expect(doc.body.textContent).not.toMatch(/403 Forbidden|Tunnel connection/)
  })

  it('has its own address and metadata', () => {
    const url = 'https://tsrmethod.github.io/software/first-10-minutes'
    expect(doc.querySelector('link[rel=canonical]').href).toBe(url)
    expect(doc.querySelector('meta[property="og:url"]').content).toBe(url)
    expect(doc.title).toBe('Your first 10 minutes with BioTSR (recorded run) | TSR Research Group')
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
