import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { softwarePages, softwareRelease } from '../../content'
import MarkdownContent from '../../components/method/MarkdownContent'
import SectionNavigation from '../../components/method/SectionNavigation'
/*
 * The method pages' stylesheet, on purpose. This page is read the same way —
 * a header, then a table of contents beside long-form prose with commands in
 * it — so it shares their layout rather than inventing a second one.
 */
import styles from '../../components/method/MethodPage.module.css'

/*
 * Getting started with BioTSR.
 *
 * The page is its Markdown file (src/content/software/get-started.md): four
 * short steps and then "Next steps", each pointing at the version-pinned
 * tutorial or guide section that owns the detail. This component adds only
 * the frame: the title, a line saying which release the commands are pinned
 * to, and the section navigation, which lists every `##` and `###` heading.
 */
const PAGE = softwarePages['get-started']

export default function GetStarted() {
  usePageMetadata({ title: PAGE.title, description: PAGE.summary })

  const sections = PAGE.headings.map(({ id, text, depth }) => ({ id, text, depth }))

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{PAGE.title}</h1>
        <p className={styles.summary}>{PAGE.summary}</p>
        {softwareRelease && (
          <p className={styles.paper}>
            <Link to="/software">
              {softwareRelease.name} {softwareRelease.version}
            </Link>
            <span className={styles.paperMeta}>
              {softwareRelease.licence} · Python {softwareRelease.pythonVersions} ·{' '}
              {softwareRelease.platforms}
            </span>
          </p>
        )}
      </header>

      <div className={styles.body}>
        <SectionNavigation sections={sections} />

        <div className={styles.content}>
          <MarkdownContent>{PAGE.body}</MarkdownContent>
        </div>
      </div>
    </article>
  )
}
