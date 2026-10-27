import { publishedMethods } from '../content'
import { isRouteImplemented } from './routeRegistry'

/*
 * Site navigation.
 *
 * The menu is DERIVED, not hand-maintained. Two independent gates decide
 * whether a link is shown, and both must pass:
 *
 *   1. Content approval — the method's `status` in its Markdown frontmatter
 *      must be `published`. This is the scientific sign-off: Key to 2D Image
 *      is `draft` because its content has known problems (see
 *      CONTENT-REVIEW.md), and no amount of working code should surface it.
 *
 *   2. Technical availability — the path must resolve in the route table.
 *      This is derived by asking the router itself (`isRouteImplemented`),
 *      so there is no second "is it built yet" flag to maintain and no way
 *      for the navigation to advertise a page that does not exist.
 *
 * Keeping these separate matters: "not scientifically approved" and "not
 * implemented yet" are different states with different owners, and a single
 * flag would conflate them. Neither gate is editable through the CMS — one
 * lives in code, the other is a field a maintainer controls.
 *
 * Menu labels, ordering and grouping live here in code. Which items fill a
 * group comes from the content registry.
 */

/*
 * The content registry's groups, labelled for the Methods & research page,
 * where each heads its own list. The ids are the `group` field of the
 * Markdown files.
 */
const GROUP_LABELS = {
  methods: [
    { id: 'one-molecule', label: 'One-molecule methods' },
    { id: 'nucleotide', label: 'Nucleotide methods' },
    // Cross methods: every triangle spans two molecules. Nucleotide–Protein
    // TSR is here rather than under nucleotides, beside DrugTSR's cross keys.
    { id: 'two-molecules', label: 'Two-molecule methods' },
  ],
  analysis: [
    // Tools that summarise or transform TSR keys...
    { id: 'key-analysis', label: 'Key analysis' },
    // ...and tools that cluster, plot or learn from them.
    { id: 'key-visualization', label: 'Visualisation and modelling' },
  ],
}

/*
 * The "Methods & research" menu: every published method and analysis page,
 * plus the code they were first published with.
 *
 * Three groups, by what a page IS rather than by how old its software is. The
 * scientific methods are current science, and most of them run in BioTSR
 * today; it is their first implementations that are historical, so the word
 * "legacy" appears nowhere in the menu. `sources` lists the registry groups
 * that fill a menu group, in order, so the eight method pages keep the
 * one-molecule / nucleotide / two-molecule order the content gives them
 * without the menu needing three headings for it.
 *
 * `column` lays the groups out as two columns: the methods, and the rest. It
 * is a layout hint only; the list is in reading order, which is the order the
 * mobile drawer and a screen reader's list of lists follow.
 */
const RESEARCH_GROUPS = [
  {
    id: 'scientific-methods',
    label: 'Scientific methods',
    sources: ['one-molecule', 'nucleotide', 'two-molecules'],
    column: 1,
  },
  {
    id: 'analysis-research',
    label: 'Analysis and research applications',
    sources: ['key-analysis', 'key-visualization'],
    column: 2,
  },
  {
    id: 'earlier-implementations',
    label: 'Earlier implementations',
    column: 2,
    items: [
      {
        id: 'earlier-code',
        label: 'Earlier implementations and research code',
        to: '/research/earlier-implementations',
      },
    ],
  },
  {
    id: 'research-overview',
    label: 'Overview',
    column: 2,
    items: [{ id: 'research', label: 'All methods and research', to: '/research' }],
  },
]

/**
 * The menu skeleton.
 *
 * A group with `sources` takes its items from the content registry; every
 * other item is a fixed link to a hand-built page.
 *
 * NO LINK IN THE MENU HAS A #FRAGMENT, and a test holds it to that. A menu
 * entry is a page, and exactly one can be current: when /software and
 * /software#install were both entries, both were highlighted at once on the
 * BioTSR page. Sections of a page belong in that page's own "On this page"
 * navigation, which tracks them separately.
 *
 * Six top-level items. "Home" comes first as a plain link, as well as being
 * the group's mark and name at the left of the header: a visitor who does
 * not know the logo is a link still has a way back. "Understand TSR" is a
 * plain link to the core method, the one page a newcomer needs. BioTSR holds
 * only its two pages; installation, documentation and citation are sections
 * of its overview. "Methods & research" is where every other method page,
 * the analysis pages and the earlier code live. Measured at 1150px, where the
 * desktop bar first appears: see NAV_QUERY in useMediaQuery.js before adding
 * a seventh.
 */
const SKELETON = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'science', label: 'Understand TSR', to: '/tsr' },
  {
    id: 'biotsr',
    label: 'BioTSR',
    groups: [
      {
        id: 'biotsr-group',
        label: 'BioTSR software',
        items: [
          { id: 'biotsr-overview', label: 'Overview', to: '/software' },
          { id: 'get-started', label: 'Getting started', to: '/software/get-started' },
        ],
      },
    ],
  },
  {
    id: 'research',
    label: 'Methods & research',
    groups: RESEARCH_GROUPS,
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
          { id: 'contact', label: 'Contact', to: '/contact' },
        ],
      },
    ],
  },
]

function methodToLink(method) {
  return {
    id: method.slug,
    label: method.shortTitle ?? method.title,
    to: method.path,
  }
}

/**
 * Build the navigation actually shown to visitors.
 *
 * @param {object} [options]
 * @param {Array}  [options.skeleton]  menu shape; injectable for tests
 * @param {Array}  [options.methods]   content registry; injectable for tests
 * @param {(path: string) => boolean} [options.isAvailable] route gate
 */
export function getVisibleNavigation({
  skeleton = SKELETON,
  methods = publishedMethods,
  isAvailable = isRouteImplemented,
} = {}) {
  const linkIsUsable = (link) => isAvailable(link.to)

  return skeleton.flatMap((item) => {
    if (!item.groups) {
      return linkIsUsable(item) ? [item] : []
    }

    const groups = item.groups
      .map((group) => {
        // Registry-backed groups pull their items from published content,
        // source group by source group; fixed groups declare them inline.
        const candidates = group.sources
          ? group.sources.flatMap((source) =>
              methods.filter((method) => method.group === source).map(methodToLink),
            )
          : (group.items ?? [])

        return { ...group, items: candidates.filter(linkIsUsable) }
      })
      .filter((group) => group.items.length > 0)

    return groups.length > 0 ? [{ ...item, groups }] : []
  })
}

/**
 * Published content for one category, arranged into the same labelled groups
 * the menu uses.
 *
 * The Methods & research page needs the whole method entry (title, summary)
 * rather than the link shape above, but it must not invent a second taxonomy:
 * if a method moves group, or a new group is added here, both the menu and
 * that page follow. Both gates still apply, so a draft or an unrouted page cannot appear.
 *
 * @param {'method' | 'analysis'} category  which set of group labels to use
 * @returns {Array<{id: string, label: string, methods: Array}>} non-empty groups
 */
export function getContentGroups(
  category,
  { methods = publishedMethods, isAvailable = isRouteImplemented } = {},
) {
  const groups = category === 'analysis' ? GROUP_LABELS.analysis : GROUP_LABELS.methods

  return groups
    .map((group) => ({
      ...group,
      methods: methods.filter(
        (method) => method.group === group.id && isAvailable(method.path),
      ),
    }))
    .filter((group) => group.methods.length > 0)
}

/* Exposed so tests can assert against the intended shape. */
export { SKELETON as navigationSkeleton }
