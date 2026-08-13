import { Link } from 'react-router-dom'
import { home, repositories } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import { SOFTWARE_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import styles from './SoftwareOverview.module.css'

const SOFTWARE_PATH = '/software'

/*
 * The packages, from the repositories collection.
 *
 * No installation command is printed here. TSR-Package is installed from
 * source — clone, create a virtual environment, `pip install .` — and it is
 * not on PyPI, so a one-line `pip install tsr-package` would be an invention.
 * The exact, verified commands are on /tsr, and this section links there
 * rather than keeping a second copy that could fall out of date.
 *
 * The link to a full software catalogue appears by itself when Stage 8 builds
 * that route: until then `isRouteImplemented` reports it missing and the link
 * is not rendered.
 */
export default function SoftwareOverview({ tone }) {
  const { heading, intro } = home.software
  const hasSoftwarePage = isRouteImplemented(SOFTWARE_PATH)

  if (repositories.length === 0) return null

  return (
    <HomeSection
      id={SOFTWARE_SECTION_ID}
      heading={heading}
      intro={intro}
      tone={tone}
      action={
        hasSoftwarePage ? (
          <Link to={SOFTWARE_PATH}>All software</Link>
        ) : (
          <Link to="/tsr">Installation instructions and worked examples</Link>
        )
      }
    >
      <ul className={styles.list}>
        {repositories.map((repository) => (
          <li key={repository.id} className={styles.card}>
            <h3 className={styles.name}>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repository.name}
                <span className="visually-hidden"> on GitHub (opens in a new tab)</span>
              </a>
            </h3>
            {repository.description && (
              <p className={styles.description}>{repository.description}</p>
            )}
            {repository.language && (
              <p className={styles.language}>{repository.language}</p>
            )}
          </li>
        ))}
      </ul>
    </HomeSection>
  )
}
