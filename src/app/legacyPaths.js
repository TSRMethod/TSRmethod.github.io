/*
 * Addresses used by the previous website, mapped to the slug they now live
 * under.
 *
 * The old site was public for long enough that these paths may sit in
 * bookmarks, slide decks, emails and printed material, and a redirect costs
 * far less than a broken link.
 *
 * `routeRegistry.jsx` turns each entry into a redirect route, but ONLY when
 * the target method is published. An alias must never become a back door to a
 * draft: `/sse-tsr` is listed here and stays inert until that page's citation
 * is resolved and it is published.
 *
 * Add an entry when migrating a page whose URL changed. Plain data in its own
 * module, so the route table can stay a JSX file without mixing exports.
 */
export const LEGACY_PATHS = {
  '/mirror-image': 'mirror-image',
  '/size-filtering': 'size-filtering',
  '/aa-grouping': 'amino-acid-grouping',
  '/sse-tsr': 'sse-tsr',
  '/drug-tsr': 'drug-tsr',
  // The legacy site had no hyphen here, and this is a different page from
  // /aa-grouping — see the note at the top of amino-acid.md.
  '/aminoacid': 'amino-acid',
  '/nucleotide': 'nucleotide',
  '/nucleotide-protein': 'nucleotide-protein',

  // Key analysis and visualisation tools.
  '/commonkeys': 'common-keys',
  '/keytoimage': 'key-to-image',
  '/clustering': 'clustering',
  '/dnn': 'dnn',
}

/*
 * The same idea for the hand-built pages, mapping an old address to a new one
 * rather than to a method slug.
 *
 * Only one entry, and only because the destination genuinely is the same page
 * under a new name: the old "Source Code" page existed to point people at the
 * repositories, which is what /software does.
 *
 * TWO OLD ADDRESSES ARE DELIBERATELY NOT REDIRECTED, and both are decisions
 * rather than oversights:
 *
 *   /problems   was a form that reported nothing. It logged the message to the
 *               browser console and then displayed "Thank you for your
 *               submission! We will be in touch with you soon." Nothing
 *               replaces it, because the honest answer now depends on the
 *               question: a reproducible bug belongs on the repository that
 *               provides the tool, and everything else belongs in an email.
 *               /contact explains both, but sending "report a problem" there
 *               would be guessing which one the visitor wanted. It 404s, and
 *               the 404 page offers the way back.
 *
 *   /community  was two affiliation logos. Those affiliations are now in the
 *               footer of every page — including the 404 — and on /contact, so
 *               there is no page to send anyone to.
 */
export const LEGACY_PAGE_PATHS = {
  '/source-code': '/software',
}

export default LEGACY_PATHS
