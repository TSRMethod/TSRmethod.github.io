import { Link } from 'react-router-dom'
import { home, facultyPeople } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import { GROUP_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import Reveal from '../shared/Reveal'
import OptimizedImage from '../shared/OptimizedImage'
import styles from './GroupPreview.module.css'

const PEOPLE_PATH = '/people'

/*
 * A short introduction to the group, showing the faculty who lead it.
 *
 * Who counts as faculty is read from each person's `group` field, never from a
 * list of names here — so nobody can be presented as faculty on the home page
 * while their own record says they are a doctoral or undergraduate researcher.
 * Roles are printed exactly as the record states them.
 *
 * The full directory, with everyone in it, is /people; this is a preview and
 * says so by linking there.
 */
export default function GroupPreview({ tone }) {
  const { heading, intro, cta } = home.group

  return (
    <HomeSection
      id={GROUP_SECTION_ID}
      heading={heading}
      intro={intro}
      tone={tone}
      action={
        isRouteImplemented(PEOPLE_PATH) ? (
          <Link to={PEOPLE_PATH}>{cta}</Link>
        ) : null
      }
    >
      {facultyPeople.length > 0 && (
        <ul className={styles.list}>
          {facultyPeople.map((person, index) => (
            <Reveal
              as="li"
              key={person.id}
              index={index}
              className={styles.person}
            >
              {person.photo && (
                <OptimizedImage
                  className={styles.photo}
                  src={person.photo}
                  alt={`Portrait of ${person.name}`}
                  sizes="4.5rem"
                />
              )}
              <div className={styles.naming}>
                <h3 className={styles.name}>{person.name}</h3>
                <p className={styles.role}>{person.role}</p>
                {person.affiliation && (
                  <p className={styles.affiliation}>{person.affiliation}</p>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      )}
    </HomeSection>
  )
}
