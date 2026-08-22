import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import Reveal from './Reveal'
import { setReducedMotion } from '../../test/viewport'

/*
 * The scroll reveal.
 *
 * The property that matters most is not that things animate — it is that
 * content is never left invisible. A reveal that fails to fire, in a browser
 * without IntersectionObserver, or for a reader who has asked for less
 * motion, must leave the page perfectly readable. Each of those is a test
 * here, because each of them is a way to ship a blank page.
 */

/** Replaces the global stub with one whose callback the test can fire. */
function controllableObserver() {
  const instances = []

  class ControllableObserver {
    constructor(callback) {
      this.callback = callback
      this.elements = []
      instances.push(this)
    }
    observe(element) {
      this.elements.push(element)
    }
    unobserve() {}
    disconnect() {
      this.disconnected = true
    }
    takeRecords() {
      return []
    }
    /** Pretend everything observed has scrolled into view. */
    enter() {
      act(() => {
        this.callback(
          this.elements.map((target) => ({ target, isIntersecting: true })),
        )
      })
    }
  }

  const original = window.IntersectionObserver
  window.IntersectionObserver = ControllableObserver
  globalThis.IntersectionObserver = ControllableObserver

  return {
    instances,
    restore() {
      window.IntersectionObserver = original
      globalThis.IntersectionObserver = original
    },
  }
}

let observers
let originalRaf
let originalCancelRaf

beforeEach(() => {
  observers = controllableObserver()

  /*
   * Hold the mount-time geometry check rather than running it: these tests
   * are about the observer path, and jsdom's zero-sized rects count as on
   * screen, so an immediate frame would reveal everything before the observer
   * was ever consulted. The test that cares about that path runs the frames
   * itself.
   */
  originalRaf = window.requestAnimationFrame
  originalCancelRaf = window.cancelAnimationFrame
  window.requestAnimationFrame = () => 1
  window.cancelAnimationFrame = () => {}
})

afterEach(() => {
  observers.restore()
  window.requestAnimationFrame = originalRaf
  window.cancelAnimationFrame = originalCancelRaf
})

describe('Reveal', () => {
  it('renders the element it is told to, so semantics do not change', () => {
    render(
      <ul>
        <Reveal as="li">A list item, still a list item</Reveal>
      </ul>,
    )

    const item = screen.getByRole('listitem')
    expect(item.tagName).toBe('LI')
    /* No wrapper between the list and its item. */
    expect(item.parentElement.tagName).toBe('UL')
  })

  it('keeps its content in the document while it is still hidden', () => {
    render(<Reveal>Findable before it animates</Reveal>)

    expect(screen.getByText('Findable before it animates')).toBeInTheDocument()
    expect(screen.getByText('Findable before it animates')).toHaveAttribute(
      'data-reveal',
      'hidden',
    )
  })

  it('reveals once the element is scrolled into view, and stops watching', () => {
    render(<Reveal>Arriving</Reveal>)
    const element = screen.getByText('Arriving')

    expect(element).toHaveAttribute('data-reveal', 'hidden')

    observers.instances[0].enter()

    expect(element).toHaveAttribute('data-reveal', 'shown')
    expect(observers.instances[0].disconnected).toBe(true)
  })

  it('shows content immediately when the reader asks for reduced motion', () => {
    /*
     * The rule this component exists to get right. With reduced motion the
     * hidden state is never entered at all — not entered and then quickly
     * left, which the global transition reset would have turned into content
     * that is invisible forever.
     */
    setReducedMotion(true)

    render(<Reveal>Immediately readable</Reveal>)

    expect(screen.getByText('Immediately readable')).toHaveAttribute(
      'data-reveal',
      'shown',
    )
    expect(observers.instances).toHaveLength(0)
  })

  it('shows content immediately where there is no IntersectionObserver', () => {
    observers.restore()
    const original = window.IntersectionObserver
    delete window.IntersectionObserver
    delete globalThis.IntersectionObserver

    render(<Reveal>Old browser, readable page</Reveal>)

    expect(screen.getByText('Old browser, readable page')).toHaveAttribute(
      'data-reveal',
      'shown',
    )

    window.IntersectionObserver = original
    globalThis.IntersectionObserver = original
  })

  it('reveals what is already on screen even if no callback arrives', () => {
    /*
     * The blank-page case. A page loaded in a background tab has its
     * rendering steps suspended, so the observer's first delivery may never
     * come; geometry still can be read, and anything on screen is shown.
     */
    const frames = []
    window.requestAnimationFrame = (callback) => {
      frames.push(callback)
      return frames.length
    }
    window.cancelAnimationFrame = () => {}

    render(<Reveal>On screen, never observed</Reveal>)
    const element = screen.getByText('On screen, never observed')

    expect(element).toHaveAttribute('data-reveal', 'hidden')

    act(() => frames.forEach((frame) => frame()))

    expect(element).toHaveAttribute('data-reveal', 'shown')
  })

  it('checks again when a background page is brought to the front', () => {
    render(<Reveal>Was in a background tab</Reveal>)
    const element = screen.getByText('Was in a background tab')

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    /* jsdom reports visibilityState 'visible', so the check runs; its
       elements have no measurable box, so the check reveals them. */
    expect(element).toHaveAttribute('data-reveal', 'shown')
  })

  it('staggers neighbours by a beat, and stops before a long list cascades', () => {
    render(
      <ul>
        {Array.from({ length: 9 }, (_, index) => (
          <Reveal as="li" key={index} index={index}>
            {`Card ${index}`}
          </Reveal>
        ))}
      </ul>,
    )

    const delayOf = (index) =>
      screen.getByText(`Card ${index}`).style.getPropertyValue('--reveal-delay')

    expect(delayOf(0)).toBe('')
    expect(delayOf(1)).toBe('70ms')
    expect(delayOf(2)).toBe('140ms')
    /* Capped: the ninth card does not wait two thirds of a second. */
    expect(delayOf(5)).toBe('350ms')
    expect(delayOf(8)).toBe('350ms')
  })

  it('passes attributes through, so a section keeps its accessible name', () => {
    render(
      <Reveal as="section" id="funding" aria-labelledby="funding-heading">
        <h2 id="funding-heading">Funding</h2>
      </Reveal>,
    )

    const section = screen.getByRole('region', { name: 'Funding' })
    expect(section.tagName).toBe('SECTION')
    expect(section).toHaveAttribute('id', 'funding')
  })
})
