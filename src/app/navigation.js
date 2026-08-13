import { publishedMethods } from '../content'
import { isRouteImplemented } from './routeRegistry'

/*
 * Site navigation.
 *
 * The menu is DERIVED, not hand-maintained. Two independent gates decide
 * whether a link is shown, and both must pass:
 *
 *   1. Content approval — the method's `status` in its Markdown frontmatter
 *      must be `published`. This is the scientific sign-off: CrossTSR and
 *      Metal-Ion TSR are `draft` because their content has known problems
 *      (see CONTENT-REVIEW.md), and no amount of working code should surface
 *      them.
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

/** Sections whose items are filled from the content registry. */
const GROUP_LABELS = {
  methods: [
    { id: 'one-molecule', label: 'One Molecule' },
    { id: 'two-molecules', label: 'Two Molecules' },
    { id: 'nucleotide', label: 'Nucleotide' },
  ],
  analysis: [
    // Tools that summarise or transform TSR keys...
    { id: 'key-analysis', label: 'Analysis' },
    // ...and tools that cluster, plot or learn from them.
    { id: 'key-visualization', label: 'Visualization & Modeling' },
  ],
}

/**
 * The menu skeleton.
 *
 * `source` marks a dropdown whose items come from the content registry for
 * that category. Everything else is a fixed link to a hand-built page.
 */
const SKELETON = [
  { id: 'home', label: 'Home', to: '/' },
  { id: 'tsr', label: 'TSR Method', to: '/tsr' },
  {
    id: 'methods',
    label: 'TSR-Based Methods',
    source: 'method',
    groups: GROUP_LABELS.methods,
  },
  {
    id: 'analysis',
    label: 'Key Analysis & Visualization',
    source: 'analysis',
    groups: GROUP_LABELS.analysis,
  },
  { id: 'publications', label: 'Publications', to: '/publications' },
  /*
   * Software stays inside About rather than becoming a seventh top-level item,
   * and that is a measurement rather than a preference.
   *
   * Promoting it was tried first: a researcher after the code is arguably not
   * looking under "About". But the bar is already 926px wide with six items,
   * and the desktop navigation turns on at 1024px. Adding "Software" pushed
   * the group's name out of the header — ellipsised at 1280px, and collapsed
   * to nothing at 1024px, leaving the bare "TSR" mark. Trading the site's own
   * name in the header for one menu position is a bad deal, and the only ways
   * to buy the width back were shortening an established menu label or hiding
   * the name deliberately.
   *
   * Software is reachable in three other places instead: the footer's Explore
   * column, the home page's software section, and the contact page.
   */
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
        // Registry-backed groups pull their items from published content;
        // fixed groups declare them inline.
        const candidates = item.source
          ? methods
              .filter((method) => method.group === group.id)
              .map(methodToLink)
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
 * The home page needs the whole method entry (title, summary) rather than the
 * link shape above, but it must not invent a second taxonomy: if a method
 * moves group, or a new group is added here, both the menu and the home page
 * follow. Both gates still apply, so a draft or an unrouted page cannot appear.
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
