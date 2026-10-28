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

  it('sends a BioTSR problem to BioTSR’s issues, and other code to its listing', () => {
    renderContact()

    expect(
      screen.getByRole('link', { name: /^Report a BioTSR problem on GitHub/ }),
    ).toHaveAttribute('href', 'https://github.com/TSRMethod/BioTSR/issues')
    expect(
      screen.getByRole('link', { name: 'Earlier implementations' }),
    ).toHaveAttribute('href', '/research/earlier-implementations')
    // The BioTSR overview holds no repository list any more.
    expect(screen.queryByRole('link', { name: /find the right repository/i })).toBeNull()
  })
})

describe('the copy-email button', () => {
  /*
   * Scoped to the email section: the share section below has its own copy
   * button, with its own live region.
   */
  const emailSection = () =>
    within(screen.getByRole('region', { name: pages.contact.emailHeading }))

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

    const status = await emailSection().findByRole('status')
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
    expect(await emailSection().findByRole('status')).toHaveTextContent(/copied/i)
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

    expect(await emailSection().findByRole('status')).toHaveTextContent(/could not copy/i)
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

    expect(await emailSection().findByRole('status')).toHaveTextContent(/could not copy/i)
  })
})

describe('the share section', () => {
  const shareSection = () =>
    within(screen.getByRole('region', { name: pages.contact.shareHeading }))

  it('shows the QR code with the website address written out beside it', () => {
    renderContact()
    const share = shareSection()

    const code = share.getByRole('img', { name: 'QR code for https://tsrmethod.github.io/' })
    expect(code).toHaveAttribute('src', '/share/tsr-website-qr.svg')

    /* The code is never the only way to the address. */
    const link = share.getByRole('link', { name: 'https://tsrmethod.github.io/' })
    expect(link).toHaveAttribute('href', 'https://tsrmethod.github.io/')
  })

  it('offers both files for download, and each file exists', () => {
    renderContact()
    const share = shareSection()

    for (const [name, href] of [
      [/as SVG/, '/share/tsr-website-qr.svg'],
      [/as PNG/, '/share/tsr-website-qr.png'],
    ]) {
      const link = share.getByRole('link', { name })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('download')
      expect(() => readFileSync(resolve(process.cwd(), 'public', href.slice(1)))).not.toThrow()
    }
  })

  it('copies the website address', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    renderContact()
    await userEvent.click(shareSection().getByRole('button', { name: /copy website address/i }))

    expect(writeText).toHaveBeenCalledWith('https://tsrmethod.github.io/')
    expect(await shareSection().findByRole('status')).toHaveTextContent(/copied/i)
  })
})

describe('the QR code files', () => {
  const svg = readFileSync(resolve(process.cwd(), 'public/share/tsr-website-qr.svg'), 'utf8')
  const png = readFileSync(resolve(process.cwd(), 'public/share/tsr-website-qr.png'))

  /*
   * What can be checked without a QR decoder. That both files decode to
   * exactly https://tsrmethod.github.io/ was verified with two independent
   * decoders when they were made (docs/DEPLOYMENT.md); these hold the
   * properties a later edit could break.
   */
  it('is a self-contained SVG: black on an explicit white square, no links out', () => {
    expect(svg).toMatch(/<rect width="37" height="37" fill="#ffffff"\/>/)
    expect(svg).toMatch(/<path fill="#000000" d="M/)
    expect(svg).toContain('viewBox="0 0 37 37"')
    expect(svg).not.toMatch(/<image|href=|<script|<a[\s>]/)
  })

  it('keeps the four-module quiet zone', () => {
    /* Every dark run starts at least four modules in from each edge. */
    const runs = [...svg.matchAll(/M(\d+) (\d+)h(\d+)/g)].map(([, x, y, w]) => [
      Number(x),
      Number(y),
      Number(w),
    ])
    expect(runs.length).toBeGreaterThan(0)
    for (const [x, y, w] of runs) {
      expect(x).toBeGreaterThanOrEqual(4)
      expect(y).toBeGreaterThanOrEqual(4)
      expect(x + w).toBeLessThanOrEqual(33)
      expect(y).toBeLessThanOrEqual(32)
    }
  })

  it('ships a high-resolution PNG', () => {
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBe(2035)
    expect(png.readUInt32BE(20)).toBe(2035)
  })
})
