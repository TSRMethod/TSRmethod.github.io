import { load as parseYaml } from 'js-yaml'

/*
 * Splits a Markdown file into its YAML frontmatter and its body.
 *
 * Why not `gray-matter`, the usual choice: it depends on Node's Buffer and
 * needs a polyfill to run in the browser. Content here is bundled and parsed
 * client-side, so a Node-only dependency would mean shipping a shim for no
 * benefit. The format is simple enough that a regex plus js-yaml is both
 * smaller and easier for a future maintainer to reason about.
 */

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/

export class ContentError extends Error {
  constructor(source, message) {
    super(`${source}: ${message}`)
    this.name = 'ContentError'
    this.source = source
  }
}

/**
 * @param {string} raw     full file contents
 * @param {string} source  file path, used in error messages
 * @returns {{ data: object, body: string }}
 */
export function parseFrontmatter(raw, source = 'content') {
  const match = raw.match(FRONTMATTER)

  if (!match) {
    throw new ContentError(
      source,
      'missing YAML frontmatter. The file must start with a line containing ' +
        'only "---", then the fields, then another "---".',
    )
  }

  let data
  try {
    data = parseYaml(match[1]) ?? {}
  } catch (error) {
    throw new ContentError(source, `frontmatter is not valid YAML — ${error.message}`)
  }

  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new ContentError(source, 'frontmatter must be a set of key: value fields')
  }

  return { data, body: raw.slice(match[0].length) }
}
