import usePageMetadata from '../../hooks/usePageMetadata'
import Hero from '../../components/home/Hero'
import ResearchVision from '../../components/home/ResearchVision'
import TsrIntroduction from '../../components/home/TsrIntroduction'
import ResearchPreview from '../../components/home/ResearchPreview'
import SoftwareOverview from '../../components/home/SoftwareOverview'
import PublicationHighlights from '../../components/home/PublicationHighlights'
import GroupPreview from '../../components/home/GroupPreview'
import FundingSupport from '../../components/home/FundingSupport'
import ContactCta from '../../components/home/ContactCta'

/*
 * The home page: composition only.
 *
 * Two rules hold this together, and both are worth keeping.
 *
 *   1. It states no content. Every sentence comes from src/content/home.json,
 *      and every list and count — pages, papers, faculty, the release — is
 *      read from the content registry. There is no second list of method
 *      URLs, no hard-coded paper title and no repeated email address, so
 *      publishing a method or adding a paper updates this page by itself.
 *
 *   2. It owns no layout details. Each section is a small component beside
 *      this one, and each decides on its own whether it has anything to show:
 *      a section with no records renders nothing rather than an empty heading.
 *
 * The document title is the bare site name, and the description falls back
 * to the site-wide one — which is what usePageMetadata does when called with
 * nothing.
 */
export default function Home() {
  usePageMetadata()

  return (
    <>
      <Hero />

      {/*
       * What to use, then why, then how it works. BioTSR comes straight after
       * the hero, so a researcher who came for the software meets it on the
       * first screen; the research question follows, so the group's purpose
       * — a long-term goal, set apart from what BioTSR does today — is never
       * more than one section away; then what TSR is, in four steps; then a
       * short way into every method and analysis page; then the papers, the
       * group, its funding and how to get in touch.
       *
       * Tone alternates band by band, and is decided here rather than inside
       * each section, so the rhythm can be read off in one place. The first
       * band is plain because the hero above it is tinted, and the last is
       * plain because the footer below it is. Eight bands cannot alternate
       * between two plain ends, so the group and its funding are both muted:
       * a muted band has a rule along each edge, so the pair still reads as
       * two sections, where two plain bands would run together.
       */}
      <SoftwareOverview />
      <ResearchVision tone="muted" />
      <TsrIntroduction />
      <ResearchPreview tone="muted" />
      <PublicationHighlights />
      <GroupPreview tone="muted" />
      <FundingSupport tone="muted" />
      <ContactCta />
    </>
  )
}
