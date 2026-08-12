import { Link } from 'react-router-dom'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { isRouteImplemented } from '../../app/routeRegistry'
import styles from './Footer.module.css'

/*
 * Footer links go through the same availability gate as the main navigation,
 * so the footer can never advertise a page that has not been built. The
 * Explore column disappears entirely while none of its targets exist.
 */
const EXPLORE = [
  { to: '/tsr', label: 'TSR Method' },
  { to: '/publications', label: 'Publications' },
  { to: '/people', label: 'People' },
  { to: '/software', label: 'Software' },
]

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
  const explore = EXPLORE.filter((link) => isRouteImplemented(link.to))

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.column}>
          <h2 className={styles.heading}>{siteConfig.name}</h2>
          <p className={styles.text}>
            Alignment-free comparison of 3D protein structures.
          </p>
        </div>

        {explore.length > 0 && (
          <nav className={styles.column} aria-labelledby="footer-explore">
            <h2 className={styles.heading} id="footer-explore">
              Explore
            </h2>
            <ul className={styles.links}>
              {explore.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

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
