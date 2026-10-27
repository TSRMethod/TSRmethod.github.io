import { describe, it, expect } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../../app/App'
import { isRouteImplemented } from '../../app/routeRegistry'
import { setViewport } from '../../test/viewport'
import {
  pages,
  repositories,
  methods,
  softwarePages,
  softwareRelease,
  getPagesForRepository,
} from '../../content'

/*
 * Evaluate the lazily loaded page before the first test, as src/test/setup.js
 * does for MethodPage, so that findBy's one-second wait measures React's
 * re-render rather than the first compile of the module under a loaded run.
 * It is done here rather than in setup.js, which would bypass other files'
 * vi.mock calls (see the note there).
 */
await import('./Software')

/* The page is code-split, so it arrives a tick after the route renders. */
async function renderSoftware(path = '/software') {
  const result = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: pages.software.title })
  return result
}

describe('the BioTSR page', () => {
  it('renders at /software, named after BioTSR', async () => {
    await renderSoftware()

    expect(
      screen.getByRole('heading', { level: 1, name: pages.software.title }),
    ).toBeInTheDocument()
    expect(pages.software.title).toBe('BioTSR')
    // usePageMetadata sets the title in an effect. On a lazily loaded page the
    // heading can be in the DOM a moment before that effect has run, so wait
    // for the exact title rather than reading it at that instant.
    await waitFor(() => expect(document.title).toBe('BioTSR | TSR Research Group'))
  })

  it('opens with the canonical sentence', () => {
    expect(pages.software.intro).toMatch(
      /^BioTSR is the unified software implementation of the Triangular Spatial Relationship \(TSR\) methodology\./,
    )
  })

  it('states the release facts from the release record', async () => {
    await renderSoftware()

    const facts = screen.getByRole('main').querySelector('dl')
    expect(facts).toHaveTextContent(`Version${softwareRelease.version}`)
    expect(facts).toHaveTextContent('Released26 October 2026')
    expect(facts).toHaveTextContent('LicenceApache License 2.0')
    expect(facts).toHaveTextContent('Python3.9–3.13')
    expect(facts).toHaveTextContent('PlatformsLinux and macOS')
  })

  it('links the repository, the release, PyPI and the pinned documentation', async () => {
    await renderSoftware()
    const main = within(screen.getByRole('main'))

    const expectLink = (name, href) => {
      const link = main.getAllByRole('link', { name })[0]
      expect(link, String(name)).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }

    expectLink(/^GitHub repository/, 'https://github.com/TSRMethod/BioTSR')
    expectLink(/^Release 1\.0\.0/, 'https://github.com/TSRMethod/BioTSR/releases/tag/v1.0.0')
    expectLink(/^PyPI/, 'https://pypi.org/project/biotsr/1.0.0/')
    expectLink(
      /^Documentation for BioTSR/,
      'https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/README.md',
    )
  })

  it('makes Getting started the primary action', async () => {
    await renderSoftware()

    expect(
      within(screen.getByRole('main')).getByRole('link', { name: pages.software.getStartedAction }),
    ).toHaveAttribute('href', '/software/get-started')
  })

  it('has the sections its own navigation lists', async () => {
    await renderSoftware()

    for (const id of ['install', 'what-biotsr-computes', 'documentation', 'help', 'cite', 'figures', 'research-code']) {
      expect(document.getElementById(id), `#${id}`).toBeInTheDocument()
    }
  })

  it('lists its sections in a sidebar on desktop and a collapsed list on a phone', async () => {
    setViewport('desktop')
    const { unmount } = await renderSoftware()
    const sidebar = screen.getByRole('navigation', { name: 'On this page' })
    expect(sidebar.closest('details')).toBeNull()
    expect(within(sidebar).getByRole('link', { name: 'Install' })).toHaveAttribute('href', '#install')
    unmount()

    setViewport('mobile')
    await renderSoftware()
    const list = screen.getByRole('navigation', { name: 'On this page' })
    expect(list.closest('details')).not.toBeNull()
    expect(list.closest('details').open).toBe(false)
  })

  it('still lands old links to the repository listing on a way to it', async () => {
    /* /software#research-code, and the live site's #software-core and
       #software-analysis, each reach a section that links the listing's new
       page. */
    await renderSoftware('/software#research-code')

    for (const id of ['research-code', 'software-core', 'software-analysis', 'software-historical']) {
      expect(document.getElementById(id), `#${id}`).toBeInTheDocument()
    }
    const section = within(screen.getByRole('region', { name: pages.software.researchCodeHeading }))
    expect(section.getByRole('link', { name: pages.software.researchCodeAction })).toHaveAttribute(
      'href',
      '/research/earlier-implementations',
    )
  })

  it('lists its own sections in an on-this-page index that resolves', async () => {
    await renderSoftware()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const links = within(toc).getAllByRole('link')
    expect(links.length).toBeGreaterThan(5)
    for (const link of links) {
      const id = link.getAttribute('href').slice(1)
      expect(document.getElementById(id), `#${id}`).toBeInTheDocument()
    }
  })

  it('shows the pinned install commands, with the plotting extra separate', async () => {
    await renderSoftware()

    const commands = Array.from(document.querySelectorAll('main pre')).map((pre) =>
      pre.textContent.trim(),
    )
    expect(commands).toContain(softwareRelease.install)
    expect(commands).toContain(softwareRelease.installPlot)
  })

  it('says parallel batches come with the standard installation', () => {
    expect(softwarePages.biotsr.body).toMatch(
      /Parallel batch processing is part of this standard installation/,
    )
  })

  it('separates what runs on the command line from what is Python-only', async () => {
    await renderSoftware()

    const table = screen
      .getAllByRole('table')
      .find((t) => within(t).queryByRole('columnheader', { name: 'Command line' }))
    const row = (label) =>
      within(table).getByRole('row', { name: new RegExp(label) })

    // Similarity, clustering and the figure have no command-line entry.
    expect(within(row('Similarity measures and clustering')).getAllByRole('cell')[1]).toHaveTextContent('—')
    expect(within(row('clustered heat map')).getAllByRole('cell')[1]).toHaveTextContent('—')
    expect(within(row('Keys shared')).getAllByRole('cell')[1]).toHaveTextContent(
      'biotsr analyze common-keys',
    )
  })

  it('offers BioTSR’s own "Report a problem" link, and only that one', async () => {
    /* The other repositories' trackers are on their cards, on the Earlier
       software and research code page. */
    await renderSoftware()

    const links = screen.queryAllByRole('link', { name: /report a problem/i })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://github.com/TSRMethod/BioTSR/issues',
    ])
  })

  it('promises no response time', () => {
    expect(pages.software.helpBody).not.toMatch(/within|hours|days|respond|reply/i)
  })

  it('renders no empty block for an absent optional field', async () => {
    await renderSoftware()

    const main = screen.getByRole('main')
    for (const element of main.querySelectorAll('p, li, h3, h4, dd')) {
      expect(element.textContent.trim()).not.toBe('')
    }
  })
})

describe('citing BioTSR', () => {
  it('asks for BioTSR and the method publication, in those words', async () => {
    await renderSoftware()

    const section = within(screen.getByRole('region', { name: pages.software.citeHeading }))
    expect(
      section.getByText('Please cite BioTSR and the relevant method publication(s).'),
    ).toBeInTheDocument()
  })

  it('gives the CITATION.cff reference, with its four authors in order', async () => {
    await renderSoftware()

    const quote = screen.getByRole('main').querySelector('blockquote')
    expect(quote).toHaveTextContent(
      'Khajouie, P., Rauniyar, K., Raghavan, V. V., & Xu, W. BioTSR (version 1.0.0) ' +
        '[Computer software]. https://github.com/TSRMethod/BioTSR',
    )
  })

  it('shows no DOI, badge or placeholder for one', async () => {
    await renderSoftware()

    const section = screen.getByRole('region', { name: pages.software.citeHeading })
    expect(section).not.toHaveTextContent(/doi|zenodo|pending/i)
    expect(section.querySelector('img')).toBeNull()
  })

  it('names BioTSR\'s licence for BioTSR only', () => {
    expect(pages.software.licenceNote).toMatch(/Apache License 2\.0/)
    expect(pages.software.licenceNote).toMatch(/covers BioTSR only/)
  })
})

describe('the technical figures', () => {
  it('keeps them collapsed, described and linked at full size', async () => {
    await renderSoftware()

    const section = screen.getByRole('region', { name: pages.software.figuresHeading })
    const details = section.querySelectorAll('details')
    expect(details).toHaveLength(2)
    for (const disclosure of details) expect(disclosure).not.toHaveAttribute('open')

    for (const [alt, src] of [
      [pages.software.matrixAlt, '/images/figures/biotsr-1.0.0-capability-matrix.svg'],
      [pages.software.architectureAlt, '/images/figures/biotsr-1.0.0-architecture.svg'],
    ]) {
      const image = within(section).getByRole('img', { name: alt, hidden: true })
      expect(image).toHaveAttribute('src', src)
    }
  })

  it('ships both figures, and neither mentions a compatibility profile as a feature', () => {
    const root = process.cwd()
    for (const name of ['capability-matrix', 'architecture']) {
      const svg = readFileSync(
        resolve(root, `public/images/figures/biotsr-1.0.0-${name}.svg`),
        'utf8',
      )
      expect(svg).toContain('<title')
      expect(svg).toContain('<desc')
      expect(svg).not.toMatch(/Compatibility profile|atom lexicon/)
    }
  })
})

describe('what the BioTSR page links to on this site', () => {
  it('points every internal link at an implemented route', async () => {
    await renderSoftware()

    const hrefs = Array.from(
      screen.getByRole('main').querySelectorAll('a[href^="/"]'),
    ).map((link) => link.getAttribute('href'))

    // Pages go through the router; the full-size figures are files.
    const internal = hrefs.filter((href) => !href.startsWith('/images/'))
    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), href).toBe(true)
    }
    for (const href of hrefs.filter((h) => h.startsWith('/images/'))) {
      expect(existsSync(resolve(process.cwd(), `public${href}`)), href).toBe(true)
    }
  })

  it('exposes no draft page through a repository entry', async () => {
    const draft = methods.find((m) => m.slug === 'key-to-image')
    expect(draft.status).toBe('draft')

    await renderSoftware()

    expect(screen.queryByText(/key to 2d image/i)).not.toBeInTheDocument()
    expect(
      getPagesForRepository('https://github.com/pooryakhajouie/TSR-Package')
        .map((m) => m.slug),
    ).not.toContain('key-to-image')
  })

  it('shows nothing for CrossTSR or Metal-Ion TSR', async () => {
    await renderSoftware()

    expect(screen.queryByText(/crosstsr/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/metal.?ion/i)).not.toBeInTheDocument()
  })
})

describe('the page keeps repository facts in content', () => {
  it('names no repository, account or URL in its own source', () => {
    /*
     * A new release, or BioTSR moving, is an edit to src/content — so if a
     * GitHub account name or repository URL ever appears in the component,
     * that promise is already broken.
     */
    const source = readFileSync(
      resolve(process.cwd(), 'src/pages/Software/Software.jsx'),
      'utf8',
    )

    expect(source).not.toMatch(/https:\/\/github\.com\/[a-z]/i)
    expect(source).not.toMatch(/pypi\.org|1\.0\.0/)
    for (const repository of repositories) {
      expect(source, repository.id).not.toContain(repository.url)
      // "BioTSR" is the page's subject and appears in comments; the other
      // names must not appear at all.
      if (repository.id !== 'biotsr') {
        expect(source, repository.id).not.toContain(repository.name)
      }
    }
  })
})
