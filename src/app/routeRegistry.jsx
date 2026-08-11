import { matchRoutes } from 'react-router-dom'
import Home from '../pages/Home/Home'
import NotFound from '../pages/NotFound/NotFound'

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
 * Planned additions:
 *
 *   Stage 4  { path: '/tsr' }              MethodPage for the core TSR entry
 *   Stage 7  { path: '/methods/:slug' }    every published method
 *   Stage 7  { path: '/analysis/:slug' }   key analysis & visualisation
 *   Stage 7  /publications, /people
 *   Stage 8  /software, /contact
 *   Stage 7  legacy path redirects (e.g. /aa-grouping -> /methods/...)
 *
 * Adding a route here is all that is needed for the matching navigation entry
 * to appear, provided its content is also published.
 */
export const routeConfig = [
  { path: '/', element: <Home /> },
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
