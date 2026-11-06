import { publishedMethods } from '../content'

/*
 * The menu's shape and the pure function that fills it, without the route
 * table. Split out of navigation.js so that a page can read the menu (for its
 * breadcrumb) without importing the route table, which imports every page.
 * navigation.js adds the route gate and is what the header uses.
 */

/*
 * The content registry's groups, labelled for the Methods & research page,
 * where each heads its own list. The ids are the `group` field of the
 * Markdown files.
 */
export const GROUP_LABELS = {
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
 * only its three pages (Overview, Getting started, Learn BioTSR);
 * installation, documentation and citation are sections of its overview. "Methods & research" is where every other method page,
 * the analysis pages and the earlier code live. Measured at 1150px, where the
 * desktop bar first appears: see NAV_QUERY in useMediaQuery.js before adding
 * a seventh.
 */
export const SKELETON = [
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
          {
            id: 'learn',
            label: 'Learn BioTSR',
            to: '/software/learn',
            // Pages that belong under this entry: the menu marks it as their
            // section, and their breadcrumb names the page itself.
            section: ['/software/four-triangles-one-key', '/software/first-10-minutes'],
          },
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
 * Fill the menu skeleton: registry-backed groups take their published
 * methods, every link must pass `isAvailable`, and empty groups and items
 * are dropped. navigation.js's getVisibleNavigation passes the route gate.
 */
export function buildNavigation({ skeleton = SKELETON, methods = publishedMethods, isAvailable }) {
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
 * Whether the page at `pathname` lives in this menu item: it is one of the
 * item's links, or one of the pages a link names as its `section`. Marks the
 * top-level dropdown that holds the current page.
 */
export function itemContains(item, pathname) {
  return (item.groups ?? []).some((group) =>
    group.items.some((link) => link.to === pathname || link.section?.includes(pathname)),
  )
}

/* The page each dropdown stands for, where it has one. */
const PARENT_PAGES = { biotsr: '/software', research: '/research' }

/**
 * The breadcrumb trail above a page that is an entry in a dropdown, e.g.
 * [{ to: '/research', label: 'Methods & research' }] for /methods/sse-tsr;
 * null for pages that are not, or whose dropdown has no page of its own.
 * Read from the menu, so a breadcrumb cannot disagree with it. By default
 * the menu is built without the route gate (every page with a breadcrumb has
 * a route, or it would not be rendering one).
 */
export function breadcrumbFor(pathname, items = buildNavigation({ isAvailable: () => true })) {
  const item = items.find((candidate) =>
    candidate.groups?.some((group) => group.items.some((link) => link.to === pathname)),
  )
  const to = item && PARENT_PAGES[item.id]
  if (!to || to === pathname) return null
  return [{ to, label: item.label }]
}
