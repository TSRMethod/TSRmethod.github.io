import { matchRoutes } from 'react-router-dom'
import { routeConfig } from './routeRegistry'
import { LEARNING_PAGES } from '../content/learnResources'

/* Hand-written pages outside the app (Learn BioTSR's lesson and notebook). */
const HTML_PAGE_PATHS = Object.values(LEARNING_PAGES).map((page) => page.path)

/*
 * An address that names a page in a form other than its own — /people/,
 * /people.html, /People — and the page's own address, or null.
 *
 * GitHub Pages answers each of those with a 404 or a second copy of the
 * page, while the router would still draw the page underneath, so a reader
 * would see it at an address that is not its address. main.jsx sends them
 * on before anything renders. Only routes with a fixed path count: anything
 * unknown stays where it is and gets the 404 page.
 *
 * The hand-written learning pages count too. Pages serves them only at their
 * exact address, so /software/four-triangles-one-key/ reaches the app as a
 * 404, and is sent on to the page from here.
 */
export default function ownAddress(pathname) {
  const stripped = pathname.replace(/\.html$/, '').replace(/\/index$/, '/')
  const candidate = stripped === '/' ? '/' : stripped.replace(/\/+$/, '') || '/'

  const htmlPage = HTML_PAGE_PATHS.find((path) => path === candidate.toLowerCase())
  if (htmlPage) return htmlPage === pathname ? null : htmlPage

  const path = matchRoutes(routeConfig, candidate)?.at(-1)?.route.path
  if (!path || path === '*' || path.includes(':')) return null

  return path === pathname ? null : path
}
