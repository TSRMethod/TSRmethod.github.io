import { StrictMode } from 'react'
import { prerender } from 'react-dom/static'
import { matchRoutes, StaticRouter } from 'react-router-dom'
import App from './app/App'
import { routeConfig } from './app/routeRegistry'
import LazyMethodPage from './app/LazyMethodPage'
import { LazyGetStarted, LazySoftware } from './app/LazySoftwarePages'
import { PageMetadataCollector } from './lib/pageMetadata'

export { legacyRedirects, isRouteImplemented } from './app/routeRegistry'
export { structuredDataFor } from './lib/structuredData'
export { SOCIAL_IMAGE, buildPageMetadata } from './lib/pageMetadata'

/*
 * The build-time renderer. scripts/prerender.mjs calls `render` once for each
 * published page and writes the result into that page's HTML file.
 *
 * The tree is the browser's tree (main.jsx) with a StaticRouter in place of
 * BrowserRouter, so the HTML is exactly what the browser would draw and React
 * can take it over without redrawing it. The one difference is the collector,
 * which is where each page's usePageMetadata call leaves its title and
 * description, since effects do not run here.
 *
 * `prerender` rather than `renderToString` because it waits for the lazily
 * loaded pages — the method and software pages — and renders their content
 * instead of their empty Suspense fallback. The web-stream form, so that the
 * tests can run the same renderer in a browser-like environment.
 */
export async function render(pathname) {
  const metadata = {}
  const errors = []

  const { prelude } = await prerender(
    <StrictMode>
      <PageMetadataCollector value={metadata}>
        <StaticRouter location={pathname}>
          <App />
        </StaticRouter>
      </PageMetadataCollector>
    </StrictMode>,
    {
      onError: (error) => errors.push(error),
      /*
       * React writes a Suspense boundary larger than this out of order — a
       * placeholder in place, the content in a hidden <div> at the end of
       * the page, and an inline script to swap them — so a long page shows
       * its start sooner while streaming. Nothing streams here, and the
       * method and software pages are all larger than the 12.8 kB default,
       * so without this their content would need JavaScript to be in the
       * right place. Infinity keeps every page in document order.
       */
      progressiveChunkSize: Infinity,
    },
  )

  let html = ''
  const reader = prelude.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    html += decoder.decode(value, { stream: true })
  }
  html += decoder.decode()

  /* A page that failed to render must fail the build, not ship half-drawn. */
  if (errors.length > 0) throw errors[0]
  if (html.includes('<template id="B:')) {
    throw new Error(`${pathname}: part of the page was written out of order`)
  }

  return { html, metadata }
}

/*
 * The source file each lazily loaded route component imports.
 *
 * A page's HTML already contains that component's markup, so its stylesheet
 * has to be linked in the page's <head>: in the browser the stylesheet
 * otherwise arrives with the component's code, and the prerendered content
 * would first be painted unstyled. The prerender looks these up in Vite's
 * build manifest. prerender.test.js fails if a lazy() is added without an
 * entry here.
 */
export const LAZY_SOURCES = new Map([
  [LazyMethodPage, 'src/components/method/MethodPage.jsx'],
  [LazySoftware, 'src/pages/Software/Software.jsx'],
  [LazyGetStarted, 'src/pages/GetStarted/GetStarted.jsx'],
])

/** The lazily loaded source files the page at `pathname` renders. */
export function lazySourcesFor(pathname) {
  const route = matchRoutes(routeConfig, pathname)?.at(-1)?.route
  const source = LAZY_SOURCES.get(route?.element?.type)
  return source ? [source] : []
}
