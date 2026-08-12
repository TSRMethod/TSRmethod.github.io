import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import App from '../app/App'
import { methods, publishedMethods, getPublishedMethod } from './index'
import { getVisibleNavigation } from '../app/navigation'
import { isRouteImplemented } from '../app/routeRegistry'
import { LEGACY_PATHS } from '../app/legacyPaths'
import { setViewport } from '../test/viewport'

/*
 * The key analysis and visualisation tools.
 *
 * These are downstream of the methods: they consume TSR keys and triplets
 * rather than generating them. They live in src/content/analysis and route
 * under /analysis, but share the registry, components and publication gate
 * with the method pages.
 */

const PUBLISHED = ['common-keys', 'clustering', 'dnn']
const DRAFT = ['key-to-image']

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

const analysis = (slug) => methods.find((entry) => entry.slug === slug)

describe('the analysis collection', () => {
  it.each([...PUBLISHED, ...DRAFT])('%s parses', (slug) => {
    const entry = analysis(slug)

    expect(entry).toBeDefined()
    expect(entry.category).toBe('analysis')
    expect(entry.source.startsWith('./analysis/')).toBe(true)
    expect(entry.summary.length).toBeGreaterThan(30)
  })

  it.each(PUBLISHED)('%s is published and routed under /analysis', (slug) => {
    const entry = getPublishedMethod(slug)

    expect(entry.status).toBe('published')
    expect(entry.path).toBe(`/analysis/${slug}`)
    expect(isRouteImplemented(entry.path)).toBe(true)
  })

  it.each(PUBLISHED)('%s renders its page', (slug) => {
    setViewport('desktop')
    renderApp(`/analysis/${slug}`)

    expect(
      screen.getByRole('heading', { level: 1, name: analysis(slug).title }),
    ).toBeInTheDocument()
  })

  it('keeps the folder and the category in agreement', () => {
    /*
     * The folder is editorial organisation; `category` decides the URL. If
     * they could disagree, a page would route somewhere other than where an
     * editor found it.
     */
    for (const entry of methods) {
      const folder = entry.source.replace(/^\.\//, '').split('/')[0]
      if (entry.category === 'analysis') expect(folder).toBe('analysis')
      if (entry.category === 'method' || entry.category === 'core') {
        expect(folder).toBe('methods')
      }
    }
  })
})

describe('the analysis menu', () => {
  beforeEach(() => setViewport('desktop'))

  const menu = () =>
    getVisibleNavigation().find((item) => item.id === 'analysis')

  it('appears now that at least one child is published', () => {
    expect(menu()).toBeDefined()
  })

  it('puts each page in the subgroup its content declares', () => {
    for (const group of menu().groups) {
      const expected = publishedMethods
        .filter((m) => m.category === 'analysis' && m.group === group.id)
        .map((m) => m.slug)
        .sort()

      expect(group.items.map((i) => i.id).sort()).toEqual(expected)
    }
  })

  it('renders no empty subgroup', () => {
    for (const group of menu().groups) {
      expect(group.items.length, `${group.id} is empty`).toBeGreaterThan(0)
    }
  })

  it('shows the dropdown in the header', () => {
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })

    expect(
      within(nav).getByRole('button', { name: /Key Analysis & Visualization/ }),
    ).toBeInTheDocument()
  })

  it('would hide the whole menu if nothing were published', () => {
    const hidden = getVisibleNavigation({
      methods: publishedMethods.filter((m) => m.category !== 'analysis'),
      isAvailable: () => true,
    })

    expect(hidden.find((item) => item.id === 'analysis')).toBeUndefined()
  })
})

describe('the draft analysis page stays invisible', () => {
  beforeEach(() => setViewport('desktop'))

  it.each(DRAFT)('%s is draft with no route', (slug) => {
    expect(analysis(slug).status).toBe('draft')
    expect(isRouteImplemented(`/analysis/${slug}`)).toBe(false)
  })

  it('404s at its own address', () => {
    renderApp('/analysis/key-to-image')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('404s at its legacy alias, which is configured but inert', () => {
    expect(LEGACY_PATHS['/keytoimage']).toBe('key-to-image')
    expect(isRouteImplemented('/keytoimage')).toBe(false)

    renderApp('/keytoimage')
    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('is absent from the navigation', () => {
    const shown = getVisibleNavigation()
      .filter((item) => item.groups)
      .flatMap((item) => item.groups.flatMap((g) => g.items))
      .map((link) => link.id)

    expect(shown).not.toContain('key-to-image')
  })

  it('still carries its review note for a maintainer', () => {
    expect(analysis('key-to-image').review.note).toMatch(/35by44grid\.csv/)
  })
})

describe('legacy aliases for analysis pages', () => {
  beforeEach(() => setViewport('desktop'))

  it.each([
    ['/commonkeys', 'Common Keys'],
    ['/clustering', 'Hierarchical Clustering'],
    ['/dnn', 'Deep Neural Network'],
  ])('%s redirects to the migrated page', (legacyPath, title) => {
    renderApp(legacyPath)

    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeInTheDocument()
  })
})

describe('workflows match their authoritative sources', () => {
  it('documents the DNN output layer as data-sized, not fixed', () => {
    /*
     * The legacy page said the output layer had 8 neurons while also naming
     * seven classes. The code shows Dense(8) is the last HIDDEN layer and the
     * output is Dense(len(classes), softmax) — sized from the data.
     */
    const body = getPublishedMethod('dnn').body

    expect(body).toMatch(/one per class/)
    expect(body).toMatch(/not fixed/i)
    expect(body).toMatch(/last \*hidden\* layer|last hidden layer/)
  })

  it('documents the DNN outputs as PNG images', () => {
    const body = getPublishedMethod('dnn').body

    for (const file of [
      'accuracy_plot.png',
      'loss_plot.png',
      'confusion_matrix.png',
    ]) {
      expect(body).toContain(file)
    }
    // The README calls two of them .csv; the code writes PNGs.
    expect(body).not.toContain('loss_plot.csv')
    expect(body).not.toContain('confusion_matrix.csv')
  })

  it('keeps the clustering steps in their required order', () => {
    /*
     * Asserted on the step headings, not on first mention of each tool: the
     * overview table names all three steps up front, so raw indexOf order
     * would prove nothing.
     */
    const entry = getPublishedMethod('clustering')
    const steps = entry.headings
      .filter((h) => /^Step \d/.test(h.text))
      .map((h) => h.text)

    expect(steps).toEqual([
      'Step 1 — generate key frequencies',
      'Step 2 — Jaccard similarity',
      'Step 3 — hierarchical clustering',
    ])

    // And each step names the tool it actually runs.
    const body = entry.body
    const s1 = body.indexOf('Step 1 —')
    const s2 = body.indexOf('Step 2 —')
    const s3 = body.indexOf('Step 3 —')

    expect(body.indexOf('key_frequency_drug.py', s1)).toBeLessThan(s2)
    expect(body.indexOf('hsp70_actin', s2)).toBeLessThan(s3)
    expect(body.indexOf('clustermap_n.py', s3)).toBeGreaterThan(s3)
  })

  it('names both clustering repositories, since it spans two', () => {
    const repos = getPublishedMethod('clustering').repositories.map((r) => r.url)

    expect(repos).toContain(
      'https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering',
    )
    expect(repos).toContain('https://github.com/dbxmcf/hsp70_actin')
  })

  it('uses the right header flag for each consumer of key_frequency_drug.py', () => {
    // -H no for clustering (Jaccard needs headerless), -H yes for the DNN.
    expect(getPublishedMethod('clustering').body).toContain(
      'key_frequency_drug.py -p triplets_directory -H no',
    )
    expect(getPublishedMethod('dnn').body).toContain(
      'key_frequency_drug.py -p triplets_directory -H yes',
    )
  })

  it('states that Key to 2D Image consumes triplets, not keys', () => {
    const body = analysis('key-to-image').body

    expect(body).toContain('.triplets_29_35')
    expect(body).toMatch(/triplet files, not key files/i)
    // The legacy example generated keys and then fed them in; it must not.
    expect(body).not.toContain('output_option="keys"')
    expect(body).toContain('output_option="triplets"')
  })

  it('imports Key_To_Image by module path, since it is not re-exported', () => {
    const body = analysis('key-to-image').body

    expect(body).toContain('from tsr_package.Key_To_Image import KeyToImage')
    expect(body).not.toContain('from tsr_package import KeyToImage')
  })

  it('states that Common Keys reads triplet files', () => {
    expect(getPublishedMethod('common-keys').body).toMatch(
      /triplet files, not key files/i,
    )
  })
})

describe('existing content is unaffected', () => {
  beforeEach(() => setViewport('desktop'))

  it('still renders /tsr', () => {
    renderApp('/tsr')
    expect(
      screen.getByRole('heading', { level: 1, name: /Triangular Spatial/ }),
    ).toBeInTheDocument()
  })

  it.each(['mirror-image', 'drug-tsr', 'nucleotide'])(
    '/methods/%s still routes',
    (slug) => {
      expect(isRouteImplemented(`/methods/${slug}`)).toBe(true)
    },
  )

  it('still redirects the method aliases', () => {
    for (const legacy of ['/mirror-image', '/aa-grouping', '/aminoacid']) {
      expect(isRouteImplemented(legacy)).toBe(true)
    }
  })

  it('exposes no link to an unimplemented route', () => {
    renderApp('/')

    const internal = Array.from(document.querySelectorAll('a[href^="/"]')).map(
      (a) => a.getAttribute('href'),
    )

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), `${href} has no route`).toBe(true)
    }
  })
})
