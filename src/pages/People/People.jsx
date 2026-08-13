import useDocumentTitle from '../../hooks/useDocumentTitle'
import { pages, currentPeople, formerPeople } from '../../content'
import styles from './People.module.css'

/*
 * The group directory.
 *
 * Every optional field is conditional. The previous site printed "Phone:" and
 * "Email:" for nine people who had neither, and wrapped the empty address in a
 * `mailto:` link that went nowhere; the content loader now rejects an empty
 * value outright, and anything absent simply does not render here.
 *
 * Phone numbers are not shown at all. They are not part of the person schema,
 * and a group directory is not the place to publish direct personal lines —
 * the site has one shared contact address for that.
 */

function Person({ person }) {
  return (
    <li className={styles.person}>
      {/*
       * Photo and name form one row; the biography runs the full width of the
       * card beneath them. Two flat blocks rather than a nested grid, so the
       * card behaves the same whether or not the person has a photo.
       */}
      <div className={styles.identity}>
        {person.photo && (
          <img
            className={styles.photo}
            src={person.photo}
            alt={`Portrait of ${person.name}`}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className={styles.naming}>
          <h3 className={styles.name}>{person.name}</h3>
          <p className={styles.role}>{person.role}</p>
          {person.affiliation && (
            <p className={styles.affiliation}>{person.affiliation}</p>
          )}
        </div>
      </div>

      {person.bio && <p className={styles.bio}>{person.bio}</p>}

      {person.email && (
        <p className={styles.contact}>
          <a href={`mailto:${person.email}`}>
            {/*
             * The address is the link text, so the accessible name says who
             * the mail goes to rather than repeating "Email" thirteen times.
             */}
            {person.email}
            <span className="visually-hidden">{` — email ${person.name}`}</span>
          </a>
        </p>
      )}
    </li>
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
        {people.map((person) => (
          <Person key={person.id} person={person} />
        ))}
      </ul>
    </section>
  )
}

export default function People() {
  const { title, intro, currentHeading, formerHeading } = pages.people

  useDocumentTitle(title)

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
