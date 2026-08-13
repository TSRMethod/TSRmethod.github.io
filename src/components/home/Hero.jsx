import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
import { home } from '../../content'
import { METHODS_SECTION_ID } from './sectionIds'
import styles from './Hero.module.css'

/*
 * The page's only <h1>, and the group's public name.
 *
 * The name comes from site.json through siteConfig — the same source the
 * header, the footer and the browser tab use — so renaming the group is one
 * edit and cannot leave the home page saying something different.
 *
 * The secondary call to action is an in-page anchor rather than a link to a
 * methods index, which does not exist. A native <a href="#…"> is used so the
 * browser handles the jump; React Router would push a new history entry
 * without scrolling anywhere.
 */
export default function Hero() {
  const { lede, primaryCta, secondaryCta } = home.hero

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <div className={styles.inner}>
        <h1 id="hero-heading" className={styles.heading}>
          {siteConfig.name}
        </h1>
        <p className={styles.lede}>{lede}</p>

        <div className={styles.actions}>
          <Link to="/tsr" className={styles.primary}>
            {primaryCta}
          </Link>
          <a href={`#${METHODS_SECTION_ID}`} className={styles.secondary}>
            {secondaryCta}
          </a>
        </div>
      </div>
    </section>
  )
}
