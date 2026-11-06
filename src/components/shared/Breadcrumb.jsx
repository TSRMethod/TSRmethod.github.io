import { Link } from 'react-router-dom'
import styles from './Breadcrumb.module.css'

/*
 * Where a page sits, for pages one level below a menu entry (the Learn
 * BioTSR lesson and notebook): BioTSR › Learn BioTSR › this page.
 *
 *   <Breadcrumb trail={[{ to: '/software', label: 'BioTSR' }, …]} current="…" />
 *
 * The last item is the page itself, marked aria-current="page", and is not a
 * link. The menu marks the entry the page belongs under; this names the page.
 */
export default function Breadcrumb({ trail, current }) {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      <ol>
        {trail.map((step) => (
          <li key={step.to}>
            <Link to={step.to}>{step.label}</Link>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  )
}
