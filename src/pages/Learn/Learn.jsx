import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages, softwarePages, softwareRelease } from '../../content'
import { LEARNING_PAGES, NOTEBOOK, VIDEO } from '../../content/learnResources'
import LearnVideo from '../../components/learn/LearnVideo'
import ExternalLink from '../../components/software/ExternalLink'
import layout from '../../components/method/MethodPage.module.css'
import styles from './Learn.module.css'

/*
 * Learn BioTSR: Watch → Explore → Run.
 *
 * The three resources follow one example (ubiquitin's Val 70 · Ile 44 · Leu 8
 * triangle and the three others that share its key), but each is complete on
 * its own, so a visitor can start with any of them. The page only introduces
 * them; the explanations stay where they already are, on Understand TSR and
 * Getting started.
 *
 *   - Watch: the video, with captions, chapters and a transcript. Absent
 *     until VIDEO is set in learnResources.js.
 *   - Explore: a card linking to the interactive lesson.
 *   - Run: a card with the notebook download, its recorded run, and the
 *     commands that open it.
 *
 * Words come from pages.json ("learn"); addresses and file facts from
 * learnResources.js.
 */

const COPY = pages.learn

/* Commands, not prose: the same environment Getting started sets up. */
const OPEN_NOTEBOOK = `python3 -m venv biotsr-env
source biotsr-env/bin/activate
python -m pip install jupyterlab
jupyter lab ${NOTEBOOK.downloadName}`

const sizeFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export default function Learn() {
  usePageMetadata({ title: COPY.title, description: COPY.summary })

  const step = (n) => (VIDEO ? n : n - 1)

  return (
    <article className={layout.page}>
      <header className={layout.header}>
        <p className={styles.eyebrow}>{COPY.eyebrow}</p>
        <h1 className={layout.title}>{COPY.title}</h1>
        <p className={styles.intro}>{COPY.intro}</p>
      </header>

      {VIDEO && <LearnVideo video={VIDEO} number={1} />}

      <div className={styles.cards}>
        <section className={styles.card} aria-labelledby="explore">
          <p className={styles.step}>{step(2)}</p>
          <h2 id="explore" className={styles.cardHeading}>
            {COPY.exploreHeading}
          </h2>
          <p className={styles.meta}>{COPY.exploreMeta}</p>
          <p>{COPY.exploreBody}</p>
          <p className={styles.actions}>
            <Link to={LEARNING_PAGES.lesson.path} className={styles.primary}>
              {COPY.exploreAction}
            </Link>
          </p>
          <p className={styles.small}>
            {COPY.exploreFallback}{' '}
            <Link to="/tsr#worked-example">{COPY.exploreFallbackLink}</Link>.
          </p>
        </section>

        <section className={styles.card} aria-labelledby="run">
          <p className={styles.step}>{step(3)}</p>
          <h2 id="run" className={styles.cardHeading}>
            {COPY.runHeading}
          </h2>
          <p className={styles.meta}>{COPY.runMeta}</p>
          <p>{COPY.runBody}</p>
          <p className={styles.small}>{COPY.runNeeds}</p>
          <p className={styles.actions}>
            <a href={NOTEBOOK.href} download={NOTEBOOK.downloadName} className={styles.primary}>
              {COPY.runDownloadAction}
              <span className={styles.size}>
                {' '}
                ({sizeFormat.format(NOTEBOOK.bytes / 1000)} kB)
              </span>
            </a>
            <Link to={LEARNING_PAGES.notebookPreview.path} className={styles.secondary}>
              {COPY.runPreviewAction}
            </Link>
          </p>
          <p className={styles.small}>{COPY.runPreviewNote}</p>
          <details className={styles.how}>
            <summary>{COPY.runHowHeading}</summary>
            <pre className={styles.commands}>
              <code>{OPEN_NOTEBOOK}</code>
            </pre>
          </details>
        </section>
      </div>

      <section className={styles.next} aria-labelledby="next">
        <h2 id="next" className={styles.nextHeading}>
          {COPY.nextHeading}
        </h2>
        <ul>
          <li>
            <Link to="/software/get-started">{softwarePages['get-started'].title}</Link>
            {': '}
            {COPY.nextGetStarted}
          </li>
          {softwareRelease && (
            <li>
              <ExternalLink
                label="The BioTSR user guide"
                href={softwareRelease.docUrl('docs/USER_GUIDE.md')}
                context={`for ${softwareRelease.name} ${softwareRelease.version}`}
              />
              {': '}
              {COPY.nextGuide}
            </li>
          )}
          <li>
            <Link to="/tsr">Understand TSR</Link>
            {': '}
            {COPY.nextMethod}
          </li>
        </ul>
      </section>
    </article>
  )
}
