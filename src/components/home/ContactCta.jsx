import { Link } from 'react-router-dom'
import { home } from '../../content'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { isRouteImplemented } from '../../app/routeRegistry'
import { CONTACT_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import { EVENTS, trackEvent } from '../../lib/analytics'
import styles from './ContactCta.module.css'

const CONTACT_PATH = '/contact'

/*
 * Closing invitation.
 *
 * A mailto link, not a form. The previous site's contact form showed "Thank
 * you for your submission! We will be in touch" after writing the message to
 * the browser console and sending it nowhere; a link that opens the visitor's
 * own mail client at least does what it says.
 *
 * The address comes from siteConfig, which reads site.json — changing it there
 * changes it in the footer and here at once, and it is written out nowhere
 * else. Stage 8 builds the full contact page.
 */
export default function ContactCta({ tone }) {
  const { heading, body, cta } = home.contact

  return (
    <HomeSection id={CONTACT_SECTION_ID} heading={heading} tone={tone}>
      <p className={styles.body}>{body}</p>
      <p className={styles.action}>
        <a
          className={styles.button}
          href={mailtoHref('TSR enquiry')}
          onClick={() => trackEvent(EVENTS.contact, { contact_type: 'email' })}
        >
          {cta}
        </a>
      </p>
      <p className={styles.address}>
        <a
          href={mailtoHref()}
          onClick={() => trackEvent(EVENTS.contact, { contact_type: 'email' })}
        >
          {siteConfig.email}
        </a>
      </p>
      {/*
       * Appeared on its own when Stage 8 built the page: the gate is asked, so
       * this needed no change on the day the route arrived.
       */}
      {isRouteImplemented(CONTACT_PATH) && (
        <p className={styles.more}>
          <Link to={CONTACT_PATH}>Other ways to reach us</Link>
        </p>
      )}
    </HomeSection>
  )
}
