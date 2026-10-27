import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages, getRepositoriesByCategory } from '../../content'
import { RepositoryList } from '../../components/software/RepositoryCard'
import styles from './Research.module.css'

/*
 * Earlier implementations and research code: the repositories that are not BioTSR.
 *
 * Two groups. The earlier implementations are the programs methods were
 * first published with, and which BioTSR now runs; the research tools are
 * code written for particular papers, some of it for analyses BioTSR does not
 * do. Every card states its repository's own licence.
 *
 * This listing was a section of the BioTSR page until the BioTSR page became
 * about BioTSR alone. /software#research-code still lands on a short section
 * there that links here, so an old link is never a dead end.
 */
const GROUPS = [
  { category: 'historical', heading: 'historicalHeading', intro: 'historicalIntro' },
  { category: 'analysis', heading: 'toolsHeading', intro: 'toolsIntro' },
]

export default function EarlierImplementations() {
  const copy = pages.earlierImplementations

  usePageMetadata({ title: copy.title, description: copy.intro })

  const groups = GROUPS.map((group) => ({
    ...group,
    repositories: getRepositoriesByCategory(group.category),
  })).filter((group) => group.repositories.length > 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          <Link to="/research">{pages.research.title}</Link>
        </p>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>

        {/*
         * The recommendation and its button are one thing, so they share a
         * box: a reader who came for an old program sees, in the same place,
         * what to use for new work. Kept small — the repositories are what
         * the page is for — and apart from the licence note, which is about
         * the code listed below rather than about BioTSR.
         */}
        <aside className={styles.recommendation} aria-label="Current software">
          <p>{copy.biotsrNote}</p>
          <Link to="/software" className={styles.action}>
            {copy.biotsrAction}
          </Link>
        </aside>

        <p className={styles.licence}>{copy.licenceNote}</p>
      </header>

      {groups.map((group) => (
        <section
          key={group.category}
          className={styles.section}
          aria-labelledby={`code-${group.category}`}
        >
          <h2 id={`code-${group.category}`} className={styles.sectionHeading}>
            {copy[group.heading]}
          </h2>
          <p className={styles.blurb}>{copy[group.intro]}</p>
          <RepositoryList
            repositories={group.repositories}
            labelledBy={`code-${group.category}`}
          />
        </section>
      ))}
    </div>
  )
}
