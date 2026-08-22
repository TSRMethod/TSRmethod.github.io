import Reveal from '../shared/Reveal'
import styles from './HomeSection.module.css'

/*
 * One band of the home page: a heading, an optional standfirst, the content,
 * and an optional link out to the full page.
 *
 * Every section on the home page has this shape, so it is written once. The
 * heading is always an <h2> and is always the section's accessible name, which
 * is what keeps the page's outline correct no matter what order the sections
 * are composed in.
 *
 * `tone="muted"` gives the section a tinted background. It alternates by hand
 * in Home.jsx rather than by :nth-child, because which sections should stand
 * apart is a design decision, not an arithmetic one.
 *
 * The band fades in as it is scrolled to, once. Reveal renders the <section>
 * itself rather than wrapping it, so the page's outline — a section per band,
 * each named by its own heading — is exactly what it was before.
 */
export default function HomeSection({
  id,
  heading,
  intro,
  tone = 'plain',
  action = null,
  children,
}) {
  return (
    <Reveal
      as="section"
      id={id}
      className={styles.section}
      data-tone={tone}
      aria-labelledby={`${id}-heading`}
    >
      <div className={styles.inner}>
        <div className={styles.header}>
          <h2 id={`${id}-heading`} className={styles.heading}>
            {heading}
          </h2>
          {intro && <p className={styles.intro}>{intro}</p>}
        </div>

        {children}

        {action && <p className={styles.action}>{action}</p>}
      </div>
    </Reveal>
  )
}
