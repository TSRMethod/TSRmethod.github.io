import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRef } from 'react'
import useExitTransition from './useExitTransition'

/*
 * The rule this hook exists to keep: content that animates out must stay in
 * the tree until the animation is over, and content that is NOT going to
 * animate must not wait for an event that will never arrive.
 *
 * jsdom runs no animations, so "no animation" is its natural state — which is
 * the case the rest of the suite depends on, and the first thing tested here.
 * The animating case is produced by telling the element it has a duration.
 */

function Panel({ isOpen }) {
  const ref = useRef(null)
  const panel = useExitTransition(isOpen, ref)

  return panel.isMounted ? (
    <div
      ref={ref}
      data-testid="panel"
      data-exiting={panel.isExiting || undefined}
    >
      panel
    </div>
  ) : null
}

/** Make every element claim a CSS animation, as a real stylesheet would. */
function withAnimation(duration = '0.22s') {
  const original = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => ({
    ...original(element),
    animationDuration: duration,
    transitionDuration: '0s',
  }))
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('content that is not going to animate', () => {
  it('is removed the moment it closes', () => {
    const { rerender } = render(<Panel isOpen />)
    expect(screen.getByTestId('panel')).toBeInTheDocument()

    rerender(<Panel isOpen={false} />)

    /*
     * No stylesheet, no animation, nothing to wait for. This is also what
     * reduced motion produces, where the CSS sets `animation: none`.
     */
    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
  })
})

describe('content that animates out', () => {
  it('stays until the animation ends, marked as exiting', () => {
    withAnimation()

    const { rerender } = render(<Panel isOpen />)
    rerender(<Panel isOpen={false} />)

    const panel = screen.getByTestId('panel')
    expect(panel).toBeInTheDocument()
    expect(panel).toHaveAttribute('data-exiting')

    fireEvent.animationEnd(panel)

    expect(screen.queryByTestId('panel')).not.toBeInTheDocument()
  })

  it('ignores an animation finishing somewhere inside it', () => {
    /* A chevron or a child panel ending its own animation must not cut the
       parent's exit short. */
    withAnimation()

    const { rerender } = render(<Panel isOpen />)
    rerender(<Panel isOpen={false} />)

    const panel = screen.getByTestId('panel')
    const child = document.createElement('span')
    panel.appendChild(child)

    fireEvent.animationEnd(child)

    expect(screen.getByTestId('panel')).toBeInTheDocument()
  })

  it('is simply open again if it is reopened mid-exit', () => {
    /*
     * Rapid open/close/open. The phase is derived from the caller's flag, so
     * there is no half-closed state to clean up and no stale class left on
     * the element.
     */
    withAnimation()

    const { rerender } = render(<Panel isOpen />)
    rerender(<Panel isOpen={false} />)
    expect(screen.getByTestId('panel')).toHaveAttribute('data-exiting')

    rerender(<Panel isOpen />)

    const panel = screen.getByTestId('panel')
    expect(panel).toBeInTheDocument()
    expect(panel).not.toHaveAttribute('data-exiting')

    /* A late event from the cancelled exit must not remove it. */
    fireEvent.animationEnd(panel)

    expect(screen.getByTestId('panel')).toBeInTheDocument()
  })
})
