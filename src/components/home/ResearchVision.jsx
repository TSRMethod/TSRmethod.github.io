import { home } from '../../content'
import { RESEARCH_VISION_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import ExpandableDetails from './ExpandableDetails'
import styles from './ResearchVision.module.css'

/*
 * Why the group does this, placed before the explanation of how it works.
 *
 * A reader who has just met the site needs the motivation before the
 * mechanism, which is why this sits between the hero and "How TSR represents
 * a structure" — and why it says nothing about Cα atoms or integer keys. That
 * is the next section's job, and repeating it here would give the page two
 * explanations of the same thing.
 *
 * THE QUESTION IS A QUESTION. It is set as the most prominent text in the
 * section because it is the point of the research, not because it has been
 * answered. Every word of it comes from home.json, so nothing here can drift
 * into claiming that a general recognition code has been found — and a test
 * asserts this file contains no scientific prose of its own.
 */
export default function ResearchVision({ tone }) {
  const { heading, question, intro, direction, detailsLabel, details } =
    home.researchVision

  return (
    <HomeSection
      id={RESEARCH_VISION_SECTION_ID}
      heading={heading}
      tone={tone}
    >
      {/*
       * A <p>, not a <blockquote> and not an image: it is the group's own open
       * question rather than a quotation from anyone, and it has to stay
       * selectable, translatable and readable by a screen reader.
       */}
      <p className={styles.question}>{question}</p>

      <div className={styles.body}>
        <p>{intro}</p>
        <p>{direction}</p>
      </div>

      <ExpandableDetails label={detailsLabel} paragraphs={details} />
    </HomeSection>
  )
}
