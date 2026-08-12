import styles from './SourceCodeCard.module.css'

/*
 * A repository listed on a method page.
 *
 * Replaces the previous site's "Source Code" section, which put a bare URL
 * inside a code block wrapped in an anchor. One card per repository, because
 * some methods legitimately have more than one.
 */
export default function SourceCodeCard({ repository }) {
  const { name, url, description, language } = repository

  return (
    <li className={styles.card}>
      <h3 className={styles.name}>
        <a href={url} target="_blank" rel="noopener noreferrer">
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
    </li>
  )
}
