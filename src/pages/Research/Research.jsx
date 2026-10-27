import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages } from '../../content'
import { getContentGroups } from '../../app/navigation'
import { isRouteImplemented } from '../../app/routeRegistry'
import Reveal from '../../components/shared/Reveal'
import styles from './Research.module.css'

/*
 * Methods & research: every published method and analysis page, and the way
 * to the code they were first published with.
 *
 * This is the directory the home page used to carry in full. The home page
 * now shows three category cards and links here, so the full list exists in
 * one place.
 *
 * NOTHING here is a list of pages. `getContentGroups` reads the content
 * registry and applies both gates — content approval (`status: published`)
 * and technical availability (the path resolves in the route table) — so
 * publishing a method makes it appear here on the next build, and a draft
 * such as Key to 2D Image cannot appear at all. The words are pages.json's.
 */
const EARLIER_PATH = '/research/earlier-implementations'

/* The page's three sections. Ids are stable anchors the home page links to. */
const SECTIONS = [
  { id: 'methods', category: 'method', heading: 'methodsHeading', intro: 'methodsIntro' },
  { id: 'analysis', category: 'analysis', heading: 'analysisHeading', intro: 'analysisIntro' },
]

function Directory({ id, category }) {
  const groups = getContentGroups(category)

  return groups.map((group) => (
    <section key={group.id} className={styles.group} aria-labelledby={`${id}-${group.id}`}>
      <h3 id={`${id}-${group.id}`} className={styles.groupHeading}>
        {group.label}
      </h3>
      <ul className={styles.list}>
        {group.methods.map((method, index) => (
          <Reveal as="li" key={method.slug} index={index} className={styles.card}>
            <h4 className={styles.cardTitle}>
              <Link to={method.path}>{method.shortTitle ?? method.title}</Link>
            </h4>
            <p className={styles.cardSummary}>{method.summary}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  ))
}

export default function Research() {
  const copy = pages.research

  usePageMetadata({ title: copy.title, description: copy.intro })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>
        {isRouteImplemented('/tsr') && (
          <p className={styles.core}>
            {copy.coreNote} <Link to="/tsr">{copy.coreAction}</Link>.
          </p>
        )}
      </header>

      {SECTIONS.map((section) => (
        <section key={section.id} className={styles.section} aria-labelledby={section.id}>
          <h2 id={section.id} className={styles.sectionHeading}>
            {copy[section.heading]}
          </h2>
          <p className={styles.blurb}>{copy[section.intro]}</p>
          <Directory id={section.id} category={section.category} />
        </section>
      ))}

      {isRouteImplemented(EARLIER_PATH) && (
        <section className={styles.section} aria-labelledby="earlier">
          <h2 id="earlier" className={styles.sectionHeading}>
            {copy.earlierHeading}
          </h2>
          <p className={styles.blurb}>{copy.earlierIntro}</p>
          <p>
            <Link to={EARLIER_PATH} className={styles.action}>
              {copy.earlierAction}
            </Link>
          </p>
        </section>
      )}
    </div>
  )
}
