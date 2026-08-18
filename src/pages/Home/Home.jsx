import usePageMetadata from '../../hooks/usePageMetadata'
import { home } from '../../content'
import Hero from '../../components/home/Hero'
import ResearchVision from '../../components/home/ResearchVision'
import TsrIntroduction from '../../components/home/TsrIntroduction'
import ContentShowcase from '../../components/home/ContentShowcase'
import SoftwareOverview from '../../components/home/SoftwareOverview'
import PublicationHighlights from '../../components/home/PublicationHighlights'
import GroupPreview from '../../components/home/GroupPreview'
import FundingSupport from '../../components/home/FundingSupport'
import ContactCta from '../../components/home/ContactCta'
import {
  METHODS_SECTION_ID,
  ANALYSIS_SECTION_ID,
} from '../../components/home/sectionIds'

/*
 * The home page: composition only.
 *
 * Two rules hold this together, and both are worth keeping.
 *
 *   1. It states no content. Every sentence comes from src/content/home.json,
 *      and every list — methods, analysis tools, packages, papers, faculty —
 *      is read from the content registry. There is no second list of method
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
       * Why before how: the motivation for the research comes ahead of the
       * explanation of the mechanism.
       */}
      <ResearchVision />
      <TsrIntroduction tone="muted" />

      <ContentShowcase
        id={METHODS_SECTION_ID}
        heading={home.methods.heading}
        intro={home.methods.intro}
        category="method"
      />

      <ContentShowcase
        id={ANALYSIS_SECTION_ID}
        heading={home.analysis.heading}
        intro={home.analysis.intro}
        category="analysis"
        tone="muted"
      />

      {/*
       * Tone alternates band by band, and is decided here rather than inside
       * each section, so the rhythm can be read off in one place. Two sections
       * were inserted, so every tone below them shifted by one to keep the
       * alternation — the values moved, the rule did not. The first band is
       * plain because the hero above it is already tinted, and the last is
       * plain because the footer below it is.
       */}
      <SoftwareOverview />
      <PublicationHighlights tone="muted" />
      <GroupPreview />
      <FundingSupport tone="muted" />
      <ContactCta />
    </>
  )
}
