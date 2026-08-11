import styles from './SkipLink.module.css'

/*
 * Lets keyboard and screen reader users jump straight past the header to the
 * page content. Hidden until focused.
 */
export default function SkipLink() {
  return (
    <a href="#main" className={styles.skipLink}>
      Skip to main content
    </a>
  )
}
