import { Link } from 'react-router-dom'
import { getContentGroups } from '../../app/navigation'
import HomeSection from './HomeSection'
import Reveal from '../shared/Reveal'
import styles from './ContentShowcase.module.css'

/*
 * The published pages of one content category, in the same labelled groups the
 * navigation uses.
 *
 * NOTHING here is a list of pages. `getContentGroups` reads the content
 * registry and applies both gates — content approval (`status: published`) and
 * technical availability (the path resolves in the route table) — so:
 *
 *   - publishing a method makes it appear here on the next build;
 *   - a draft such as Key to 2D Image cannot appear, and neither can the two
 *     unmigrated legacy pages, because they have no content file at all;
 *   - no URL is written down twice, so none can go stale.
 *
 * One component serves both the TSR-based methods and the analysis tools; they
 * differ only in the category they ask for and the wording above them.
 */
export default function ContentShowcase({ id, heading, intro, category, tone }) {
  const groups = getContentGroups(category)

  if (groups.length === 0) return null

  return (
    <HomeSection id={id} heading={heading} intro={intro} tone={tone}>
      <div className={styles.groups}>
        {groups.map((group) => (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={`${id}-${group.id}`}
          >
            <h3 id={`${id}-${group.id}`} className={styles.groupHeading}>
              {group.label}
            </h3>
            <ul className={styles.list}>
              {group.methods.map((method, index) => (
                <Reveal
                  as="li"
                  key={method.slug}
                  index={index}
                  className={styles.card}
                >
                  <h4 className={styles.cardTitle}>
                    <Link to={method.path}>
                      {method.shortTitle ?? method.title}
                    </Link>
                  </h4>
                  <p className={styles.cardSummary}>{method.summary}</p>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </HomeSection>
  )
}
