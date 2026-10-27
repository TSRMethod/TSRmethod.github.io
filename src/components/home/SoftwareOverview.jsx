import { Link } from 'react-router-dom'
import { home, softwareRelease } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import { SOFTWARE_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import CodeBlock from '../method/CodeBlock'
import styles from './SoftwareOverview.module.css'

const SOFTWARE_PATH = '/software'
const GET_STARTED_PATH = '/software/get-started'

/*
 * BioTSR on the home page, straight after the hero: the obvious place to
 * start for anyone who wants to compute TSR keys today.
 *
 * Two columns on a wide screen. On the left, what BioTSR does, as a sentence
 * and a few short points from home.json. On the right, the released version,
 * the one command that installs it, and the two ways in: Getting started
 * first, the BioTSR page second. On a phone the columns stack in that order.
 *
 * The version and the install command are built from the release record, the
 * same source as every other version-specific string on the site, so they
 * cannot name a different version from the pages they link to. Without a
 * release record the section says nothing rather than guess.
 */
export default function SoftwareOverview({ tone }) {
  const { heading, intro, highlights = [], installLabel, getStartedCta, softwareCta } =
    home.software
  const release = softwareRelease

  if (!release) return null

  return (
    <HomeSection id={SOFTWARE_SECTION_ID} heading={heading} intro={intro} tone={tone}>
      <div className={styles.layout}>
        {highlights.length > 0 && (
          <ul className={styles.highlights}>
            {highlights.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        )}

        <div className={styles.panel}>
          <p className={styles.facts}>
            <span className={styles.version}>
              {release.name} {release.version}
            </span>{' '}
            · Python {release.pythonVersions} on {release.platforms} · {release.licence}
          </p>

          <CodeBlock code={release.install} language="bash" filename={installLabel} />

          <div className={styles.actions}>
            {isRouteImplemented(GET_STARTED_PATH) && (
              <Link to={GET_STARTED_PATH} className={styles.primary}>
                {getStartedCta}
              </Link>
            )}
            {isRouteImplemented(SOFTWARE_PATH) && (
              <Link to={SOFTWARE_PATH} className={styles.secondary}>
                {softwareCta}
              </Link>
            )}
          </div>
        </div>
      </div>
    </HomeSection>
  )
}
