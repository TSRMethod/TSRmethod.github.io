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

export default LEGACY_PATHS
