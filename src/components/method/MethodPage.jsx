import { useMemo } from 'react'
import usePageMetadata from '../../hooks/usePageMetadata'
import { getPublishedMethod, formatCitation } from '../../content'
import NotFound from '../../pages/NotFound/NotFound'
import MarkdownContent from './MarkdownContent'
import SectionNavigation from './SectionNavigation'
import SlurmGuide from './SlurmGuide'
import SourceCodeCard from './SourceCodeCard'
import Reveal from '../shared/Reveal'
import OptimizedImage from '../shared/OptimizedImage'
import Callout from './Callout'
import { DIAGRAMS } from '../figures/diagrams'
import styles from './MethodPage.module.css'

const SLURM_ID = 'slurm-and-hpc'
const SOURCE_ID = 'source-code'
const REFERENCES_ID = 'references'

/*
 * Sections whose text now lives in the source-code cards. A page that no
 * longer has one of these headings keeps its id on the source-code section, so
 * an old link such as /methods/mirror-image#earlier-implementation still lands
 * on the earlier package's card rather than at the top of the page.
 */
const RETIRED_SECTION_IDS = ['earlier-implementation', 'earlier-scripts']

/*
 * "Reproduced from <source>. © 2024 the authors. CC BY 4.0. Resized for the
 * web." — the attribution a figure taken from a publication must carry.
 */
function FigureCredit({ credit }) {
  if (!credit) return null
  return (
    <span className={styles.credit}>
      {credit.use === 'adapted' ? 'Adapted from ' : 'Reproduced from '}
      <a href={credit.url} target="_blank" rel="noopener noreferrer">
        {credit.source}
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
      .{credit.copyright && ` ${credit.copyright}.`}{' '}
      {credit.licenceUrl ? (
        <a href={credit.licenceUrl} target="_blank" rel="noopener noreferrer license">
          {credit.licence}
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      ) : (
        credit.licence
      )}
      .{credit.changes && ` ${credit.changes}`}
    </span>
  )
}

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
/*
 * `entry` renders an already-built entry instead of looking the slug up. It
 * exists for the template's own tests, which render a fixture page carrying
 * every block type (src/test/fixtures/method-kit.md); no route passes it, so
 * it is not a way to show a draft.
 */
export default function MethodPage({ slug, entry }) {
  const method = entry ?? getPublishedMethod(slug)

  usePageMetadata({ title: method?.title, description: method?.summary })

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
  const Diagram = method.diagram ? DIAGRAMS[method.diagram] : null

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
            {/*
             * The one image above the fold on a method page, so it loads
             * eagerly — lazy-loading the thing the reader came to look at
             * delays the largest paint for no benefit.
             */}
            <OptimizedImage
              src={method.figure.src}
              alt={method.figure.alt}
              sizes="(min-width: 1024px) 76ch, 100vw"
              loading="eager"
              fetchPriority="high"
            />
            {(method.figure.caption || method.figure.credit) && (
              <figcaption>
                {method.figure.caption}
                <FigureCredit credit={method.figure.credit} />
              </figcaption>
            )}
          </figure>
        )}
      </header>

      <div className={styles.body}>
        <SectionNavigation sections={sections} />

        <div className={styles.content}>
          {Diagram && <Diagram />}
          <MarkdownContent>{method.body}</MarkdownContent>

          <SlurmGuide slurm={method.slurm} headingId={SLURM_ID} />

          {method.repositories.length > 0 && (
            <Reveal
              as="section"
              className={styles.section}
              aria-labelledby={SOURCE_ID}
            >
              {RETIRED_SECTION_IDS.filter(
                (id) => !method.headings.some((heading) => heading.id === id),
              ).map((id) => (
                <span key={id} id={id} className={styles.anchor} aria-hidden="true" />
              ))}
              <h2 id={SOURCE_ID} className={styles.sectionHeading}>
                Source code
              </h2>
              <ul className={styles.repositories}>
                {method.repositories.map((repository, index) => (
                  <SourceCodeCard
                    key={repository.url}
                    repository={repository}
                    index={index}
                  />
                ))}
              </ul>
            </Reveal>
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
