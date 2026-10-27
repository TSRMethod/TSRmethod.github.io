import { Link } from 'react-router-dom'
import { siteConfig } from '../../app/siteConfig'
import { home } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import HeroGeometry from './HeroGeometry'
import styles from './Hero.module.css'

/*
 * The page's only <h1>, and the group's public name.
 *
 * The name comes from site.json through siteConfig — the same source the
 * header, the footer and the browser tab use — so renaming the group is one
 * edit and cannot leave the home page saying something different.
 *
 * Two calls to action, for the two reasons people arrive: to understand the
 * method, or to use the software. The second is shown only while its page
 * resolves, like every other internal link on the site.
 *
 * The figure behind all of this is decorative and is described where it is
 * drawn. It is rendered first and sits underneath: the words are the hero,
 * and nothing about them — their wording, their source in the CMS, or the
 * fact that this is the page's only <h1> — changes because there is now a
 * picture behind them.
 */
const GET_STARTED_PATH = '/software/get-started'

export default function Hero() {
  const { lede, primaryCta, secondaryCta } = home.hero

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      <HeroGeometry />

      <div className={styles.inner}>
        <h1 id="hero-heading" className={styles.heading}>
          {siteConfig.name}
        </h1>
        <p className={styles.lede}>{lede}</p>

        <div className={styles.actions}>
          <Link to="/tsr" className={styles.primary}>
            {primaryCta}
          </Link>
          {isRouteImplemented(GET_STARTED_PATH) && (
            <Link to={GET_STARTED_PATH} className={styles.secondary}>
              {secondaryCta}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
