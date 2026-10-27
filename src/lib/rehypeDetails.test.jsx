import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MarkdownContent from '../components/method/MarkdownContent'

describe('expandable blocks written as > [!DETAILS]', () => {
  it('render as a closed <details> with the rest of the line as its summary', () => {
    render(
      <MarkdownContent>
        {'> [!DETAILS] More about **this**\n>\n> Hidden text.\n>\n> ```bash\n> echo hi\n> ```\n'}
      </MarkdownContent>,
    )

    const summary = screen.getByText(/More about/).closest('summary')
    expect(summary).toHaveTextContent('More about this')
    expect(summary.textContent).not.toContain('[!DETAILS]')
    const details = summary.closest('details')
    expect(details).not.toHaveAttribute('open')
    expect(details).toHaveTextContent('Hidden text.')
    expect(details.querySelector('pre')).toHaveTextContent('echo hi')
  })

  it('leave every other blockquote a callout', () => {
    render(<MarkdownContent>{'> A note, not [!DETAILS].\n'}</MarkdownContent>)

    expect(document.querySelector('details')).toBeNull()
    expect(screen.getByText(/A note/).closest('aside')).not.toBeNull()
  })
})
