import usePageMetadata from '../../hooks/usePageMetadata'
import { pages, currentPeople, formerPeople } from '../../content'
import OptimizedImage from '../../components/shared/OptimizedImage'
import ProfileLinks from '../../components/people/ProfileLinks'
import Reveal from '../../components/shared/Reveal'
import styles from './People.module.css'

/*
 * The group directory.
 *
 * A DIRECTORY, not a set of profiles. Each card answers "who is this and how
 * do I reach them" — portrait, name, one role, the links that exist — and
 * stops there. The biographies, affiliations and addresses are all still in
 * the person records and still editable in the CMS; they are simply not what
 * thirteen cards side by side should be made of. A paragraph on every card
 * turned the page into a wall of text that nobody read to the end of.
 *
 * The email address is one of those things. It is now the accessible name of
 * a mail icon rather than a line of text repeated down the page, so the page
 * is shorter, the address is still one click away, and it is no longer
 * sitting in the HTML as plain text for a scraper to lift in bulk.
 *
 * Phone numbers are not shown at all. They are not part of the person schema,
 * and a group directory is not the place to publish direct personal lines —
 * the site has one shared contact address for that.
 */

function Person({ person, index }) {
  return (
    <Reveal as="li" index={index} className={styles.person}>
      {person.photo ? (
        <OptimizedImage
          className={styles.photo}
          src={person.photo}
          alt={`Portrait of ${person.name}`}
          sizes="7.5rem"
        />
      ) : (
        /*
         * A plain tinted circle, not initials and not a stock silhouette: it
         * holds the card's proportions steady when someone has no portrait
         * yet, without inventing a likeness for them. Decorative, so it is
         * hidden from assistive technology — the name is right below it.
         */
        <div className={styles.photoPlaceholder} aria-hidden="true" />
      )}

      <h3 className={styles.name}>{person.name}</h3>
      <p className={styles.role}>{person.role}</p>

      <ProfileLinks person={person} />
    </Reveal>
  )
}

function PeopleSection({ id, heading, people }) {
  if (people.length === 0) return null

  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionHeading}>
        {heading}
      </h2>
      <ul className={styles.list}>
        {people.map((person, index) => (
          <Person key={person.id} person={person} index={index} />
        ))}
      </ul>
    </section>
  )
}

export default function People() {
  const { title, intro, currentHeading, formerHeading } = pages.people

  usePageMetadata({ title, description: intro })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <p className={styles.intro}>{intro}</p>
      </header>

      <PeopleSection
        id="current-members"
        heading={currentHeading}
        people={currentPeople}
      />
      <PeopleSection
        id="former-members"
        heading={formerHeading}
        people={formerPeople}
      />
    </div>
  )
}
