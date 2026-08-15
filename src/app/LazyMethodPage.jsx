import { lazy, Suspense } from 'react'

/*
 * The one route component that is loaded on demand.
 *
 * Measured, not assumed. Method and analysis pages are the only pages that
 * render Markdown, and react-markdown with its remark / rehype / micromark
 * pipeline is 163 kB of the bundle — more than a quarter of it. Splitting it
 * out takes the initial download from 590 kB to 427 kB raw (178 kB to 129 kB
 * gzipped), a saving every visitor landing on the home page, publications,
 * people, software or contact now gets.
 *
 * NOTHING ELSE IS SPLIT, and that is also measured. The content registry is
 * eagerly bundled by design (see src/content/index.js) and is reached through
 * the navigation on every page, so lazy-loading the other route components
 * would move almost nothing out of the initial chunk while adding Suspense
 * boundaries to reason about. One split that pays for itself, rather than a
 * lazy() around everything that only looks like an optimisation.
 *
 * The tradeoff, stated plainly: a visitor who lands directly on a method page
 * — following a link from a paper, say — now waits for a second request that
 * cannot start until the first has parsed. That is the case this costs, and
 * it is worth it because the pages people arrive at first are the other five.
 *
 * This file exists separately from routeRegistry.jsx because that module
 * exports plain data as well as routes, and a module mixing components with
 * values breaks React Fast Refresh — the same reason routes.jsx and
 * routeRegistry.jsx are already two files.
 */
const MethodPage = lazy(() => import('../components/method/MethodPage'))

/**
 * `fallback={null}` renders nothing for the moment the chunk is in flight.
 *
 * Deliberate: a spinner that appears for 30ms on a fast connection is more
 * distracting than a blank, and the header, navigation and footer are already
 * painted around it — the page does not look broken while it waits.
 */
export default function LazyMethodPage({ slug }) {
  return (
    <Suspense fallback={null}>
      <MethodPage slug={slug} />
    </Suspense>
  )
}
