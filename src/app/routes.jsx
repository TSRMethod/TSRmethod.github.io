import { Routes, Route } from 'react-router-dom'
import { routeConfig } from './routeRegistry'

/*
 * Renders the route table defined in `routeRegistry.jsx`.
 *
 * Routes are declared there and nowhere else, so the router and the
 * navigation are always derived from the same source.
 */
export default function AppRoutes() {
  return (
    <Routes>
      {routeConfig.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  )
}
