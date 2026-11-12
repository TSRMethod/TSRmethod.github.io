import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../app/App'
import { THEME_STORAGE_KEY, startThemeSync } from '../../lib/theme'
import { setColorScheme, setViewport } from '../../test/viewport'

/*
 * The theme control in the desktop header and in the mobile menu: three
 * labelled choices with a checked state, applied at once, remembered, and
 * operable from the keyboard.
 */

const root = document.documentElement

async function renderSite(path = '/') {
  startThemeSync()
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
  await screen.findByRole('heading', { level: 1 })
}

const trigger = () => screen.getByRole('button', { name: /^Theme:/ })
const group = () => screen.getByRole('group', { name: 'Theme' })

describe('the desktop theme control', () => {
  it('is one button in the header, named with the current choice, closed at first', async () => {
    setViewport('desktop')
    await renderSite()
    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('button', { name: 'Theme: System' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull()
  })

  it('opens on three labelled choices with System checked and focused', async () => {
    setViewport('desktop')
    await renderSite()
    fireEvent.click(trigger())
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    const radios = within(group()).getAllByRole('radio')
    expect(radios.map((r) => r.labels[0].textContent)).toEqual(['Light', 'Dark', 'System'])
    expect(within(group()).getByRole('radio', { name: 'System' })).toBeChecked()
    expect(document.activeElement).toBe(within(group()).getByRole('radio', { name: 'System' }))
  })

  it('applies a choice at once, remembers it and names it on the button', async () => {
    setViewport('desktop')
    await renderSite()
    fireEvent.click(trigger())
    fireEvent.click(within(group()).getByRole('radio', { name: 'Dark' }))
    expect(root.dataset.theme).toBe('dark')
    expect(root.dataset.themePreference).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(within(group()).getByRole('radio', { name: 'Dark' })).toBeChecked()
    expect(trigger()).toHaveAccessibleName('Theme: Dark')
  })

  it('closes after a pointer choice and returns focus to the button', async () => {
    setViewport('desktop')
    await renderSite()
    fireEvent.click(trigger())
    const light = within(group()).getByRole('radio', { name: 'Light' })
    fireEvent.pointerDown(light)
    fireEvent.click(light)
    expect(root.dataset.theme).toBe('light')
    expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('stays open while the keyboard moves between choices, and closes on Escape', async () => {
    setViewport('desktop')
    await renderSite()
    fireEvent.click(trigger())
    const dark = within(group()).getByRole('radio', { name: 'Dark' })
    fireEvent.keyDown(dark, { key: 'ArrowUp' })
    fireEvent.click(dark)
    expect(root.dataset.theme).toBe('dark')
    expect(group()).toBeInTheDocument()

    fireEvent.keyDown(dark, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('closes on a click elsewhere', async () => {
    setViewport('desktop')
    await renderSite()
    fireEvent.click(trigger())
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('group', { name: 'Theme' })).toBeNull()
  })

  it('shows a saved choice on the next visit', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light')
    setViewport('desktop')
    await renderSite()
    expect(trigger()).toHaveAccessibleName('Theme: Light')
    fireEvent.click(trigger())
    expect(within(group()).getByRole('radio', { name: 'Light' })).toBeChecked()
  })

  it('follows the system while System is chosen, without being touched', async () => {
    setViewport('desktop')
    await renderSite()
    act(() => setColorScheme('dark'))
    expect(root.dataset.theme).toBe('dark')
    expect(trigger()).toHaveAccessibleName('Theme: System')
  })

  it('keeps its choice as the visitor moves between pages', async () => {
    setViewport('desktop')
    await renderSite('/')
    fireEvent.click(trigger())
    fireEvent.click(within(group()).getByRole('radio', { name: 'Dark' }))
    const menu = screen.getByRole('navigation', { name: 'Main' })
    fireEvent.click(within(menu).getByRole('link', { name: 'Understand TSR' }))
    await screen.findByRole('heading', { level: 1, name: /Triangular Spatial Relationship|TSR/ })
    expect(within(menu).getByRole('link', { name: 'Understand TSR' })).toHaveAttribute('aria-current', 'page')
    expect(root.dataset.theme).toBe('dark')
    expect(trigger()).toHaveAccessibleName('Theme: Dark')
  })
})

describe('the mobile theme control', () => {
  it('is at the foot of the menu, always open, with the same three choices', async () => {
    setViewport('mobile')
    await renderSite()
    expect(screen.queryByRole('button', { name: /^Theme:/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
    const dialog = screen.getByRole('dialog', { name: 'Site menu' })
    const theme = within(dialog).getByRole('group', { name: 'Theme' })
    expect(within(theme).getAllByRole('radio').map((r) => r.labels[0].textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ])
    expect(within(theme).getByRole('radio', { name: 'System' })).toBeChecked()

    fireEvent.click(within(theme).getByRole('radio', { name: 'Dark' }))
    expect(root.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    /* A setting, not a link: the menu stays open. */
    expect(screen.getByRole('dialog', { name: 'Site menu' })).toBeInTheDocument()
  })
})
