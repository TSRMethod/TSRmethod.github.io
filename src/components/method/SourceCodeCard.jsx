import { getRepositoryByUrl, repositoryPath } from '../../content'
import { EVENTS, trackEvent } from '../../lib/analytics'
import Reveal from '../shared/Reveal'
import styles from './SourceCodeCard.module.css'

/*
 * A repository listed on a method page.
 *
 * Replaces the previous site's "Source Code" section, which put a bare URL
 * inside a code block wrapped in an anchor. One card per repository, because
 * some methods legitimately have more than one.
 */
export default function SourceCodeCard({ repository, index }) {
  const { name, url, description, language } = repository

  /*
   * The collection's id when the repository has a record, and its
   * "owner/name" path when it does not — both stable, neither the display
   * name, which an editor may reword.
   */
  const record = getRepositoryByUrl(url)
  const repositoryId = record?.id ?? repositoryPath(url) ?? url

  return (
    <Reveal as="li" index={index} className={styles.card}>
      <h3 className={styles.name}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackEvent(EVENTS.repositoryLink, {
              repository_id: repositoryId,
              link_type: 'source',
            })
          }
        >
          {name}
          {/* Warn screen reader users that the link leaves the site, since
              sighted users get that from the icon. */}
          <span className="visually-hidden"> (opens on GitHub)</span>
        </a>
      </h3>

      {description && <p className={styles.description}>{description}</p>}

      {language && (
        <p className={styles.meta}>
          <span className="visually-hidden">Language: </span>
          {language}
        </p>
      )}
    </Reveal>
  )
}
