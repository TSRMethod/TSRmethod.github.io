import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import CodeBlock from './CodeBlock'
import DataTable, { TableHeaderCell } from './DataTable'
import Callout from './Callout'
import OptimizedImage from '../shared/OptimizedImage'
import { toText, codeLanguage, findCodeChild } from '../../lib/hast'
import rehypeDetails from '../../lib/rehypeDetails'
import { DIAGRAMS } from '../figures/diagrams'
import styles from './MarkdownContent.module.css'

/*
 * Renders a content file's Markdown body.
 *
 * This module is the single place where Markdown syntax is mapped onto React
 * components. Content files stay plain Markdown — no JSX, no MDX — which is
 * what keeps them editable by someone who does not write code, and what will
 * let Pages CMS present the body as an ordinary rich-text field.
 *
 *   ```lang fence  -> CodeBlock   (language label, copy button, scroll area)
 *   | table |      -> DataTable   (scoped headers, scrollable container)
 *   ![alt](src)    -> <figure>    (lazy loaded, alt text preserved)
 *   > quote        -> Callout
 *   > [!DETAILS] … -> <details>   (closed until opened; see lib/rehypeDetails)
 *   ## / ###       -> headings with ids from rehype-slug, matching the
 *                     section navigation
 */

const components = {
  pre({ node }) {
    const codeNode = findCodeChild(node)
    return (
      <CodeBlock
        code={toText(codeNode).replace(/\n$/, '')}
        language={codeLanguage(codeNode)}
      />
    )
  },

  table({ children }) {
    return <DataTable>{children}</DataTable>
  },

  th({ children, ...props }) {
    // `node` is injected by react-markdown and is not a DOM attribute.
    delete props.node
    return <TableHeaderCell {...props}>{children}</TableHeaderCell>
  },

  blockquote({ children }) {
    return <Callout>{children}</Callout>
  },

  /*
   * Images written inside Markdown go through the same optimisation as the
   * ones in frontmatter. Without this, an editor illustrating a tutorial with
   * `![…](/images/uploads/…)` would be the one path still serving the raw
   * upload — the slowest images on the site, in its longest pages.
   */
  img({ src, alt }) {
    /* A figure the site draws, placed with ![](diagram:id?prop=value). */
    if (src?.startsWith('diagram:')) {
      const [id, query = ''] = src.slice('diagram:'.length).split('?')
      const Diagram = DIAGRAMS[id]
      return Diagram ? <Diagram {...Object.fromEntries(new URLSearchParams(query))} /> : null
    }

    return (
      <figure className={styles.figure}>
        <OptimizedImage src={src} alt={alt ?? ''} sizes="(min-width: 1024px) 76ch, 100vw" />
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    )
  },

  /*
   * An image on a line of its own is a figure, not part of a paragraph: a
   * <figure> inside a <p> is invalid HTML, and the browser would split the
   * paragraph around it. Any other paragraph renders as usual.
   */
  p({ node, children }) {
    const only = node?.children?.filter((child) => !(child.type === 'text' && !child.value.trim()))
    if (only?.length === 1 && only[0].tagName === 'img') return <>{children}</>
    return <p>{children}</p>
  },

  a({ href, children, ...props }) {
    delete props.node
    const external = href?.startsWith('http')
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  },
}

/*
 * react-markdown drops any address whose scheme it does not know, which
 * would turn ![](diagram:…) into an image with no source. The site's own
 * `diagram:` scheme is let through; every other address gets the library's
 * usual treatment.
 */
function urlTransform(url) {
  return url.startsWith('diagram:') ? url : defaultUrlTransform(url)
}

export default function MarkdownContent({ children }) {
  return (
    <div className={styles.prose}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeDetails]}
        components={components}
        urlTransform={urlTransform}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
