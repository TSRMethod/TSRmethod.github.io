import { Link } from 'react-router-dom'
import { home } from '../../content'
import HomeSection from './HomeSection'
import OptimizedImage from '../shared/OptimizedImage'
import styles from './TsrIntroduction.module.css'

/*
 * A short explanation of what TSR does, and the diagram that makes it concrete.
 *
 * Deliberately a summary. The full derivation, the parameter tables and the
 * tutorial live on /tsr, and duplicating any of that here would give the site
 * two copies of the same explanation to keep in step.
 */
export default function TsrIntroduction() {
  const { heading, body, cta, figure } = home.introduction

  return (
    <HomeSection id="introduction" heading={heading}>
      <div className={styles.layout}>
        <p className={styles.body}>{body}</p>

        {figure && (
          <figure className={styles.figure}>
            {/*
             * Above the fold on the landing page: loaded eagerly and given
             * priority, because this is the largest paint and the first thing
             * that explains what the site is about.
             */}
            <OptimizedImage
              src={figure.src}
              alt={figure.alt}
              sizes="(min-width: 1024px) 60vw, 100vw"
              loading="eager"
              fetchPriority="high"
            />
            {figure.caption && <figcaption>{figure.caption}</figcaption>}
          </figure>
        )}
      </div>

      <p className={styles.action}>
        <Link to="/tsr">{cta}</Link>
      </p>
    </HomeSection>
  )
}
