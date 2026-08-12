import { useMemo } from 'react'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { getPublishedMethod, formatCitation } from '../../content'
import NotFound from '../../pages/NotFound/NotFound'
import MarkdownContent from './MarkdownContent'
import SectionNavigation from './SectionNavigation'
import SlurmGuide from './SlurmGuide'
import SourceCodeCard from './SourceCodeCard'
import Callout from './Callout'
import styles from './MethodPage.module.css'

const SLURM_ID = 'slurm-and-hpc'
const SOURCE_ID = 'source-code'
const REFERENCES_ID = 'references'

/*
 * Renders one method or tutorial page from a content file.
 *
 * Every method page in the site is this component with a different slug. The
 * previous site repeated the same ~250 lines of section scaffolding in
 * fifteen files; the equivalent here is one Markdown file per method.
 *
 * The page is assembled in three parts:
 *
 *   1. A header built from frontmatter — title, summary, paper, figure.
 *   2. The Markdown body, whose `##` headings become the page's sections.
 *   3. Sections rendered from structured frontmatter — Slurm, repositories,
 *      references — appended in the same order the legacy pages used.
 *
 * The section navigation lists both kinds, so the reader sees one continuous
 * table of contents and cannot tell which sections came from which source.
 */
export default function MethodPage({ slug }) {
  const method = getPublishedMethod(slug)

  useDocumentTitle(method?.title)

  /*
   * Content headings come from the Markdown; the trailing sections are
   * component-rendered and so must be added by hand. Their ids are fixed
   * constants shared with the components that render them.
   */
  const sections = useMemo(() => {
    if (!method) return []

    const fromBody = method.headings.map(({ id, text, depth }) => ({
      id,
      text,
      depth,
    }))

    const appended = []
    if (method.slurm) {
      appended.push({ id: SLURM_ID, text: 'Running on an HPC cluster', depth: 2 })
    }
    if (method.repositories.length > 0) {
      appended.push({ id: SOURCE_ID, text: 'Source code', depth: 2 })
    }
    if (method.references.length > 0) {
      appended.push({ id: REFERENCES_ID, text: 'References', depth: 2 })
    }

    return [...fromBody, ...appended]
  }, [method])

  /*
   * A draft slug resolves to nothing, so an unreviewed page is a 404 even if
   * someone types the address. This is the routing half of the guarantee that
   * `status: draft` keeps content off the site.
   */
  if (!method) return <NotFound />

  const citation = formatCitation(method.paper)

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{method.title}</h1>
        <p className={styles.summary}>{method.summary}</p>

        {method.paper && (
          <p className={styles.paper}>
            <a href={method.paper.url} target="_blank" rel="noopener noreferrer">
              Read the paper
              <span className="visually-hidden">
                {method.paper.title ? `: ${method.paper.title}` : ''} (opens in
                a new tab)
              </span>
            </a>
            {citation && <span className={styles.paperMeta}>{citation}</span>}
          </p>
        )}

        {method.review?.note && (
          <Callout tone="review" title="Under review">
            <p>{method.review.note}</p>
          </Callout>
        )}

        {method.figure && (
          <figure className={styles.figure}>
            <img
              src={method.figure.src}
              alt={method.figure.alt}
              loading="lazy"
              decoding="async"
            />
            {method.figure.caption && (
              <figcaption>{method.figure.caption}</figcaption>
            )}
          </figure>
        )}
      </header>

      <div className={styles.body}>
        <SectionNavigation sections={sections} />

        <div className={styles.content}>
          <MarkdownContent>{method.body}</MarkdownContent>

          <SlurmGuide slurm={method.slurm} headingId={SLURM_ID} />

          {method.repositories.length > 0 && (
            <section className={styles.section} aria-labelledby={SOURCE_ID}>
              <h2 id={SOURCE_ID} className={styles.sectionHeading}>
                Source code
              </h2>
              <ul className={styles.repositories}>
                {method.repositories.map((repository) => (
                  <SourceCodeCard key={repository.url} repository={repository} />
                ))}
              </ul>
            </section>
          )}

          {method.references.length > 0 && (
            <section className={styles.section} aria-labelledby={REFERENCES_ID}>
              <h2 id={REFERENCES_ID} className={styles.sectionHeading}>
                References
              </h2>
              <ul className={styles.references}>
                {method.references.map((reference) => (
                  <li key={reference.url}>
                    <a
                      href={reference.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {reference.title ?? reference.url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  )
}
