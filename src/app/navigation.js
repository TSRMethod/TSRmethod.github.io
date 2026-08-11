/*
 * Site navigation taxonomy.
 *
 * This is the ONLY definition of the menu. Both the desktop dropdowns and the
 * mobile drawer render from this data, so the two can never drift apart, and
 * adding a page is a data change rather than a JSX change.
 *
 * ---------------------------------------------------------------------------
 * Item shapes
 * ---------------------------------------------------------------------------
 *   Link      { id, label, to }
 *   Dropdown  { id, label, groups: [{ id, label, items: [Link] }] }
 *
 * A dropdown always uses groups, even when there is only one, so the rendering
 * code has a single shape to deal with.
 *
 * ---------------------------------------------------------------------------
 * status
 * ---------------------------------------------------------------------------
 * Any item may carry `status: 'draft'`. Draft items are filtered out of the
 * navigation by `getVisibleNavigation()` and must also be kept out of the
 * router, so an unreviewed page cannot be reached at all.
 *
 * Draft means "not cleared for publication", NOT "not built yet". Two method
 * pages are currently draft because their content is scientifically wrong —
 * see CONTENT-REVIEW.md. Publishing one is a one-word edit here plus adding
 * its route, and should only be done by a maintainer after review.
 */

export const navigation = [
  { id: 'home', label: 'Home', to: '/' },

  { id: 'tsr', label: 'TSR Method', to: '/tsr' },

  {
    id: 'methods',
    label: 'TSR-Based Methods',
    groups: [
      {
        id: 'one-molecule',
        label: 'One Molecule',
        items: [
          {
            id: 'amino-acid-grouping',
            label: 'Amino Acid Grouping TSR',
            to: '/methods/amino-acid-grouping',
          },
          {
            id: 'mirror-image',
            label: 'Mirror-Image TSR',
            to: '/methods/mirror-image',
          },
          {
            id: 'size-filtering',
            label: 'Size-Filtering TSR',
            to: '/methods/size-filtering',
          },
          { id: 'sse-tsr', label: 'SSE-TSR', to: '/methods/sse-tsr' },
          {
            id: 'metal-ion',
            label: 'Metal-Ion TSR',
            to: '/methods/metal-ion',
            // Placeholder tutorial content and a placeholder repository URL.
            status: 'draft',
          },
        ],
      },
      {
        id: 'two-molecules',
        label: 'Two Molecules',
        items: [
          { id: 'drug-tsr', label: 'DrugTSR', to: '/methods/drug-tsr' },
          {
            id: 'cross-tsr',
            label: 'CrossTSR',
            to: '/methods/cross-tsr',
            // Overview text is verbatim DrugTSR content. Needs rewriting.
            status: 'draft',
          },
        ],
      },
      {
        id: 'nucleotide',
        label: 'Nucleotide',
        items: [
          {
            id: 'amino-acid',
            label: 'Amino Acid TSR',
            to: '/methods/amino-acid',
          },
          {
            id: 'nucleotide',
            label: 'Nucleotide TSR',
            to: '/methods/nucleotide',
          },
          {
            id: 'nucleotide-protein',
            label: 'Nucleotide–Protein TSR',
            to: '/methods/nucleotide-protein',
          },
        ],
      },
    ],
  },

  {
    id: 'analysis',
    label: 'Key Analysis',
    groups: [
      {
        id: 'key-analysis',
        label: 'Analysis',
        items: [
          {
            id: 'common-keys',
            label: 'Common Keys',
            to: '/analysis/common-keys',
          },
          {
            id: 'key-to-image',
            label: 'Key to 2D Image',
            to: '/analysis/key-to-image',
          },
        ],
      },
      {
        id: 'key-visualisation',
        label: 'Visualisation',
        items: [
          {
            id: 'clustering',
            label: 'Hierarchical Clustering',
            to: '/analysis/clustering',
          },
          {
            id: 'deep-neural-network',
            label: 'Deep Neural Network',
            to: '/analysis/deep-neural-network',
          },
        ],
      },
    ],
  },

  { id: 'publications', label: 'Publications', to: '/publications' },

  {
    id: 'about',
    label: 'About',
    groups: [
      {
        id: 'about-group',
        label: 'About the group',
        items: [
          { id: 'people', label: 'People', to: '/people' },
          { id: 'software', label: 'Software', to: '/software' },
          { id: 'contact', label: 'Contact', to: '/contact' },
        ],
      },
    ],
  },
]

const isPublished = (entry) => entry.status !== 'draft'

/**
 * The navigation with every draft item removed.
 *
 * Groups that end up empty are dropped, and dropdowns whose groups are all
 * empty are dropped too, so hiding the last item in a menu hides the menu
 * rather than leaving an empty panel behind.
 */
export function getVisibleNavigation(items = navigation) {
  return items.filter(isPublished).flatMap((item) => {
    if (!item.groups) return [item]

    const groups = item.groups
      .filter(isPublished)
      .map((group) => ({ ...group, items: group.items.filter(isPublished) }))
      .filter((group) => group.items.length > 0)

    return groups.length > 0 ? [{ ...item, groups }] : []
  })
}

export default navigation
