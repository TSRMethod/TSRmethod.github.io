import { matchRoutes, Navigate } from 'react-router-dom'
import Home from '../pages/Home/Home'
import NotFound from '../pages/NotFound/NotFound'
import Publications from '../pages/Publications/Publications'
import People from '../pages/People/People'
import MethodPage from '../components/method/MethodPage'
import { publishedMethods } from '../content'
import { LEGACY_PATHS } from './legacyPaths'

/*
 * The route table, as data.
 *
 * It is data rather than JSX so that `navigation.js` can ask "does this path
 * actually resolve to a page?" using React Router's own matcher. That is how
 * the navigation avoids ever linking to an unimplemented route, without
 * anyone maintaining a second list of "which pages exist" that could drift
 * out of sync with reality.
 *
 * This lives apart from `routes.jsx` because that file exports the AppRoutes
 * component, and a module that exports both a component and plain values
 * breaks React Fast Refresh.
 *
 * Method routes are GENERATED from the content registry. Adding a published
 * Markdown file to src/content/methods therefore creates its route and, in
 * turn, its navigation entry — no code change, and no way for the two to
 * disagree. Draft content is absent from `publishedMethods`, so an unreviewed
 * page has no route at all and cannot be reached by typing its address.
 *
 * Still to be hand-built:
 *   Stage 8  /software, /contact
 *
 * Adding a route here is the only thing needed to make its navigation and
 * footer links appear: both ask `isRouteImplemented` rather than carrying
 * their own list of what exists.
 */

const methodRoutes = publishedMethods.map((method) => ({
  path: method.path,
  element: <MethodPage slug={method.slug} />,
}))

/*
 * A legacy alias is created only when its target is actually published.
 *
 * This matters: an alias must not become a back door to a draft. SSE-TSR is
 * listed above and is deliberately absent from the route table, because its
 * content is still draft — the entry starts working by itself on the day the
 * page is published, and not before.
 */
const legacyRoutes = Object.entries(LEGACY_PATHS).flatMap(([from, slug]) => {
  const target = publishedMethods.find((method) => method.slug === slug)
  if (!target) return []
  return [{ path: from, element: <Navigate to={target.path} replace /> }]
})

export const routeConfig = [
  { path: '/', element: <Home /> },
  { path: '/publications', element: <Publications /> },
  { path: '/people', element: <People /> },
  ...methodRoutes,
  ...legacyRoutes,
  { path: '*', element: <NotFound /> },
]

/** The catch-all matches everything, but it is not an implemented page. */
const CATCH_ALL = '*'

/**
 * Does `path` resolve to a real page?
 *
 * Uses the router's own matcher, so dynamic segments such as
 * `/methods/:slug` are handled correctly once they exist.
 */
export function isRouteImplemented(path) {
  const matches = matchRoutes(routeConfig, path)
  if (!matches) return false
  return matches.some(
    (match) => match.route.path && match.route.path !== CATCH_ALL,
  )
}
