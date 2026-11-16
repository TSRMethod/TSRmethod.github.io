import { home } from '../../content'
import { RESEARCH_VISION_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import styles from './ResearchVision.module.css'

/*
 * Why the group does this, straight after BioTSR.
 *
 * The software comes first because it is what most visitors arrive for; the
 * group's purpose follows at once, so the page never reads as a software
 * landing page. It is only the question and one paragraph, and the paragraph
 * keeps what TSR keys can already show apart from the long-term goal. How TSR
 * works is the next section, and repeating it here would give the page two
 * explanations of the same thing.
 *
 * THE QUESTION IS A QUESTION. It is set as the most prominent text in the
 * section because it is the point of the research, not because it has been
 * answered. Every word of it comes from home.json, so nothing here can drift
 * into claiming that a general recognition code has been found — and a test
 * asserts this file contains no scientific prose of its own.
 */
export default function ResearchVision({ tone }) {
  const { heading, question, body } = home.researchVision

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

      <p className={styles.body}>{body}</p>
    </HomeSection>
  )
}
