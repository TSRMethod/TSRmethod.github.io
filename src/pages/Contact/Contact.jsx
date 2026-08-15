import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages } from '../../content'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { isRouteImplemented } from '../../app/routeRegistry'
import CopyButton from '../../components/shared/CopyButton'
import styles from './Contact.module.css'

const SOFTWARE_PATH = '/software'

/*
 * How to reach the group.
 *
 * There is no form. The previous site had two — a "Contact Us" form and a
 * "Problems" form — and neither sent anything anywhere: both logged to the
 * browser console, and the second then displayed "Thank you for your
 * submission! We will be in touch with you soon." A static site cannot deliver
 * a message, and adding a backend so that a page can look conventional would
 * be a server to run, secure and pay for in order to do worse than a mailto.
 *
 * The address is never written out in this file. It comes from site.json
 * through siteConfig, which is also where the footer and the home page get it,
 * so changing it is one edit in the CMS.
 */
export default function Contact() {
  const {
    title,
    intro,
    emailHeading,
    emailAction,
    collaborationHeading,
    collaborationBody,
    softwareHeading,
    softwareBody,
    affiliationHeading,
  } = pages.contact

  usePageMetadata({ title, description: intro })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>

      <section className={styles.section} aria-labelledby="contact-email">
        <h2 id="contact-email" className={styles.heading}>
          {emailHeading}
        </h2>

        {/*
         * The address is shown as text as well as linked, so it can be read,
         * selected and copied by hand by anyone whose browser blocks the
         * clipboard or who does not use a mail client.
         */}
        <p className={styles.address}>{siteConfig.email}</p>

        <div className={styles.actions}>
          <a className={styles.button} href={mailtoHref('TSR enquiry')}>
            {emailAction}
          </a>
          <CopyButton
            value={siteConfig.email}
            label="Copy email address"
            copiedLabel="Address copied"
            failedLabel="Could not copy — please select the address above"
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="contact-research">
        <h2 id="contact-research" className={styles.heading}>
          {collaborationHeading}
        </h2>
        <p className={styles.body}>{collaborationBody}</p>
      </section>

      <section className={styles.section} aria-labelledby="contact-software">
        <h2 id="contact-software" className={styles.heading}>
          {softwareHeading}
        </h2>
        <p className={styles.body}>{softwareBody}</p>
        {isRouteImplemented(SOFTWARE_PATH) && (
          <p className={styles.action}>
            <Link to={SOFTWARE_PATH}>Find the right repository</Link>
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="contact-affiliation">
        <h2 id="contact-affiliation" className={styles.heading}>
          {affiliationHeading}
        </h2>
        {/*
         * Affiliations and the code host, from the same lists the footer uses.
         * Stated as affiliations of the group, which is what they are — this
         * site is the group's own, not a university publication.
         */}
        <ul className={styles.affiliations}>
          {siteConfig.affiliations.map((affiliation) => (
            <li key={affiliation.id}>
              <a
                href={affiliation.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {affiliation.name}
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
          <li>
            <a
              href={siteConfig.github.orgUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {siteConfig.github.org} on GitHub
              <span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </section>
    </div>
  )
}
