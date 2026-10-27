import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it.each(PUBLISHED)('%s renders its page', async (slug) => {
    setViewport('desktop')
    renderApp(`/analysis/${slug}`)

    /* `find` rather than `get`: MethodPage is code-split. */
    expect(
      await screen.findByRole('heading', { level: 1, name: analysis(slug).title }),
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

describe('the analysis group of the Methods & research menu', () => {
  beforeEach(() => setViewport('desktop'))

  /* The analysis pages sit in "Methods & research", after the methods. */
  const analysisGroups = (navigation = getVisibleNavigation()) =>
    (navigation.find((item) => item.id === 'research')?.groups ?? []).filter(
      (group) => group.id === 'analysis-research',
    )

  it('appears now that at least one child is published', () => {
    expect(analysisGroups().length).toBe(1)
  })

  it('holds every published analysis page, in content order', () => {
    const [group] = analysisGroups()
    const expected = ['key-analysis', 'key-visualization'].flatMap((id) =>
      publishedMethods.filter((m) => m.category === 'analysis' && m.group === id).map((m) => m.slug),
    )

    expect(group.items.map((i) => i.id)).toEqual(expected)
  })

  it('shows the analysis pages in the header menu', async () => {
    const user = userEvent.setup()
    renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Main' })

    await user.click(within(nav).getByRole('button', { name: 'Methods & research' }))
    expect(
      within(nav).getByRole('list', { name: 'Analysis and research applications' }),
    ).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Common Keys' })).toBeInTheDocument()
  })

  it('would drop the analysis groups if nothing were published', () => {
    const hidden = getVisibleNavigation({
      methods: publishedMethods.filter((m) => m.category !== 'analysis'),
      isAvailable: () => true,
    })

    expect(analysisGroups(hidden)).toEqual([])
  })
})

describe('the draft analysis page stays invisible', () => {
  beforeEach(() => setViewport('desktop'))

  it.each(DRAFT)('%s is draft with no route', (slug) => {
    expect(analysis(slug).status).toBe('draft')
    expect(isRouteImplemented(`/analysis/${slug}`)).toBe(false)
  })

  it('404s at its own address', async () => {
    renderApp('/analysis/key-to-image')

    expect(
      await screen.findByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('404s at its legacy alias, which is configured but inert', async () => {
    expect(LEGACY_PATHS['/keytoimage']).toBe('key-to-image')
    expect(isRouteImplemented('/keytoimage')).toBe(false)

    renderApp('/keytoimage')
    expect(
      await screen.findByRole('heading', { level: 1, name: /page not found/i }),
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
  ])('%s redirects to the migrated page', async (legacyPath, title) => {
    renderApp(legacyPath)

    expect(
      await screen.findByRole('heading', { level: 1, name: title }),
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

  it('keeps the published clustering workflow in its order, naming each tool', () => {
    const body = getPublishedMethod('clustering').body
    const table = body.slice(body.indexOf('### The published workflow'))
    const s1 = table.indexOf('1. Key frequencies')
    const s2 = table.indexOf('2. Jaccard similarity')
    const s3 = table.indexOf('3. Clustermap')

    expect(s1).toBeGreaterThan(-1)
    expect(s1).toBeLessThan(s2)
    expect(s2).toBeLessThan(s3)
    expect(table.indexOf('key_frequency_drug.py', s1)).toBeLessThan(s2)
    expect(table.indexOf('hsp70_actin', s2)).toBeLessThan(s3)
    expect(table.indexOf('clustermap_n.py', s3)).toBeGreaterThan(s3)
  })

  it('runs clustering in BioTSR from Python, with no number of clusters by default', () => {
    const body = getPublishedMethod('clustering').body

    expect(body).toContain('biotsr.analysis')
    expect(body).toContain('"biotsr[plot]==1.0.0"')
    expect(body).toMatch(/not on the command line/)
    expect(body).toMatch(/No number of clusters by default/)
    expect(body).not.toMatch(/-n 5/)
  })

  it('names both clustering repositories, since it spans two', () => {
    const repos = getPublishedMethod('clustering').repositories.map((r) => r.url)

    expect(repos).toContain(
      'https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering',
    )
    expect(repos).toContain('https://github.com/dbxmcf/hsp70_actin')
  })

  it('keeps the DNN research instructions, with the header flag the model needs', () => {
    expect(getPublishedMethod('dnn').body).toContain(
      'key_frequency_drug.py -p triplets_directory -H yes',
    )
  })

  it('says the DNN is separate research code, not part of BioTSR', () => {
    const body = getPublishedMethod('dnn').body
    expect(body).toMatch(/not part of BioTSR/)
    expect(body).toMatch(/does not train\s+> or run this model/)
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

  it('runs common keys from the command line and the percentages from Python', () => {
    const body = getPublishedMethod('common-keys').body
    expect(body).toContain('biotsr analyze common-keys --from-results batch --output analysis_out')
    expect(body).toContain('key_occurrence_percent')
    expect(body).toMatch(/does not write\s+them as files/)
    // The earlier scripts read triplet files; that now sits on their card.
    const card = getPublishedMethod('common-keys').repositories.find(
      (r) => r.name === 'Nucleotide_Analysis',
    )
    expect(card.description).toMatch(/read a directory of triplet files/)
  })

  it('names the four BioTSR quantities and where each is written', () => {
    const body = getPublishedMethod('common-keys').body
    for (const quantity of [
      'Global common keys',
      'Group-wise common keys',
      'Key occurrence percentage',
      'One-versus-all occurrence',
    ]) {
      expect(body).toContain(quantity)
    }
    expect(body).toContain('analysis_out/analysis/common_keys/all_samples.csv')
    expect(body).toMatch(/does not\s+compute Common, Specific or specific keys/)
    // The prerequisites are stated before the first command.
    expect(body.indexOf('### Before you start')).toBeLessThan(body.indexOf('```bash'))
  })

  it('credits the published figure and keeps its two kinds of key apart', () => {
    const page = getPublishedMethod('common-keys')
    // Figure 13 of Milon et al. 2024, an open-access CC BY article.
    expect(page.figure.credit).toMatchObject({
      use: 'reproduced',
      url: 'https://doi.org/10.3390/kinasesphosphatases2040021',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    })
    expect(page.figure.credit.source).toMatch(/Figure 13/)
    // "Common"/"Specific" and "common"/"specific" are different sets.
    for (const term of ['**Common** keys', '**Specific** keys', '**common** keys', '**specific** keys']) {
      expect(page.body).toContain(term)
    }
    expect(page.body).not.toMatch(/specific keys of a class are a subset of that class's keys/)
  })

  it('shows the figure credit under the Common Keys figure', async () => {
    setViewport('desktop')
    renderApp('/analysis/common-keys')
    const figure = (await screen.findByRole('img', { name: /Worked example over two protein classes/ })).closest('figure')
    const caption = within(figure).getByText(/Reproduced from/)
    expect(within(caption).getByRole('link', { name: /Figure 13/ })).toHaveAttribute(
      'href',
      'https://doi.org/10.3390/kinasesphosphatases2040021',
    )
    expect(within(caption).getByRole('link', { name: /CC BY 4.0/ })).toHaveAttribute(
      'href',
      'https://creativecommons.org/licenses/by/4.0/',
    )
    expect(caption).toHaveTextContent('© 2024 the authors.')
    expect(caption).toHaveTextContent('Resized for the web; otherwise unchanged.')
  })

  it('makes the clustering example runnable without the Common Keys page', () => {
    const body = getPublishedMethod('clustering').body
    const setup = body.indexOf('biotsr batch --manifest samples.csv')
    expect(setup).toBeGreaterThan(-1)
    expect(setup).toBeLessThan(body.indexOf('```python'))
    expect(body).toContain('sample_id,pdb_id,method,chain,label')
  })
})

describe('existing content is unaffected', () => {
  beforeEach(() => setViewport('desktop'))

  it('still renders /tsr', async () => {
    renderApp('/tsr')
    expect(
      await screen.findByRole('heading', { level: 1, name: /Triangular Spatial/ }),
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
