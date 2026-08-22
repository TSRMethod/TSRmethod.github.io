import { EmailIcon, ScholarIcon, LinkedInIcon } from '../shared/icons'
import { EVENTS, trackEvent } from '../../lib/analytics'
import styles from './ProfileLinks.module.css'

/*
 * The compact row of profile links under a person's name.
 *
 * ICONS, NOT LABELS, and the reason is arithmetic: thirteen cards printing
 * "Email", "Google Scholar" and "LinkedIn" is thirty-nine lines of repeated
 * text on one page, which is exactly the density this redesign set out to
 * remove. The meaning is carried by the accessible name instead, which names
 * both the action and the person — "Email Wu Xu", not "Email" thirteen times.
 *
 * Nothing here depends on hover. A pointer user sees a recognisable glyph, a
 * screen reader user hears a full sentence, and a keyboard user gets the same
 * focus ring as every other link on the site. Hover only changes colour.
 *
 * A link is rendered ONLY when its value exists. An absent Scholar profile is
 * an absent icon — never a greyed-out one, and never a link to nowhere.
 */

const EXTERNAL = { target: '_blank', rel: 'noopener noreferrer' }

/** What each service needs: its icon, its accessible name, its href. */
function profilesFor(person) {
  const profiles = []

  if (person.email) {
    profiles.push({
      type: 'email',
      Icon: EmailIcon,
      href: `mailto:${person.email}`,
      label: `Email ${person.name}`,
      external: false,
    })
  }

  if (person.scholar) {
    profiles.push({
      type: 'scholar',
      Icon: ScholarIcon,
      href: person.scholar,
      label: `Google Scholar profile of ${person.name} (opens in a new tab)`,
      external: true,
    })
  }

  if (person.linkedin) {
    profiles.push({
      type: 'linkedin',
      Icon: LinkedInIcon,
      href: person.linkedin,
      label: `LinkedIn profile of ${person.name} (opens in a new tab)`,
      external: true,
    })
  }

  return profiles
}

export default function ProfileLinks({ person }) {
  const profiles = profilesFor(person)

  if (profiles.length === 0) return null

  return (
    <ul className={styles.links}>
      {profiles.map(({ type, Icon, href, label, external }) => (
        <li key={type}>
          <a
            className={styles.link}
            href={href}
            aria-label={label}
            {...(external ? EXTERNAL : null)}
            onClick={() =>
              /*
               * The person's stable content id, never their address: an email
               * address in an analytics parameter would publish it to a third
               * party, which is the opposite of what the icon is for.
               */
              trackEvent(EVENTS.profileLink, {
                person_id: person.id,
                profile_type: type,
              })
            }
          >
            <Icon />
          </a>
        </li>
      ))}
    </ul>
  )
}
