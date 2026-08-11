import { Link } from 'react-router-dom'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import styles from './Footer.module.css'

/*
 * Site footer.
 *
 * The contact address comes from siteConfig — the previous footer hard-coded a
 * placeholder address that was never a real inbox.
 *
 * The old standalone /community and /problems routes are folded in here:
 * affiliations become a credits list, and problem reporting links to GitHub
 * Issues instead of a form that only pretended to send anything.
 */
export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.column}>
          <h2 className={styles.heading}>{siteConfig.name}</h2>
          <p className={styles.text}>
            Alignment-free comparison of 3D protein structures.
          </p>
        </div>

        <nav className={styles.column} aria-labelledby="footer-explore">
          <h2 className={styles.heading} id="footer-explore">
            Explore
          </h2>
          <ul className={styles.links}>
            <li>
              <Link to="/tsr">TSR Method</Link>
            </li>
            <li>
              <Link to="/publications">Publications</Link>
            </li>
            <li>
              <Link to="/people">People</Link>
            </li>
            <li>
              <Link to="/software">Software</Link>
            </li>
          </ul>
        </nav>

        <div className={styles.column}>
          <h2 className={styles.heading}>Contact</h2>
          <ul className={styles.links}>
            <li>
              <a href={mailtoHref()}>{siteConfig.email}</a>
            </li>
            <li>
              <a href={siteConfig.github.orgUrl}>GitHub</a>
            </li>
            <li>
              <a href={siteConfig.github.issuesUrl}>Report an issue</a>
            </li>
          </ul>
        </div>

        <div className={styles.column}>
          <h2 className={styles.heading}>Affiliations</h2>
          <ul className={styles.links}>
            {siteConfig.affiliations.map((affiliation) => (
              <li key={affiliation.id}>
                <a href={affiliation.url}>{affiliation.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className={styles.legal}>
        &copy; {new Date().getFullYear()} {siteConfig.name}
      </p>
    </footer>
  )
}
