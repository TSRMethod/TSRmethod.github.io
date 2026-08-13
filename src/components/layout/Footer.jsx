import { Link } from 'react-router-dom'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { isRouteImplemented } from '../../app/routeRegistry'
import styles from './Footer.module.css'

/*
 * Footer links go through the same availability gate as the main navigation,
 * so the footer can never advertise a page that has not been built. A column
 * whose targets all fail the gate disappears entirely.
 *
 * Two columns rather than one long list, matching the split in the main menu:
 * what the site documents, and who is behind it.
 */
const EXPLORE = [
  { to: '/tsr', label: 'TSR Method' },
  { to: '/software', label: 'Software' },
  { to: '/publications', label: 'Publications' },
]

const ABOUT = [
  { to: '/people', label: 'People' },
  { to: '/contact', label: 'Contact' },
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
function LinkColumn({ id, heading, links }) {
  const available = links.filter((link) => isRouteImplemented(link.to))
  if (available.length === 0) return null

  return (
    <nav className={styles.column} aria-labelledby={id}>
      <h2 className={styles.heading} id={id}>
        {heading}
      </h2>
      <ul className={styles.links}>
        {available.map((link) => (
          <li key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.column}>
          <h2 className={styles.heading}>{siteConfig.name}</h2>
          <p className={styles.text}>{siteConfig.tagline}</p>
        </div>

        <LinkColumn id="footer-explore" heading="Explore" links={EXPLORE} />
        <LinkColumn id="footer-about" heading="About" links={ABOUT} />

        <div className={styles.column}>
          <h2 className={styles.heading}>Support</h2>
          <ul className={styles.links}>
            <li>
              <a href={mailtoHref()}>{siteConfig.email}</a>
            </li>
            <li>
              <a href={siteConfig.github.orgUrl}>{siteConfig.github.org} on GitHub</a>
            </li>
            {/*
             * The website's own issue tracker, for a problem with these pages.
             * Problems with the research code belong on the repository that
             * provides it, which /software links to for each one — labelled so
             * the two are not confused.
             */}
            <li>
              <a href={siteConfig.github.issuesUrl}>Report a website problem</a>
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
