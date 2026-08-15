import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import {
  pages,
  getRepositoriesByCategory,
  getPagesForRepository,
  repositoryPath,
} from '../../content'
import styles from './Software.module.css'

/*
 * The software catalogue.
 *
 * A directory, not a manual. Each entry says what a repository is for and
 * sends the reader to it; the installation commands, the input formats and the
 * worked examples stay on the method pages, which is where they were verified.
 * Repeating them here would mean two copies to keep in step, and the packages
 * are expected to be consolidated into a single one later — at which point a
 * second copy of today's import paths would be actively misleading.
 *
 * Nothing about any repository is written in this file. Names, URLs, owners,
 * descriptions and grouping all come from src/content/repositories, and the
 * links to documentation are derived from the method pages themselves. When a
 * consolidated package arrives, taking over the `core` group is an edit to one
 * JSON file: no JSX changes, and no GitHub account name to find in the layout.
 *
 * Section labels are here rather than in content for the same reason the
 * navigation's are: they are the site's taxonomy, not editorial copy, and an
 * editor renaming them would silently change how the page is organised.
 */
const SECTIONS = [
  {
    category: 'core',
    label: 'Core TSR software',
    blurb: 'The main implementation of the method and its variants.',
  },
  {
    category: 'method',
    label: 'Specialised TSR software',
    blurb:
      'Separate repositories for structures the core package does not cover: individual amino acids, nucleotides, and nucleotide–protein contacts.',
  },
  {
    category: 'analysis',
    label: 'Analysis and visualisation',
    blurb:
      'Code that works on keys once they have been generated — summarising them, clustering by them, and learning from them.',
  },
]

/** What the reader is actually getting, in two words. */
const KIND_LABEL = {
  package: 'Installable Python package',
  scripts: 'Research scripts',
}

function Repository({ repository }) {
  const path = repositoryPath(repository.url)
  const documentation = getPagesForRepository(repository.url)

  return (
    <li className={styles.repository}>
      <h3 className={styles.name}>
        <a href={repository.url} target="_blank" rel="noopener noreferrer">
          {repository.name}
          <span className="visually-hidden">
            {` — ${path ?? repository.url} on GitHub (opens in a new tab)`}
          </span>
        </a>
      </h3>

      <p className={styles.meta}>
        <span className={styles.kind}>{KIND_LABEL[repository.kind]}</span>
        {repository.language && (
          <span className={styles.language}>{repository.language}</span>
        )}
      </p>

      <p className={styles.description}>{repository.description}</p>

      {/*
       * The owner is shown, not hidden, because these repositories sit under
       * different accounts and a reader deciding whether to depend on one
       * should be able to see whose it is. Read from the URL, so it follows a
       * repository that moves.
       */}
      {path && <p className={styles.path}>github.com/{path}</p>}

      {documentation.length > 0 && (
        <div className={styles.documentation}>
          <h4 className={styles.documentationHeading}>Documented on this site</h4>
          <ul className={styles.documentationList}>
            {documentation.map((method) => (
              <li key={method.slug}>
                <Link to={method.path}>{method.shortTitle ?? method.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {repository.issuesUrl && (
        <p className={styles.issues}>
          <a
            href={repository.issuesUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Report a problem
            <span className="visually-hidden">
              {` with ${repository.name} on GitHub (opens in a new tab)`}
            </span>
          </a>
        </p>
      )}
    </li>
  )
}

export default function Software() {
  const { title, intro, note } = pages.software

  usePageMetadata({ title, description: intro })

  const sections = SECTIONS.map((section) => ({
    ...section,
    repositories: getRepositoriesByCategory(section.category),
  })).filter((section) => section.repositories.length > 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
        <p className={styles.note}>{note}</p>
      </header>

      {sections.map((section) => (
        <section
          key={section.category}
          className={styles.section}
          aria-labelledby={`software-${section.category}`}
        >
          <h2 id={`software-${section.category}`} className={styles.sectionHeading}>
            {section.label}
          </h2>
          <p className={styles.blurb}>{section.blurb}</p>
          <ul className={styles.list}>
            {section.repositories.map((repository) => (
              <Repository key={repository.id} repository={repository} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
