import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import App from '../../app/App'
import { pages } from '../../content'
import { siteConfig } from '../../app/siteConfig'

function renderContact() {
  return render(
    <MemoryRouter initialEntries={['/contact']}>
      <App />
    </MemoryRouter>,
  )
}

describe('the contact page', () => {
  it('renders at /contact', () => {
    renderContact()

    expect(
      screen.getByRole('heading', { level: 1, name: pages.contact.title }),
    ).toBeInTheDocument()
    expect(document.title).toBe('Contact | TSR Research Group')
  })

  it('shows the address from the central configuration', () => {
    renderContact()

    const main = within(screen.getByRole('main'))
    expect(main.getByText(siteConfig.email)).toBeInTheDocument()
  })

  it('links a new message to that address', () => {
    renderContact()

    const link = screen.getByRole('link', { name: pages.contact.emailAction })
    expect(link).toHaveAttribute(
      'href',
      `mailto:${siteConfig.email}?subject=TSR%20enquiry`,
    )
  })

  it('writes the address nowhere in its own source', () => {
    /*
     * The rule the previous site broke: it had contact@ourlab.com in the
     * footer and contact@louisiana.edu on the problems page, neither of them
     * the group's address. Everything here reads site.json through siteConfig,
     * so there is one value to change.
     */
    const root = process.cwd()
    for (const file of [
      'src/pages/Contact/Contact.jsx',
      'src/components/layout/Footer.jsx',
      'src/components/home/ContactCta.jsx',
    ]) {
      const source = readFileSync(resolve(root, file), 'utf8')
      expect(source, file).not.toContain(siteConfig.email)
    }
  })

  it('offers no form pretending to send a message', () => {
    renderContact()

    const main = screen.getByRole('main')
    expect(main.querySelector('form')).toBeNull()
    expect(main.querySelector('input')).toBeNull()
    expect(main.querySelector('textarea')).toBeNull()
    expect(
      screen.queryByRole('button', { name: /send|submit/i }),
    ).not.toBeInTheDocument()
  })

  it('names the university without claiming to be its website', () => {
    renderContact()

    const main = within(screen.getByRole('main'))
    expect(
      main.getByRole('link', { name: /University of Louisiana at Lafayette/ }),
    ).toHaveAttribute('href', 'https://www.louisiana.edu/')
  })

  it('sends software problems to the software page', () => {
    renderContact()

    expect(
      screen.getByRole('link', { name: /find the right repository/i }),
    ).toHaveAttribute('href', '/software')
  })
})

describe('the copy-email button', () => {
  it('copies the address from the central configuration', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    renderContact()
    await userEvent.click(
      screen.getByRole('button', { name: /copy email address/i }),
    )

    expect(writeText).toHaveBeenCalledWith(siteConfig.email)
  })

  it('confirms the copy in a live region', async () => {
    renderContact()
    await userEvent.click(
      screen.getByRole('button', { name: /copy email address/i }),
    )

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/copied/i)
    // The button keeps its own name, so the control does not rename itself
    // under a screen reader's cursor.
    expect(
      screen.getByRole('button', { name: /copy email address/i }),
    ).toBeInTheDocument()
  })

  it('is operable from the keyboard', async () => {
    renderContact()

    const button = screen.getByRole('button', { name: /copy email address/i })
    button.focus()
    expect(button).toHaveFocus()

    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('status')).toHaveTextContent(/copied/i)
  })

  it('says so, rather than crashing, when the clipboard refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })

    renderContact()
    await userEvent.click(
      screen.getByRole('button', { name: /copy email address/i }),
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/could not copy/i)
    // The address is still on the page to select by hand.
    expect(
      within(screen.getByRole('main')).getByText(siteConfig.email),
    ).toBeInTheDocument()
  })

  it('survives a browser with no clipboard API at all', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: undefined,
    })

    renderContact()
    await userEvent.click(
      screen.getByRole('button', { name: /copy email address/i }),
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/could not copy/i)
  })
})
