import { Link } from 'react-router-dom'
import { home, pages, publishedMethods } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import { RESEARCH_SECTION_ID } from './sectionIds'
import HomeSection from './HomeSection'
import Reveal from '../shared/Reveal'
import styles from './ResearchPreview.module.css'

/*
 * Methods & research, in three cards: the scientific methods, the analysis
 * pages, and the earlier code. Each card links into the Methods & research
 * page, which lists every page; the home page no longer repeats that list.
 *
 * The card titles are that page's own section headings (pages.json), so the
 * card and the section it opens onto are called the same thing. The counts
 * are read from the content registry, through the same gates as everything
 * else, so publishing a method changes them by itself. A card whose
 * destination does not resolve is not shown.
 */
const RESEARCH_PATH = '/research'
const EARLIER_PATH = '/research/earlier-implementations'

const isListed = (category) => (method) =>
  method.category === category && isRouteImplemented(method.path)

export default function ResearchPreview({ tone }) {
  const copy = home.research
  const labels = pages.research

  if (!isRouteImplemented(RESEARCH_PATH)) return null

  const cards = [
    {
      id: 'methods',
      title: labels.methodsHeading,
      text: copy.methodsCard,
      to: `${RESEARCH_PATH}#methods`,
      count: publishedMethods.filter(isListed('method')).length,
    },
    {
      id: 'analysis',
      title: labels.analysisHeading,
      text: copy.analysisCard,
      to: `${RESEARCH_PATH}#analysis`,
      count: publishedMethods.filter(isListed('analysis')).length,
    },
    {
      id: 'earlier',
      title: labels.earlierHeading,
      text: copy.earlierCard,
      to: EARLIER_PATH,
    },
  ].filter((card) => card.count !== 0 && isRouteImplemented(card.to.split('#')[0]))

  return (
    <HomeSection
      id={RESEARCH_SECTION_ID}
      heading={copy.heading}
      intro={copy.intro}
      tone={tone}
      action={<Link to={RESEARCH_PATH}>{copy.cta}</Link>}
    >
      <ul className={styles.list}>
        {cards.map((card, index) => (
          <Reveal as="li" key={card.id} index={index} className={styles.card}>
            <h3 className={styles.title}>
              <Link to={card.to}>{card.title}</Link>
            </h3>
            {card.count !== undefined && (
              <p className={styles.count}>
                {card.count} {card.count === 1 ? 'page' : 'pages'}
              </p>
            )}
            <p className={styles.text}>{card.text}</p>
          </Reveal>
        ))}
      </ul>
    </HomeSection>
  )
}
