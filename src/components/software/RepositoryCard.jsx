import { Link } from 'react-router-dom'
import { getPagesForRepository, repositoryPath } from '../../content'
import Reveal from '../shared/Reveal'
import ExternalLink from './ExternalLink'
import trackRepositoryLink from './trackRepositoryLink'
import { EVENTS, trackEvent } from '../../lib/analytics'
import styles from './RepositoryCard.module.css'

/*
 * One repository: what it is, whose it is, its licence, and which pages of
 * this site document it.
 *
 * Everything shown is read from the repository's record; nothing about any
 * repository is written here. The licence is the record's own statement of
 * what the repository says on GitHub. It is shown per repository because the
 * repositories do not share one: BioTSR's Apache License 2.0 covers BioTSR
 * and nothing listed beside it.
 */

/** What the reader is actually getting, in two words. */
const KIND_LABEL = {
  package: 'Installable Python package',
  scripts: 'Research scripts',
}

export default function RepositoryCard({ repository, index }) {
  const path = repositoryPath(repository.url)
  const documentation = getPagesForRepository(repository.url)

  return (
    <Reveal as="li" index={index} className={styles.repository}>
      <h3 className={styles.name}>
        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackRepositoryLink(repository.id, 'repository')}
        >
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

      {repository.licence && (
        <p className={styles.licence}>
          <span className={styles.licenceLabel}>Licence</span> {repository.licence}
        </p>
      )}

      {documentation.length > 0 && (
        <div className={styles.documentation}>
          <h4 className={styles.documentationHeading}>Documented on this site</h4>
          <ul className={styles.documentationList}>
            {documentation.map((method) => (
              <li key={method.slug}>
                <Link
                  to={method.path}
                  onClick={() =>
                    trackEvent(EVENTS.tutorialLink, {
                      method_slug: method.slug,
                      repository_id: repository.id,
                      link_type: 'documentation',
                    })
                  }
                >
                  {method.shortTitle ?? method.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {repository.issuesUrl && (
        <p className={styles.issues}>
          <ExternalLink
            label="Report a problem"
            href={repository.issuesUrl}
            context={`with ${repository.name} on GitHub`}
            onClick={() => trackRepositoryLink(repository.id, 'issues')}
          />
        </p>
      )}
    </Reveal>
  )
}

/** A group of repository cards, as one labelled list. */
export function RepositoryList({ repositories, labelledBy }) {
  return (
    <ul className={styles.list} aria-labelledby={labelledBy}>
      {repositories.map((repository, index) => (
        <RepositoryCard key={repository.id} repository={repository} index={index} />
      ))}
    </ul>
  )
}
