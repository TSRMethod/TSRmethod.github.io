import { matchRoutes } from 'react-router-dom'
import { routeConfig } from './routeRegistry'

/*
 * An address that names a page in a form other than its own — /people/,
 * /people.html, /People — and the page's own address, or null.
 *
 * GitHub Pages answers each of those with a 404 or a second copy of the
 * page, while the router would still draw the page underneath, so a reader
 * would see it at an address that is not its address. main.jsx sends them
 * on before anything renders. Only routes with a fixed path count: anything
 * unknown stays where it is and gets the 404 page.
 */
export default function ownAddress(pathname) {
  const stripped = pathname.replace(/\.html$/, '').replace(/\/index$/, '/')
  const candidate = stripped === '/' ? '/' : stripped.replace(/\/+$/, '') || '/'

  const path = matchRoutes(routeConfig, candidate)?.at(-1)?.route.path
  if (!path || path === '*' || path.includes(':')) return null

  return path === pathname ? null : path
}
