import { Link } from 'react-router-dom'
import { home } from '../../content'
import HomeSection from './HomeSection'
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
            <img src={figure.src} alt={figure.alt} decoding="async" />
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
