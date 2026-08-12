/*
 * Helpers for reading the syntax tree react-markdown hands to a custom
 * component.
 *
 * Overriding `pre` rather than `code` is what lets CodeBlock own the whole
 * block — the language label, the copy button and the scroll container. The
 * cost is that the code text arrives as a tree node rather than a string,
 * which is what these functions unpack.
 */

/** Concatenate every text node beneath a hast node. */
export function toText(node) {
  if (!node) return ''
  if (node.type === 'text') return node.value
  if (!Array.isArray(node.children)) return ''
  return node.children.map(toText).join('')
}

/**
 * Read the language off a fenced code block.
 *
 * Markdown's ```python becomes class="language-python" on the <code> element.
 * Returns null for a fence with no language, so callers can decide what to
 * show rather than printing an empty label.
 */
export function codeLanguage(codeNode) {
  const classes = codeNode?.properties?.className ?? []
  const match = classes.find((name) => name.startsWith('language-'))
  return match ? match.slice('language-'.length) : null
}

/** Find the <code> child of a <pre> node. */
export function findCodeChild(preNode) {
  return preNode?.children?.find((child) => child.tagName === 'code') ?? null
}
