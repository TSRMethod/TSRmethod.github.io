import { publishedMethods } from '../content'
import { isRouteImplemented } from './routeRegistry'
import { buildNavigation, GROUP_LABELS, SKELETON } from './menuData'

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
  return buildNavigation({ skeleton, methods, isAvailable })
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

export { itemContains, breadcrumbFor } from './menuData'
