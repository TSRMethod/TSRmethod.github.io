/*
 * Site analytics: one module, one vendor, one way in.
 *
 * Every component that wants to record something calls a named helper here.
 * Nothing anywhere else touches `gtag`, `dataLayer` or a measurement ID, so
 * the questions that matter about analytics — is it on, what does it send,
 * does it carry anything personal — are answered by reading this file.
 *
 * OFF BY DEFAULT. Analytics runs only when VITE_GA_MEASUREMENT_ID is set at
 * build time; with no ID every function here is a no-op that returns false,
 * no script is fetched, and nothing throws. That is the state of a local
 * development server, a contributor's clone and the whole test suite, so an
 * outage or a blocked request at Google's end can never take a page down.
 *
 * The ID is configuration, not a credential: it is visible in the page source
 * of any GA4 site. It is kept out of the repository so that a fork does not
 * report into our property, not because it is a secret.
 */

/** The GA4 measurement ID for this build, or '' when analytics is off. */
function measurementId() {
  const configured = import.meta.env?.VITE_GA_MEASUREMENT_ID
  return typeof configured === 'string' ? configured.trim() : ''
}

export function isAnalyticsEnabled() {
  return measurementId() !== ''
}

/** The path an event happened on, added to every event automatically. */
export function currentPath() {
  return typeof window === 'undefined' ? '' : window.location.pathname
}

/*
 * Module state, deliberately not React state.
 *
 * Initialisation must happen once per document, and a page view must be
 * recorded once per navigation — neither survives being tied to a component
 * that StrictMode mounts twice in development, or that a future layout change
 * re-mounts. Keeping the guards at module scope makes both facts properties
 * of the page rather than of a component's lifetime.
 */
let initialized = false
let lastPageViewPath = null

/** The global gtag function, once the script has been installed. */
function gtag(...args) {
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(args)
}

/**
 * Load GA4 and configure it for a single-page application.
 *
 * `send_page_view: false` is the important line. Left at its default, gtag
 * records a view when it loads AND this application records one for the same
 * route a moment later, which doubles every landing. Views are sent from one
 * place only — trackPageView, called by AnalyticsTracker on each location
 * change, including the first.
 *
 * @returns {boolean} whether analytics was started by this call
 */
export function initializeAnalytics() {
  const id = measurementId()
  if (!id || initialized || typeof document === 'undefined') return false

  initialized = true

  try {
    gtag('js', new Date())
    gtag('config', id, { send_page_view: false })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
    document.head.appendChild(script)

    return true
  } catch {
    /* Analytics is never allowed to be the reason a page fails to render. */
    return false
  }
}

/**
 * Record one view of a route.
 *
 * Repeated calls for the path already recorded are ignored, which is what
 * makes React's development double-render and any re-mount harmless.
 *
 * @param {string} path route path, e.g. "/people"
 * @param {string} [title] document title at the time of the view
 */
export function trackPageView(path, title) {
  if (!isAnalyticsEnabled() || !initialized) return false
  if (typeof path !== 'string' || path === '') return false
  if (path === lastPageViewPath) return false

  lastPageViewPath = path

  try {
    gtag('event', 'page_view', {
      page_path: path,
      page_title: title ?? document.title,
      page_location: `${window.location.origin}${path}`,
    })
    return true
  } catch {
    return false
  }
}

/**
 * Record one interaction.
 *
 * Parameters are for interpreting the event later: stable content IDs, the
 * kind of link, the page it happened on. NEVER an email address, a name, a
 * search term or anything else that identifies a visitor or a member of the
 * group — see docs/ANALYTICS.md.
 *
 * Failure is silent and cannot propagate: these calls sit in click handlers
 * on real links, and an analytics problem must not stop a navigation.
 */
export function trackEvent(name, parameters = {}) {
  if (!isAnalyticsEnabled() || !initialized) return false
  if (typeof name !== 'string' || name === '') return false

  try {
    /*
     * Where it happened is added here rather than by each caller, so every
     * event carries it and no component has to remember to.
     */
    gtag('event', name, { page_path: currentPath(), ...parameters })
    return true
  } catch {
    return false
  }
}

/*
 * Core Web Vitals, reported through the same pipe.
 *
 * The library is imported dynamically and only when analytics is on, so a
 * build with no measurement ID never downloads it — it is a separate chunk
 * that the browser has no reason to ask for.
 *
 * The numbers go to GA4 for maintainers to read. Nothing is displayed to
 * visitors: a page that renders its own performance score is a page that has
 * made itself slower to say so.
 */
export async function startPerformanceMonitoring() {
  if (!isAnalyticsEnabled() || !initialized) return false

  try {
    const { onCLS, onINP, onLCP } = await import('web-vitals')

    const report = (metric) => {
      trackEvent('web_vitals', {
        metric_name: metric.name,
        /* CLS is a small ratio; GA4 rounds integers, so it is scaled. */
        metric_value: Math.round(
          metric.name === 'CLS' ? metric.value * 1000 : metric.value,
        ),
        metric_rating: metric.rating,
        metric_id: metric.id,
      })
    }

    onCLS(report)
    onINP(report)
    onLCP(report)

    return true
  } catch {
    return false
  }
}

/*
 * The event taxonomy, named once.
 *
 * Small on purpose. These are the research-engagement questions the group
 * actually has — which people are looked up, which papers are opened, which
 * repositories are visited — and not a log of every click, which would cost
 * the same to collect and be harder to read.
 */
export const EVENTS = {
  profileLink: 'profile_link_click',
  publicationLink: 'publication_link_click',
  repositoryLink: 'repository_link_click',
  tutorialLink: 'tutorial_link_click',
  contact: 'contact_click',
}
