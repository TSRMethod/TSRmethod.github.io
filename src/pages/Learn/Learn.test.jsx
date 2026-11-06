import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { pages } from '../../content'
import { LEARNING_PAGES, NOTEBOOK, VIDEO } from '../../content/learnResources'
import { setViewport } from '../../test/viewport'

const COPY = pages.learn

/* Evaluate the lazily loaded page first; see GetStarted.test.jsx. */
await import('./Learn')

async function renderPage() {
  const result = render(
    <MemoryRouter initialEntries={['/software/learn']}>
      <App />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1, name: COPY.title })
  return result
}

const card = (name) => screen.getByRole('heading', { level: 2, name }).closest('section')

describe('Learn BioTSR', () => {
  beforeEach(() => setViewport('desktop'))

  it('renders at /software/learn with its own title, description and canonical URL', async () => {
    await renderPage()
    await waitFor(() => expect(document.title).toBe('Learn BioTSR | TSR Research Group'))
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', COPY.summary)
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://tsrmethod.github.io/software/learn',
    )
  })

  it('orders the resources Explore then Run, numbered from 1 while there is no video', async () => {
    await renderPage()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.slice(0, 2)).toEqual([COPY.exploreHeading, COPY.runHeading])
    expect(VIDEO).toBeNull()
    expect(document.querySelector('video')).toBeNull()
    expect(within(card(COPY.exploreHeading)).getByText('1')).toBeInTheDocument()
    expect(within(card(COPY.runHeading)).getByText('2')).toBeInTheDocument()
  })

  it('links to the lesson as a page outside the app, with the worked example as the text fallback', async () => {
    await renderPage()
    const explore = within(card(COPY.exploreHeading))
    const lesson = explore.getByRole('link', { name: COPY.exploreAction })
    expect(lesson).toHaveAttribute('href', LEARNING_PAGES.lesson.path)
    expect(lesson).not.toHaveAttribute('target')
    expect(explore.getByRole('link', { name: COPY.exploreFallbackLink })).toHaveAttribute(
      'href',
      '/tsr#worked-example',
    )
  })

  it('offers the notebook as a download with its size, and its recorded run as a page', async () => {
    await renderPage()
    const run = within(card(COPY.runHeading))
    const download = run.getByRole('link', { name: new RegExp(`^${COPY.runDownloadAction.replace(/[.()]/g, '\\$&')}`) })
    expect(download).toHaveAttribute('href', NOTEBOOK.href)
    expect(download).toHaveAttribute('download', NOTEBOOK.downloadName)
    expect(download).toHaveTextContent(`(${Math.round(NOTEBOOK.bytes / 1000)} kB)`)
    expect(run.getByRole('link', { name: COPY.runPreviewAction })).toHaveAttribute(
      'href',
      LEARNING_PAGES.notebookPreview.path,
    )
    expect(run.getByText(COPY.runPreviewNote)).toBeInTheDocument()
  })

  it('gives the commands that open the notebook, in the environment Getting started uses', async () => {
    await renderPage()
    const commands = within(card(COPY.runHeading)).getByText(/python3 -m venv biotsr-env/)
    expect(commands.textContent).toBe(
      [
        'python3 -m venv biotsr-env',
        'source biotsr-env/bin/activate',
        'python -m pip install jupyterlab',
        `jupyter lab ${NOTEBOOK.downloadName}`,
      ].join('\n'),
    )
  })

  it('points onward to Getting started, the user guide and Understand TSR', async () => {
    await renderPage()
    const next = within(card(COPY.nextHeading))
    expect(next.getByRole('link', { name: 'Getting started with BioTSR' })).toHaveAttribute(
      'href',
      '/software/get-started',
    )
    expect(next.getByRole('link', { name: /^The BioTSR user guide/ })).toHaveAttribute(
      'href',
      'https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md',
    )
    expect(next.getByRole('link', { name: 'Understand TSR' })).toHaveAttribute('href', '/tsr')
  })
})
