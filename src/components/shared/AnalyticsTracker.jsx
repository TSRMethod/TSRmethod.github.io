import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  initializeAnalytics,
  startPerformanceMonitoring,
  trackPageView,
} from '../../lib/analytics'

/*
 * Turns React Router navigations into GA4 page views.
 *
 * A single-page application changes the URL without loading a document, so
 * GA4's own page-view measurement would record the first landing and nothing
 * else. Views are therefore sent by hand, once per location, with gtag's
 * automatic view disabled at configuration time — see initializeAnalytics.
 * One place sends views; there is no arrangement in which both do.
 *
 * Renders nothing, and is mounted AFTER the page content in App so that its
 * effect runs after the page has set the document title. Effects run children
 * first and siblings in order, so a tracker placed above the layout would
 * report every view under the previous page's title.
 *
 * With no measurement ID configured every call below returns immediately, so
 * this component costs one effect and no network request.
 */
export default function AnalyticsTracker() {
  const { pathname, search } = useLocation()

  useEffect(() => {
    if (initializeAnalytics()) startPerformanceMonitoring()
  }, [])

  useEffect(() => {
    trackPageView(`${pathname}${search}`)
  }, [pathname, search])

  return null
}
