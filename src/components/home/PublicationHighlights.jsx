import { Link } from 'react-router-dom'
import {
  home,
  getRecentPublications,
  formatPublicationCitation,
  doiUrl,
} from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import { PUBLICATIONS_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import styles from './PublicationHighlights.module.css'

const PUBLICATIONS_PATH = '/publications'
const NAMES_SHOWN = 3

/*
 * The three most recent papers, read from the publication records.
 *
 * No title, author list or DOI is written into this file: adding a paper
 * through the CMS moves the list along on its own, and the heading ("Recent
 * publications") states the selection rule rather than implying an editorial
 * judgement that nothing here makes.
 *
 * The section removes itself when there are no publications at all, so an
 * empty collection produces a shorter home page rather than an empty heading.
 */

/** "Milon, Wang, Fontenot and 4 others" — long author lists are noise here. */
function shortAuthors(authors = []) {
  if (authors.length <= NAMES_SHOWN) return authors.join(', ')

  const shown = authors.slice(0, NAMES_SHOWN).join(', ')
  const rest = authors.length - NAMES_SHOWN
  return `${shown} and ${rest} ${rest === 1 ? 'other' : 'others'}`
}

export default function PublicationHighlights({ tone }) {
  const { heading, intro, cta } = home.publications
  const recent = getRecentPublications()

  if (recent.length === 0) return null

  return (
    <HomeSection
      id={PUBLICATIONS_SECTION_ID}
      heading={heading}
      intro={intro}
      tone={tone}
      action={
        isRouteImplemented(PUBLICATIONS_PATH) ? (
          <Link to={PUBLICATIONS_PATH}>{cta}</Link>
        ) : null
      }
    >
      <ul className={styles.list}>
        {recent.map((publication) => {
          const url = doiUrl(publication.doi)
          const citation = formatPublicationCitation(publication)

          return (
            <li key={publication.id} className={styles.publication}>
              <h3 className={styles.title}>{publication.title}</h3>
              <p className={styles.authors}>
                {shortAuthors(publication.authors)}
              </p>
              {citation && <p className={styles.citation}>{citation}</p>}
              {url && (
                <p className={styles.doi}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    doi.org/{publication.doi}
                    <span className="visually-hidden">
                      {` — ${publication.title} (opens in a new tab)`}
                    </span>
                  </a>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </HomeSection>
  )
}
