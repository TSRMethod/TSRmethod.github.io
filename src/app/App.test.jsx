import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { siteConfig, mailtoHref } from './siteConfig'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the home page at /', () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', { level: 1, name: siteConfig.name }),
    ).toBeInTheDocument()
  })

  it('renders a landmark main element that can receive focus', () => {
    renderAt('/')

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main')
    expect(main).toHaveAttribute('tabindex', '-1')
  })
})

describe('404 handling', () => {
  it('renders the NotFound page for an unknown route', () => {
    renderAt('/this-route-does-not-exist')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('offers a link back to the home page', () => {
    renderAt('/nope')

    expect(screen.getByRole('link', { name: /home page/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('404s the retired /problems address, on purpose', () => {
    /*
     * The old page was a form that reported nothing — it logged to the console
     * and then thanked the visitor. There is no single successor: a bug
     * belongs on the repository that provides the tool, anything else belongs
     * in an email, and /contact explains both. Redirecting there would be
     * guessing which the visitor meant. See src/app/legacyPaths.js.
     */
    renderAt('/problems')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })

  it('404s /community, whose content is now in the footer', () => {
    renderAt('/community')

    expect(
      screen.getByRole('heading', { level: 1, name: /page not found/i }),
    ).toBeInTheDocument()
  })
})

describe('legacy addresses that do have a successor', () => {
  it('sends the old Source Code page to /software', () => {
    renderAt('/source-code')

    expect(
      screen.getByRole('heading', { level: 1, name: 'Software' }),
    ).toBeInTheDocument()
  })
})

describe('siteConfig', () => {
  it('exposes the group contact email', () => {
    expect(siteConfig.email).toBe('tsrresearchgroup@gmail.com')
  })

  it('builds a mailto link, with and without a subject', () => {
    expect(mailtoHref()).toBe('mailto:tsrresearchgroup@gmail.com')
    expect(mailtoHref('Collaboration enquiry')).toBe(
      'mailto:tsrresearchgroup@gmail.com?subject=Collaboration%20enquiry',
    )
  })
})
