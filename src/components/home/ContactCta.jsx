import { home } from '../../content'
import { siteConfig, mailtoHref } from '../../app/siteConfig'
import { CONTACT_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import styles from './ContactCta.module.css'

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
        <a className={styles.button} href={mailtoHref('TSR enquiry')}>
          {cta}
        </a>
      </p>
      <p className={styles.address}>
        <a href={mailtoHref()}>{siteConfig.email}</a>
      </p>
    </HomeSection>
  )
}
