import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { softwarePages, softwareRelease } from '../../content'
import { setViewport } from '../../test/viewport'

const PAGE = softwarePages['get-started']

/*
 * Evaluate the lazily loaded page before the first test, as src/test/setup.js
 * does for MethodPage, so that findBy's one-second wait measures React's
 * re-render rather than the first compile of the module under a loaded run.
 * It is done here rather than in setup.js, which would bypass other files'
 * vi.mock calls (see the note there).
 */
await import('./GetStarted')

/* The page is code-split, so it arrives a tick after the route renders. */
async function renderPage() {
  const result = render(
    <MemoryRouter initialEntries={['/software/get-started']}>
      <App />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: PAGE.title })
  return result
}

const commands = () =>
  Array.from(document.querySelectorAll('main pre')).map((pre) => pre.textContent.trim())

describe('Getting started with BioTSR', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders at /software/get-started with its own title and description', async () => {
    await renderPage()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting started with BioTSR' }),
    ).toBeInTheDocument()
    // usePageMetadata sets the title in an effect. On a lazily loaded page the
    // heading can be in the DOM a moment before that effect has run, so wait
    // for the exact title rather than reading it at that instant.
    await waitFor(() => expect(document.title).toBe('Getting started with BioTSR | TSR Research Group'))
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      PAGE.summary,
    )
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://tsrmethod.github.io/software/get-started',
    )
  })

  it('keeps the first run to four steps, then points onward', () => {
    expect(PAGE.headings.filter((h) => h.depth === 2).map((h) => h.text)).toEqual([
      'Before you start',
      '1. Install BioTSR',
      '2. Download an example structure',
      '3. Run a protein calculation',
      '4. Understand the output',
      'Next steps',
    ])
  })

  it('has a table of contents whose every entry resolves', async () => {
    await renderPage()

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    const links = within(toc).getAllByRole('link')
    expect(links.length).toBe(PAGE.headings.length)
    for (const link of links) {
      const id = link.getAttribute('href').slice(1)
      expect(document.getElementById(id), `#${id}`).toBeInTheDocument()
    }
  })

  it('gives the short install for an existing environment, and a beginner setup', async () => {
    await renderPage()

    const all = commands()
    expect(all[0]).toBe(softwareRelease.install)
    expect(all[1]).toBe(
      [
        'python3 -m venv biotsr-env',
        'source biotsr-env/bin/activate',
        softwareRelease.install,
        'biotsr --version',
      ].join('\n'),
    )
    expect(all).toContain(softwareRelease.installPlot)
  })

  it('shows exactly the first-run commands that were verified against PyPI 1.0.0', async () => {
    await renderPage()

    const all = commands()
    expect(all).toContain('biotsr fetch 1UBQ --pdb-dir structures')
    expect(all).toContain(
      'biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --output results',
    )
    expect(all).toContain('biotsr describe results/1UBQ_A_protein')
  })

  it('walks through a CSV batch with the commands verified against PyPI 1.0.0', async () => {
    await renderPage()

    // Listed in the table of contents, beside the datasets section it follows.
    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(
      within(toc).getByRole('link', { name: 'Example: a batch from a CSV file' }),
    ).toHaveAttribute('href', '#example-a-batch-from-a-csv-file')

    const all = commands()
    // Long commands are split with backslash continuations; none may have a
    // trailing space after the backslash, or the shell would end the command
    // there. Joined, they are the commands that were run.
    const batch = all.filter((code) => code.startsWith('biotsr batch --manifest example_batch'))
    expect(batch).toHaveLength(3)
    for (const code of batch) {
      const lines = code.split('\n')
      for (const line of lines.slice(0, -1)) expect(line).toMatch(/\S \\$/)
      expect(lines.at(-1)).not.toMatch(/\\\s*$/)
    }
    const joined = batch.map((code) => code.replace(/ \\\n\s+/g, ' '))
    const run =
      'biotsr batch --manifest example_batch.csv --method protein --pdb-dir structures ' +
      '--download-missing --jobs 2 --output batch_example'
    expect(joined).toEqual([`${run} --dry-run`, run, `${run} --if-exists skip`])

    // One row per calculation; the method comes from the command line.
    const manifest = all.find((code) => code.startsWith('cat > example_batch.csv'))
    expect(manifest).toContain('sample_id,pdb_id,chain\n')
    expect(manifest).not.toMatch(/\bmethod\b/)
    // Its own output folder, apart from step 3's `results`.
    expect(run).not.toMatch(/--output results\b/)
  })

  it('keeps the long console transcripts closed, and says downloads depend on the cache', async () => {
    await renderPage()

    const outputs = screen
      .getAllByText(/^Example output/)
      .map((node) => node.closest('details'))
    expect(outputs).toHaveLength(2)
    for (const details of outputs) {
      expect(details).not.toHaveAttribute('open')
      expect(details.querySelector('pre')).not.toBeNull()
    }
    expect(outputs[0].textContent).toMatch(/1 present, 2 distinct would be downloaded/)
    expect(outputs[1].textContent).toMatch(/workers {4}2 processes/)

    // The essentials stay in view: the summary table and the resume outcome.
    const section = PAGE.body.slice(PAGE.body.indexOf('### Example: a batch'))
    expect(section).toMatch(/If you followed step 2, 1UBQ is there/)
    expect(section).toMatch(/In a new, empty folder it downloads all three/)
    expect(screen.getByRole('cell', { name: '105995' }).closest('details')).toBeNull()
    expect(commands()).toContain('requests   0 ok, 3 skipped, 0 failed')
  })

  it('keeps the custom-column example closed until the reader opens it', async () => {
    await renderPage()

    const details = screen.getByText('Optional: your CSV uses other column names').closest('details')
    expect(details).not.toBeNull()
    expect(details).not.toHaveAttribute('open')
    expect(within(details).getByText(/--column sample_id=name/)).toBeInTheDocument()
    expect(details.textContent).toMatch(/--keep-column split --ignore-column notes \\\n/)
    expect(details.textContent).not.toMatch(/\\[ \t]+\n/)
  })

  it('never makes a clone of the repository a prerequisite', () => {
    const beforeNextSteps = PAGE.body.slice(0, PAGE.body.indexOf('## Next steps'))
    expect(beforeNextSteps).not.toMatch(/git clone/)
  })

  it('explains molecule copies as identifiers, not copy numbers', () => {
    expect(PAGE.body).toMatch(/--entity-name NAG --entity-id 1/)
    expect(PAGE.body).toMatch(/`--entity-name NAG` alone selects every NAG on the chain/)
    expect(PAGE.body).toMatch(/It is not a copy number/)
    expect(PAGE.body).toMatch(/`NAG_allcopies`/)
  })

  it('says streaming saves memory, not disk, and where memory still goes', () => {
    const text = PAGE.body.replace(/\s+/g, ' ')
    expect(text).toMatch(/Streaming does not make a triangle file any smaller/)
    expect(text).toMatch(/each parallel worker/)
    expect(text).toMatch(/analysis, which holds every sample's key counts at once/)
    expect(text).toMatch(/--no-triplets/)
  })

  it('links BioTSR documentation at the release tag only', async () => {
    await renderPage()

    const external = Array.from(document.querySelectorAll('main a[href*="TSRMethod/BioTSR"]'))
    expect(external.length).toBeGreaterThan(10)
    for (const link of external) {
      expect(link.getAttribute('href')).toContain(`/blob/${softwareRelease.tag}/`)
      expect(link).toHaveAttribute('target', '_blank')
    }
  })
})
