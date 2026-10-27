/*
 * Optional, expandable blocks in a content file's Markdown.
 *
 * A blockquote whose first line starts with `[!DETAILS]` becomes a native
 * <details> element, closed until the reader opens it; the rest of that line
 * is its summary:
 *
 *   > [!DETAILS] Your CSV has different column names
 *   >
 *   > Anything Markdown allows: paragraphs, lists, code blocks.
 *
 * The site renders no raw HTML from content files, so this is how an editor
 * writes an expandable block. Every other blockquote is still a callout.
 */

const MARKER = /^\[!DETAILS\][ \t]*/

function asDetails(blockquote) {
  const first = blockquote.children.find((child) => child.type === 'element')
  const lead = first?.tagName === 'p' ? first.children[0] : null
  if (lead?.type !== 'text' || !MARKER.test(lead.value)) return null

  const summary = [
    { ...lead, value: lead.value.replace(MARKER, '') },
    ...first.children.slice(1),
  ]
  return {
    type: 'element',
    tagName: 'details',
    properties: {},
    children: [
      { type: 'element', tagName: 'summary', properties: {}, children: summary },
      ...blockquote.children.filter((child) => child !== first),
    ],
  }
}

function transform(node) {
  if (!Array.isArray(node.children)) return
  node.children = node.children.map((child) => {
    transform(child)
    return (child.type === 'element' && child.tagName === 'blockquote' && asDetails(child)) || child
  })
}

export default function rehypeDetails() {
  return transform
}
