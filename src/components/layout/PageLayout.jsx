import SkipLink from './SkipLink'
import Header from './Header'
import Footer from './Footer'
import styles from './PageLayout.module.css'

/*
 * The frame every page renders inside: skip link, header, main, footer.
 *
 * `main` carries id="main" (the skip link target) and tabIndex={-1} so
 * ScrollToTop can move focus here after a route change without turning it
 * into a tab stop.
 */
export default function PageLayout({ children }) {
  return (
    <div className={styles.shell}>
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
