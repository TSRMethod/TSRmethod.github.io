import usePageMetadata from '../../hooks/usePageMetadata'
import {
  pages,
  publicationsByYear,
  formatPublicationCitation,
  doiUrl,
} from '../../content'
import styles from './Publications.module.css'

/*
 * The publications list.
 *
 * Grouped by year rather than shown as one flat run, because that is how a
 * reader scans an academic list — "what came out recently?" is the usual
 * question, and a year heading answers it without a filter control.
 *
 * Deliberately plain: no images, no cards, no search. The previous site gave
 * each paper a bordered card with its full abstract always visible, which made
 * seven papers into a very long page. Here the abstract is behind a native
 * <details>, so the list stays scannable and nothing needs JavaScript.
 */

function groupByYear(publications) {
  const groups = []

  for (const publication of publications) {
    const year = publication.year ?? null
    const last = groups.at(-1)

    if (last && last.year === year) last.publications.push(publication)
    else groups.push({ year, publications: [publication] })
  }

  return groups
}

/** "Undated" rather than a bare heading, on the rare record with no year. */
function yearLabel(year) {
  return year === null ? 'Undated' : String(year)
}

function Publication({ publication }) {
  const citation = formatPublicationCitation(publication)
  const url = doiUrl(publication.doi)

  return (
    <li className={styles.publication}>
      <h3 className={styles.title}>{publication.title}</h3>

      {publication.authors?.length > 0 && (
        <p className={styles.authors}>{publication.authors.join(', ')}</p>
      )}

      {citation && <p className={styles.citation}>{citation}</p>}

      {publication.abstract && (
        <details className={styles.abstract}>
          <summary>Abstract</summary>
          <p>{publication.abstract}</p>
        </details>
      )}

      {url && (
        <p className={styles.doi}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {/*
             * The DOI itself is the link text: it is unique to this paper, so
             * a screen reader listing every link on the page gets one distinct
             * entry per publication instead of fifteen identical "read more"s.
             * The title follows, hidden, so the entry is self-explanatory.
             */}
            doi.org/{publication.doi}
            <span className="visually-hidden">
              {` — ${publication.title} (opens in a new tab)`}
            </span>
          </a>
        </p>
      )}
    </li>
  )
}

export default function Publications() {
  const { title, intro } = pages.publications

  usePageMetadata({ title, description: intro })

  const years = groupByYear(publicationsByYear)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>

      {years.map(({ year, publications }) => (
        <section
          key={yearLabel(year)}
          className={styles.year}
          aria-labelledby={`year-${yearLabel(year)}`}
        >
          <h2 id={`year-${yearLabel(year)}`} className={styles.yearHeading}>
            {yearLabel(year)}
          </h2>
          <ul className={styles.list}>
            {publications.map((publication) => (
              <Publication key={publication.id} publication={publication} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
