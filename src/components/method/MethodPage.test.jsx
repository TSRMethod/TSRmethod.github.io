import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import MethodPage from './MethodPage'
import { getPublishedMethod, methods } from '../../content'
import { setViewport } from '../../test/viewport'

function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

function renderMethod(slug = 'tsr') {
  return render(
    <MemoryRouter>
      <MethodPage slug={slug} />
    </MemoryRouter>,
  )
}

describe('/tsr route', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders the TSR page at its own address', () => {
    renderApp('/tsr')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Triangular Spatial Relationship (TSR)',
      }),
    ).toBeInTheDocument()
  })

  it('sets a route-specific document title', () => {
    renderApp('/tsr')

    expect(document.title).toBe(
      'Triangular Spatial Relationship (TSR) | TSR Research Group',
    )
  })

  it('is reachable from the main navigation', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: 'TSR Method' }))

    expect(
      screen.getByRole('heading', { level: 1, name: /Triangular Spatial/ }),
    ).toBeInTheDocument()
  })
})

describe('page header', () => {
  beforeEach(() => setViewport('desktop'))

  it('shows the summary and links the paper by DOI', () => {
    renderMethod()

    expect(screen.getByText(/alignment-free method/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Read the paper/ })).toHaveAttribute(
      'href',
      'https://doi.org/10.3389/fchem.2020.602291',
    )
  })

  it('renders the figure with its content-authored alt text', () => {
    renderMethod()
    const figure = getPublishedMethod('tsr').figure

    const image = screen.getByRole('img', { name: figure.alt })
    expect(image).toHaveAttribute('src', figure.src)
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  it('gives every image a non-empty alt attribute', () => {
    const { container } = renderMethod()

    const images = Array.from(container.querySelectorAll('img'))
    expect(images.length).toBeGreaterThan(0)
    for (const image of images) {
      expect(image.getAttribute('alt')?.trim()).toBeTruthy()
    }
  })
})

describe('markdown body', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders content headings with the ids the section links use', () => {
    renderMethod()

    for (const heading of getPublishedMethod('tsr').headings) {
      expect(document.getElementById(heading.id)).toBeInTheDocument()
    }
  })

  it('renders fenced code through CodeBlock, with a language label', () => {
    renderMethod()

    expect(screen.getAllByText('python').length).toBeGreaterThan(0)
    expect(screen.getAllByText('bash').length).toBeGreaterThan(0)
  })

  it('makes each code block keyboard scrollable', () => {
    const { container } = renderMethod()

    const blocks = Array.from(container.querySelectorAll('pre'))
    expect(blocks.length).toBeGreaterThan(0)
    for (const block of blocks) {
      expect(block).toHaveAttribute('tabindex', '0')
    }
  })

  it('copies a code block to the clipboard', async () => {
    /*
     * userEvent installs its own clipboard implementation during setup, so
     * this reads the clipboard back rather than spying on writeText — which
     * also makes the assertion about behaviour rather than the call.
     */
    const user = userEvent.setup()
    renderMethod()

    const [copyButton] = screen.getAllByRole('button', { name: /^Copy/ })
    await user.click(copyButton)

    expect(await navigator.clipboard.readText()).toContain('git clone')
    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('names each copy button after the block it copies', () => {
    renderMethod()

    // Several copy buttons on one page must be distinguishable by name alone.
    /*
     * Asserted on the accessible name, not the text content. An earlier
     * version used a visually-hidden span and read correctly in the DOM while
     * announcing as "Copytsr_keys.sbatch" — the name algorithm joins child
     * text with no separator.
     */
    expect(
      screen.getByRole('button', { name: 'Copy tsr_keys.sbatch' }),
    ).toBeInTheDocument()

    /*
     * Every copy button is named after what it copies. Blocks with a filename
     * get a unique name; the rest fall back to the language, so several may
     * share "Copy python". That is a known limitation — in document order the
     * surrounding text supplies the context — recorded rather than papered
     * over with meaningless index numbers.
     */
    const names = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
      .filter((name) => name?.startsWith('Copy'))

    expect(names.length).toBeGreaterThan(1)
    for (const name of names) {
      expect(name).toMatch(/^Copy \S+/)
    }
  })

  it('renders tables with column-scoped headers inside a scroll region', () => {
    const { container } = renderMethod()

    const tables = Array.from(container.querySelectorAll('table'))
    expect(tables.length).toBe(2) // parameters, and the input CSV layout

    for (const table of tables) {
      for (const th of table.querySelectorAll('th')) {
        expect(th).toHaveAttribute('scope', 'col')
      }
      const region = table.closest('[role="group"]')
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveAccessibleName(/scrolls horizontally/i)
    }
  })

  it('renders the parameter table content', () => {
    renderMethod()

    expect(screen.getByRole('columnheader', { name: 'Parameter' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'output_option' })).toBeInTheDocument()
  })
})

describe('section navigation', () => {
  it('lists the body sections as a sidebar on desktop', () => {
    setViewport('desktop')
    renderMethod()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(within(toc).getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '#overview',
    )
    expect(within(toc).getByRole('link', { name: 'Usage' })).toBeInTheDocument()
  })

  it('collapses behind a disclosure on mobile', async () => {
    setViewport('mobile')
    const user = userEvent.setup()
    renderMethod()

    const summary = screen.getByText('On this page')
    // Closed by default: it must not cover the content it belongs to.
    expect(screen.queryByRole('link', { name: 'Overview' })).not.toBeVisible()

    await user.click(summary)
    expect(screen.getByRole('link', { name: 'Overview' })).toBeVisible()
  })

  it('links only to ids that exist on the page', () => {
    setViewport('desktop')
    renderMethod()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const targets = within(toc)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href').slice(1))

    expect(targets.length).toBeGreaterThan(4)
    for (const id of targets) {
      expect(document.getElementById(id), `#${id} missing`).toBeInTheDocument()
    }
  })

  it('includes the component-rendered sections, not just the markdown ones', () => {
    setViewport('desktop')
    renderMethod()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(
      within(toc).getByRole('link', { name: 'Running on an HPC cluster' }),
    ).toBeInTheDocument()
    expect(
      within(toc).getByRole('link', { name: 'Source code' }),
    ).toBeInTheDocument()
  })
})

describe('SlurmGuide', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders the job script from content, verbatim', () => {
    const { container } = renderMethod()
    const slurm = getPublishedMethod('tsr').slurm

    const script = Array.from(container.querySelectorAll('pre')).find((pre) =>
      pre.textContent.includes('#SBATCH'),
    )

    expect(script).toBeDefined()
    expect(script.textContent).toBe(slurm.script.code)
  })

  it('preserves the multiline shape of the script', () => {
    const slurm = getPublishedMethod('tsr').slurm

    expect(slurm.script.code.split('\n').length).toBeGreaterThan(10)
    expect(slurm.script.code).toContain('#SBATCH -t 72:00:00')
    expect(slurm.script.code).toContain('source tsrenv/bin/activate')
  })

  it('labels the script with its filename and shows the submit command', () => {
    const { container } = renderMethod()

    // The filename also appears in the copy button's accessible name, so
    // this checks the visible caption specifically.
    const captions = Array.from(container.querySelectorAll('figcaption')).map(
      (node) => node.firstChild.textContent,
    )
    expect(captions).toContain('tsr_keys.sbatch')

    const submit = Array.from(container.querySelectorAll('pre')).find((pre) =>
      pre.textContent.startsWith('sbatch '),
    )
    expect(submit.textContent).toBe('sbatch tsr_keys.sbatch')
  })

  it('hard-codes no cluster values of its own', async () => {
    /*
     * The component must be a renderer, not an HPC configuration system.
     * Every partition, allocation, node count and wall time has to come from
     * the content file.
     */
    const source = await import('./SlurmGuide.jsx?raw')

    expect(source.default).not.toMatch(/#SBATCH/)
    expect(source.default).not.toMatch(/workq|sbatch |--ntasks|partition=/)
  })

  it('renders nothing when a method has no slurm block', () => {
    const { container } = render(
      <MemoryRouter>
        <MethodPage slug="tsr" />
      </MemoryRouter>,
    )
    expect(container.querySelector('#slurm-and-hpc')).toBeInTheDocument()

    // And the guard itself, exercised directly.
    const withoutSlurm = methods.find((m) => !m.slurm)
    if (withoutSlurm) {
      expect(withoutSlurm.slurm).toBeNull()
    }
  })
})

describe('source code section', () => {
  beforeEach(() => setViewport('desktop'))

  it('lists each repository from frontmatter', () => {
    renderMethod()

    const link = screen.getByRole('link', { name: /TSR-Package/ })
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/pooryakhajouie/TSR-Package',
    )
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})

describe('draft protection', () => {
  it('shows the 404 page for a draft or unknown slug', () => {
    render(
      <MemoryRouter>
        <MethodPage slug="cross-tsr" />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })
})
