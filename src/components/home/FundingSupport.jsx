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
 * The award-by-award detail and the acknowledgement of the LONI team belong
 * behind the disclosure: they matter to the people named in them and to
 * anyone checking a grant number, and they would unbalance a home page if
 * they were always open.
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
    detailsLabel,
    awards,
    acknowledgmentsHeading,
    acknowledgments,
  } = home.funding

  const funders = groupByFunder(awards)
  const thanks = acknowledgments ?? []

  return (
    <HomeSection id={FUNDING_SECTION_ID} heading={heading} tone={tone}>
      <p className={styles.primary}>{primarySupport}</p>
      <p className={styles.computing}>{computingSupport}</p>

      <ExpandableDetails label={detailsLabel}>
        {funders.length > 0 && (
          <div className={styles.awards}>
            {funders.map(({ funder, records }) => (
              <div key={funder} className={styles.funder}>
                {/*
                 * A heading, not bold text: the award list under it is a
                 * list of that funder's awards, and a screen reader user
                 * should be able to move between funders directly.
                 */}
                <h3 className={styles.funderName}>{funder}</h3>
                <ul className={styles.awardList}>
                  {records.map((award) => (
                    <li key={award.grant} className={styles.award}>
                      <span className={styles.investigators}>
                        {award.investigators}
                      </span>
                      <span className={styles.grant}>{award.grant}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {thanks.length > 0 && (
          <div className={styles.acknowledgments}>
            <h3 className={styles.acknowledgmentsHeading}>
              {acknowledgmentsHeading}
            </h3>
            {thanks.map((paragraph) => (
              <p key={paragraph.slice(0, 60)}>{paragraph}</p>
            ))}
          </div>
        )}
      </ExpandableDetails>
    </HomeSection>
  )
}

/*
 * Awards gathered under the organisation that made them, in the order the
 * funders first appear in the content.
 *
 * The grouping is presentation, so it is done here rather than being asked of
 * the editor: two NIH awards typed one after the other appear under one NIH
 * heading without anyone creating that heading, and adding a third award to
 * an existing funder is one CMS row with no formatting to match.
 */
function groupByFunder(awards = []) {
  const groups = new Map()

  for (const award of awards) {
    const existing = groups.get(award.funder)
    if (existing) existing.push(award)
    else groups.set(award.funder, [award])
  }

  return Array.from(groups, ([funder, records]) => ({ funder, records }))
}
