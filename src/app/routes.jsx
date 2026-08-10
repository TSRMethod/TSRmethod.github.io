import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home/Home'
import NotFound from '../pages/NotFound/NotFound'

/*
 * Route table for the whole site.
 *
 * Routes are declared here and nowhere else. Navigation links are generated
 * from `navigation.js` (added in Stage 2) so the menu and the router can never
 * drift apart.
 *
 * Planned additions:
 *
 *   Stage 4  /tsr                     the canonical TSR method page
 *   Stage 7  /methods/:slug           every TSR-derived method, one dynamic
 *                                     route backed by Markdown content
 *   Stage 7  /analysis/:slug          key analysis & visualisation pages
 *   Stage 7  /publications /people
 *   Stage 8  /software /contact
 *   Stage 7  legacy path redirects    e.g. /aa-grouping -> /methods/amino-acid-grouping
 *                                     (added once the targets exist, so an old
 *                                     bookmark never lands on a 404)
 *
 * Because method pages resolve through a couple of dynamic routes rather than
 * one route per page, the route table stays small and code splitting buys
 * little. Lazy loading can be added later per route if the bundle grows.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
