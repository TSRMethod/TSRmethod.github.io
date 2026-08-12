import useDocumentTitle from '../../hooks/useDocumentTitle'
import { siteConfig } from '../../app/siteConfig'
import styles from './Home.module.css'

/*
 * Provisional home page.
 *
 * Stage 1 establishes the foundation only. The real home page — research
 * overview, method links, publication highlights, collaboration CTA — is
 * built in Stage 7d once the content layer and shared layout exist.
 */
export default function Home() {
  useDocumentTitle()

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>{siteConfig.name}</h1>
      <p className={styles.lede}>{siteConfig.description}</p>
      <p className={styles.note}>
        This site is being rebuilt. Method documentation, publications and
        group information are being migrated section by section.
      </p>
    </div>
  )
}
