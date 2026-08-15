import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../../app/App'
import { isRouteImplemented } from '../../app/routeRegistry'
import {
  pages,
  repositories,
  methods,
  getPagesForRepository,
  getRepositoriesByCategory,
} from '../../content'

function renderSoftware() {
  return render(
    <MemoryRouter initialEntries={['/software']}>
      <App />
    </MemoryRouter>,
  )
}

describe('the software page', () => {
  it('renders at /software', () => {
    renderSoftware()

    expect(
      screen.getByRole('heading', { level: 1, name: pages.software.title }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Software | TSR Research Group')
  })

  it('shows every repository record, once', () => {
    renderSoftware()

    expect(repositories.length).toBeGreaterThan(0)
    for (const repository of repositories) {
      expect(
        screen.getAllByRole('heading', { name: new RegExp(repository.name) }),
        repository.id,
      ).toHaveLength(1)
      expect(screen.getByText(repository.description)).toBeInTheDocument()
    }
  })

  it('links each entry to its repository', () => {
    renderSoftware()

    for (const repository of repositories) {
      const link = screen.getByRole('link', {
        name: new RegExp(`^${repository.name}\\b`),
      })
      expect(link).toHaveAttribute('href', repository.url)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('says which entries are installable and which are research scripts', () => {
    renderSoftware()

    const main = within(screen.getByRole('main'))
    expect(main.getAllByText('Installable Python package').length).toBe(
      repositories.filter((r) => r.kind === 'package').length,
    )
    expect(main.getAllByText('Research scripts').length).toBe(
      repositories.filter((r) => r.kind === 'scripts').length,
    )
  })

  it('groups repositories deterministically, by category then order', () => {
    for (const category of ['core', 'method', 'analysis']) {
      const group = getRepositoriesByCategory(category)
      const orders = group.map((r) => r.order ?? 999)
      expect(orders, category).toEqual([...orders].sort((a, b) => a - b))
      expect(getRepositoriesByCategory(category).map((r) => r.id)).toEqual(
        group.map((r) => r.id),
      )
    }
  })

  it('shows a "report a problem" link only where a tracker is declared', () => {
    renderSoftware()

    const withTracker = repositories.filter((r) => r.issuesUrl)
    const links = screen.queryAllByRole('link', { name: /report a problem/i })

    expect(links).toHaveLength(withTracker.length)
    for (const link of links) {
      expect(withTracker.map((r) => r.issuesUrl)).toContain(
        link.getAttribute('href'),
      )
    }
  })

  it('renders no empty block for an absent optional field', () => {
    renderSoftware()

    const main = screen.getByRole('main')
    for (const element of main.querySelectorAll('p, li, h3, h4')) {
      expect(element.textContent.trim()).not.toBe('')
    }
  })
})

describe('what the software page links to on this site', () => {
  it('links each repository to the pages it actually implements', () => {
    renderSoftware()

    const tsrPackage = repositories.find((r) => r.id === 'tsr-package')
    const documented = getPagesForRepository(tsrPackage.url)
    expect(documented.length).toBeGreaterThan(1)

    const card = screen
      .getByRole('heading', { name: new RegExp(`^${tsrPackage.name}\\b`) })
      .closest('li')

    for (const method of documented) {
      expect(
        within(card).getByRole('link', {
          name: method.shortTitle ?? method.title,
        }),
      ).toHaveAttribute('href', method.path)
    }
  })

  it('points every internal link at an implemented route', () => {
    renderSoftware()

    const internal = Array.from(
      screen.getByRole('main').querySelectorAll('a[href^="/"]'),
    ).map((link) => link.getAttribute('href'))

    expect(internal.length).toBeGreaterThan(0)
    for (const href of internal) {
      expect(isRouteImplemented(href), href).toBe(true)
    }
  })

  it('exposes no draft page through a repository entry', () => {
    /*
     * Key to 2D Image is implemented in TSR-Package, and its content file
     * lists that repository — but the page is a draft. Because the links are
     * derived from `publishedMethods`, it cannot appear here, and this fails
     * if that derivation is ever swapped for a stored list.
     */
    const draft = methods.find((m) => m.slug === 'key-to-image')
    expect(draft.status).toBe('draft')

    renderSoftware()

    expect(screen.queryByText(/key to 2d image/i)).not.toBeInTheDocument()
    expect(
      getPagesForRepository('https://github.com/pooryakhajouie/TSR-Package')
        .map((m) => m.slug),
    ).not.toContain('key-to-image')
  })

  it('shows nothing for CrossTSR or Metal-Ion TSR', () => {
    renderSoftware()

    expect(screen.queryByText(/crosstsr/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/metal.?ion/i)).not.toBeInTheDocument()
  })
})

describe('the software page survives the coming package consolidation', () => {
  it('names no repository, account or URL in its own source', () => {
    /*
     * The point of this stage's software design. A future package under the
     * TSRMethod organisation should replace the core entry by editing one JSON
     * file — so if a GitHub account name or repository URL ever appears in the
     * component, that promise is already broken.
     */
    const source = readFileSync(
      resolve(process.cwd(), 'src/pages/Software/Software.jsx'),
      'utf8',
    )

    expect(source).not.toMatch(/https:\/\/github\.com\/[a-z]/i)
    for (const repository of repositories) {
      expect(source, repository.id).not.toContain(repository.url)
      expect(source, repository.id).not.toContain(repository.name)
    }
  })

  it('reads the owner from the URL rather than storing it', () => {
    renderSoftware()

    // Shown so a reader can see whose repository each one is, and it follows
    // the URL if a repository moves to the organisation later.
    for (const repository of repositories) {
      const path = repository.url.replace('https://github.com/', '')
      expect(screen.getByText(`github.com/${path}`)).toBeInTheDocument()
    }
  })
})
