import { home } from '../../content'
import { FUNDING_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import ExpandableDetails from './ExpandableDetails'
import styles from './FundingSupport.module.css'

/*
 * Who pays for the work, and who provides the machines to run it on.
 *
 * Two statements, deliberately not one. NIH/NIGMS funds the research; LONI
 * provides high-performance computing. Merging them into a single "supported
 * by" sentence would read as though LONI were a funding agency, which it is
 * not — hence the separate, quieter treatment for the computing line.
 *
 * The full acknowledgement of the LONI team belongs behind the disclosure: it
 * is a list of names that matters to the people in it and to anyone checking,
 * and it would unbalance a home page if it were always open.
 *
 * Grant numbers are plain text. They are identifiers to quote in a report, not
 * links and not controls, and styling them as either would invite a click that
 * goes nowhere.
 */
export default function FundingSupport({ tone }) {
  const {
    heading,
    primarySupport,
    computingSupport,
    acknowledgmentsLabel,
    acknowledgments,
  } = home.funding

  return (
    <HomeSection id={FUNDING_SECTION_ID} heading={heading} tone={tone}>
      <p className={styles.primary}>{primarySupport}</p>
      <p className={styles.computing}>{computingSupport}</p>

      <ExpandableDetails
        label={acknowledgmentsLabel}
        paragraphs={acknowledgments}
      />
    </HomeSection>
  )
}
