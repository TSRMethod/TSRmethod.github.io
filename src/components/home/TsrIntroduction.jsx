import { Link } from 'react-router-dom'
import { home } from '../../content'
import HomeSection from './HomeSection'
import TsrOverview from '../figures/TsrOverview'
import styles from './TsrIntroduction.module.css'

/*
 * A short explanation of what TSR does, and the diagram that makes it concrete.
 *
 * Deliberately a summary. The full derivation and the six-step figure live on
 * /tsr. The diagram here is the same component in its compact form, drawn
 * from the same BioTSR calculation, so the home page and the method page
 * cannot give two different accounts of how a key is made. (The infographic
 * this replaced drew the longest edge as the base and put θ at a vertex; the
 * image file is kept in public/images/uploads, unreferenced.)
 */
export default function TsrIntroduction({ tone }) {
  const { heading, body, cta } = home.introduction

  return (
    <HomeSection id="introduction" heading={heading} tone={tone}>
      <p className={styles.body}>{body}</p>

      <TsrOverview variant="compact" />

      <p className={styles.action}>
        <Link to="/tsr">{cta}</Link>
      </p>
    </HomeSection>
  )
}
