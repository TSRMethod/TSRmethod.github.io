import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import styles from './NotFound.module.css'

export default function NotFound() {
  usePageMetadata({ title: 'Page not found' })

  return (
    <div className={styles.wrapper}>
      <p className={styles.code}>404</p>
      <h1 className={styles.heading}>Page not found</h1>
      <p className={styles.body}>
        We couldn&rsquo;t find that page. It may have been moved or renamed
        since you last visited.
      </p>
      <Link to="/" className={styles.action}>
        Go to the home page
      </Link>
    </div>
  )
}
