import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages, softwareRelease } from '../../content'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { EVENTS, trackEvent } from '../../lib/analytics'
import { isRouteImplemented } from '../../app/routeRegistry'
import CopyButton from '../../components/shared/CopyButton'
import ExternalLink from '../../components/software/ExternalLink'
import trackRepositoryLink from '../../components/software/trackRepositoryLink'
import styles from './Contact.module.css'

const EARLIER_PATH = '/research/earlier-implementations'

/*
 * The website's QR code, as committed in public/share. Static files: they
 * encode the address itself, with no shortener or tracking service in
 * between, so they keep working for as long as the site does. How they were
 * made and checked is in docs/DEPLOYMENT.md.
 */
const QR_SVG = '/share/tsr-website-qr.svg'
const QR_PNG = '/share/tsr-website-qr.png'

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
    shareHeading,
    shareBody,
  } = pages.contact

  const websiteAddress = `${siteConfig.url}/`

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
          <a
            className={styles.button}
            href={mailtoHref('TSR enquiry')}
            onClick={() => trackEvent(EVENTS.contact, { contact_type: 'email' })}
          >
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
        {/*
         * One link per thing a visitor may be looking for: BioTSR's own issue
         * tracker, or the list of every other repository, each of which links
         * to its own.
         */}
        {softwareRelease?.issuesUrl && (
          <p className={styles.action}>
            <ExternalLink
              label="Report a BioTSR problem"
              href={softwareRelease.issuesUrl}
              context="on GitHub"
              onClick={() => trackRepositoryLink(softwareRelease.id, 'issues')}
            />
          </p>
        )}
        {isRouteImplemented(EARLIER_PATH) && (
          <p className={styles.action}>
            <Link to={EARLIER_PATH}>Earlier implementations</Link>
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

      {/*
       * Last and small: this is for someone making a poster or a slide, not
       * a way into the site. The address is printed and linked beside the
       * code, so nobody has to scan anything to use it.
       */}
      <section className={styles.section} aria-labelledby="contact-share">
        <h2 id="contact-share" className={styles.heading}>
          {shareHeading}
        </h2>
        <div className={styles.share}>
          <img
            className={styles.qr}
            src={QR_SVG}
            alt={`QR code for ${websiteAddress}`}
            width="148"
            height="148"
          />
          <div className={styles.shareText}>
            <p className={styles.body}>{shareBody}</p>
            <p className={styles.website}>
              <a href={websiteAddress}>{websiteAddress}</a>
            </p>
            <div className={styles.actions}>
              <CopyButton
                value={websiteAddress}
                label="Copy website address"
                copiedLabel="Address copied"
                failedLabel="Could not copy — please select the address above"
              />
            </div>
            {/*
              The visible labels are short. Each accessible name starts with
              the visible words, so voice control still matches them, and
              still makes sense read out of context.
            */}
            <ul className={styles.downloads}>
              <li>
                <a href={QR_PNG} download aria-label="Download PNG of the website QR code">
                  Download PNG
                </a>
              </li>
              <li>
                <a href={QR_SVG} download aria-label="Download SVG of the website QR code">
                  Download SVG
                </a>
                <span className={styles.format}> · Print quality</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
