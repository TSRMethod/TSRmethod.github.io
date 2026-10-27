import { Link } from 'react-router-dom'
import usePageMetadata from '../../hooks/usePageMetadata'
import { pages, softwarePages, softwareRelease } from '../../content'
import { isRouteImplemented } from '../../app/routeRegistry'
import MarkdownContent from '../../components/method/MarkdownContent'
import SectionNavigation from '../../components/method/SectionNavigation'
import CopyButton from '../../components/shared/CopyButton'
import ExternalLink from '../../components/software/ExternalLink'
import trackRepositoryLink from '../../components/software/trackRepositoryLink'
import layout from '../../components/method/MethodPage.module.css'
import styles from './Software.module.css'

/*
 * The BioTSR page: what the package is, how to install it, what it computes,
 * where its documentation is, how to get help and how to cite it.
 *
 * Two sources, and neither of them is this file:
 *
 *   - the release record (src/content/repositories/biotsr.json, read through
 *     `softwareRelease`) — version, dates, licence, citation, and every
 *     version-specific link, derived in one place;
 *   - the page's prose (src/content/software/biotsr.md) and its labels in
 *     pages.json — installation, the method families, the command-line /
 *     Python split and the documentation list, as text an editor can change.
 *
 * The layout is the method pages': a sticky "On this page" sidebar on
 * desktop, a collapsed list on a phone. Installation, documentation and
 * citation are sections listed there, not entries in the site menu, so the
 * menu marks one page as current and the sidebar marks one section.
 *
 * The earlier implementations and research tools used to be listed here.
 * They now have their own page under Methods & research, and the last
 * section of this one links there — under the ids old links used, so
 * /software#research-code still lands on the way to them.
 */

const BODY = softwarePages.biotsr

const EARLIER_PATH = '/research/earlier-implementations'

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/*
 * The two technical figures, collapsed by default.
 *
 * They are reference material, dense by nature: a capability table and an
 * architecture diagram. The page's own text already says what they show, so
 * they sit behind a labelled disclosure with a full-size link, and their alt
 * text summarises them rather than transcribing every cell.
 */
/* Files are named after the release they describe, so a new release adds
   new figures rather than silently changing what an old link shows. */
const FIGURES = [
  { id: 'capability-matrix', copy: 'matrix' },
  { id: 'architecture', copy: 'architecture' },
]

const figureSrc = (figure, release) =>
  `/images/figures/biotsr-${release.version}-${figure.id}.svg`

function TechnicalFigure({ figure, copy, release }) {
  const title = copy[`${figure.copy}Title`]
  const src = figureSrc(figure, release)
  return (
    <details className={styles.figureDetails}>
      <summary className={styles.figureSummary}>{title}</summary>
      <figure className={styles.figure}>
        <img
          src={src}
          alt={copy[`${figure.copy}Alt`]}
          loading="lazy"
          decoding="async"
        />
        <figcaption>
          {copy[`${figure.copy}Caption`]}{' '}
          <a href={src} target="_blank" rel="noopener noreferrer">
            Open the full-size figure (SVG)
            <span className="visually-hidden">{`: ${title} (opens in a new tab)`}</span>
          </a>
        </figcaption>
      </figure>
    </details>
  )
}

/* Anchors the old listing had, which should still land somewhere useful. */
const MOVED_ANCHORS = ['software-core', 'software-analysis', 'software-historical']

export default function Software() {
  const copy = pages.software
  const release = softwareRelease

  usePageMetadata({ title: copy.title, description: BODY.summary })

  /* One continuous table of contents: Markdown sections, then the rest. */
  const sections = [
    ...BODY.headings.filter((heading) => heading.depth === 2),
    { id: 'help', text: copy.helpHeading },
    ...(release
      ? [
          { id: 'cite', text: copy.citeHeading },
          { id: 'figures', text: copy.figuresHeading },
        ]
      : []),
    { id: 'research-code', text: copy.researchCodeHeading },
  ].map(({ id, text }) => ({ id, text, depth: 2 }))

  return (
    <article className={layout.page}>
      <header className={layout.header}>
        <p className={styles.eyebrow}>{copy.eyebrow}</p>
        <h1 className={layout.title}>{copy.title}</h1>
        <p className={styles.intro}>{copy.intro}</p>

        {release && (
          <>
            <dl className={styles.facts}>
              <div>
                <dt>Version</dt>
                <dd>{release.version}</dd>
              </div>
              <div>
                <dt>Released</dt>
                <dd>
                  <time dateTime={release.date}>
                    {dateFormat.format(new Date(`${release.date}T00:00:00Z`))}
                  </time>
                </dd>
              </div>
              <div>
                <dt>Licence</dt>
                <dd>{release.licence}</dd>
              </div>
              <div>
                <dt>Python</dt>
                <dd>{release.pythonVersions}</dd>
              </div>
              <div>
                <dt>Platforms</dt>
                <dd>{release.platforms}</dd>
              </div>
            </dl>

            <div className={styles.actions}>
              <Link to="/software/get-started" className={styles.primary}>
                {copy.getStartedAction}
              </Link>
              <ExternalLink
                label="Documentation"
                href={release.docUrl('docs/README.md')}
                className={styles.secondary}
                context={`for ${release.name} ${release.version}`}
                onClick={() => trackRepositoryLink(release.id, 'documentation')}
              />
            </div>

            <ul className={styles.links}>
              <li>
                <ExternalLink
                  label="GitHub repository"
                  href={release.repositoryUrl}
                  context={`for ${release.name}`}
                  onClick={() => trackRepositoryLink(release.id, 'repository')}
                />
              </li>
              <li>
                <ExternalLink
                  label={`Release ${release.version}`}
                  href={release.releaseUrl}
                  context={`of ${release.name}, on GitHub`}
                  onClick={() => trackRepositoryLink(release.id, 'release')}
                />
              </li>
              <li>
                <ExternalLink
                  label="PyPI"
                  href={release.pypiUrl}
                  context={`page for ${release.name} ${release.version}`}
                  onClick={() => trackRepositoryLink(release.id, 'pypi')}
                />
              </li>
            </ul>
          </>
        )}
      </header>

      <div className={layout.body}>
        <SectionNavigation sections={sections} />

        <div className={layout.content}>
          <MarkdownContent>{BODY.body}</MarkdownContent>

          <section className={styles.section} aria-labelledby="help">
            <h2 id="help" className={styles.sectionHeading}>
              {copy.helpHeading}
            </h2>
            <p>{copy.helpBody}</p>
            <ul className={styles.helpLinks}>
              {release?.issuesUrl && (
                <li>
                  <ExternalLink
                    label="Report a problem"
                    href={release.issuesUrl}
                    context={`with ${release.name} on GitHub`}
                    onClick={() => trackRepositoryLink(release.id, 'issues')}
                  />
                </li>
              )}
              <li>
                <Link to="/contact">{copy.contactAction}</Link>
              </li>
            </ul>
          </section>

          {release && (
            <section className={styles.section} aria-labelledby="cite">
              <h2 id="cite" className={styles.sectionHeading}>
                {copy.citeHeading}
              </h2>
              <p className={styles.citeLead}>{copy.citeIntro}</p>
              <blockquote className={styles.citation}>
                <p>
                  {release.citationLead}
                  <cite>{release.citationTitle}</cite>
                  {release.citationTail}
                </p>
              </blockquote>
              <CopyButton
                value={release.citation}
                label="Copy the citation"
                copiedLabel="Citation copied"
                failedLabel="Copying failed. Select the citation and copy it."
              />
              <p className={styles.citeNote}>{copy.citeNote}</p>
              <p className={styles.citeNote}>
                {copy.licenceNote}{' '}
                <ExternalLink
                  label="Licence"
                  href={release.docUrl('LICENSE')}
                  context={`of ${release.name}`}
                />
                {' · '}
                <ExternalLink
                  label="Notices"
                  href={release.docUrl('NOTICE')}
                  context={`of ${release.name}`}
                />
              </p>
            </section>
          )}

          {release && (
            <section className={styles.section} aria-labelledby="figures">
              <h2 id="figures" className={styles.sectionHeading}>
                {copy.figuresHeading}
              </h2>
              <p>{copy.figuresIntro}</p>
              {FIGURES.map((figure) => (
                <TechnicalFigure
                  key={figure.id}
                  figure={figure}
                  copy={copy}
                  release={release}
                />
              ))}
            </section>
          )}

          <section className={styles.section} aria-labelledby="research-code">
            {/* Empty targets for the anchors the old repository listing had. */}
            {MOVED_ANCHORS.map((id) => (
              <span key={id} id={id} className={styles.anchor} />
            ))}
            <h2 id="research-code" className={styles.sectionHeading}>
              {copy.researchCodeHeading}
            </h2>
            <p>{copy.researchCodeIntro}</p>
            {isRouteImplemented(EARLIER_PATH) && (
              <p>
                <Link to={EARLIER_PATH}>{copy.researchCodeAction}</Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </article>
  )
}
