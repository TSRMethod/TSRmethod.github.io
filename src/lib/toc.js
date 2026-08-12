import GithubSlugger from 'github-slugger'

/*
 * Extracts a table of contents from Markdown source.
 *
 * The section navigation on a method page needs the heading list BEFORE the
 * body is rendered, so this reads the Markdown text rather than the rendered
 * output.
 *
 * The ids must match the ones `rehype-slug` puts on the rendered headings,
 * otherwise every section link would point at nothing. That is why this uses
 * `github-slugger` — the very same package rehype-slug uses internally, with
 * the same instance-level counter that disambiguates repeated headings
 * ("Examples", "Examples-1", ...). `content.test.js` renders a real file
 * through the real pipeline and asserts the two id lists are identical, so
 * any future drift fails the build rather than silently breaking anchors.
 */

/** Opening or closing line of a ``` or ~~~ fenced code block. */
const FENCE = /^\s{0,3}(`{3,}|~{3,})/
/** ATX heading: leading #s, text, optional trailing #s. */
const HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/

/**
 * Reduce Markdown inline syntax to the plain text a parser would produce,
 * because that text is what gets slugged.
 */
function toPlainText(markdown) {
  /*
   * Inline code is lifted out before anything else and put back at the end.
   *
   * Without that, a heading like `common_keys.csv` loses its underscores: the
   * backticks are stripped first, and the emphasis rules then read the bare
   * underscores as italic delimiters. rehype-slug, which parses properly,
   * keeps them — so the section link pointed at an id that did not exist.
   */
  const codeSpans = []
  // Delimited with a private-use character, which cannot occur in Markdown
  // source, so a heading such as "Step 2 of 3" is never mistaken for one.
  let text = markdown.replace(/`+([^`]*)`+/g, (_match, code) => {
    codeSpans.push(code)
    return `\uE000${codeSpans.length - 1}\uE000`
  })

  text = text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> label
    .replace(/(\*\*\*|___)(.*?)\1/g, '$2') // bold italic
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic with asterisks
    // Underscores only delimit emphasis between words, never inside one —
    // `snake_case_name` is a single word, not emphasis.
    .replace(/(^|[^\w])_([^_]+)_(?!\w)/g, '$1$2')
    .replace(/~~(.*?)~~/g, '$1') // strikethrough

  return text
    .replace(/\uE000(\d+)\uE000/g, (_match, index) => codeSpans[Number(index)])
    .trim()
}

/**
 * @param {string} markdown
 * @param {{ minDepth?: number, maxDepth?: number }} [options]
 * @returns {{ depth: number, text: string, id: string }[]}
 */
export function extractHeadings(markdown, { minDepth = 2, maxDepth = 3 } = {}) {
  const slugger = new GithubSlugger()
  const headings = []

  let openFence = null

  for (const line of markdown.split('\n')) {
    const fence = line.match(FENCE)

    if (fence) {
      const marker = fence[1][0]
      if (openFence === null) openFence = marker
      else if (openFence === marker) openFence = null
      continue
    }

    // "## something" inside a shell example is not a heading.
    if (openFence !== null) continue

    const heading = line.match(HEADING)
    if (!heading) continue

    const depth = heading[1].length
    const text = toPlainText(heading[2])

    /*
     * Slug EVERY heading, including ones outside the requested depth range.
     * rehype-slug walks the whole document, so skipping any heading here
     * would desynchronise the duplicate-name counter and produce ids that do
     * not match the rendered output.
     */
    const id = slugger.slug(text)

    if (depth < minDepth || depth > maxDepth) continue

    headings.push({ depth, text, id })
  }

  return headings
}
