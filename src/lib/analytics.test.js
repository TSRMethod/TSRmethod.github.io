import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/*
 * The analytics module, tested without ever contacting Google.
 *
 * Nothing here is mocked away except the environment variable that turns
 * analytics on: the module really does build its script tag and really does
 * push to dataLayer, and the tests read what it pushed. That is what makes
 * "no measurement ID means no request" an assertion about the shipped code
 * rather than about a stub.
 *
 * Each test imports the module fresh, because whether analytics has already
 * been initialised is deliberately module state — see the module for why.
 */

const ID = 'G-TESTONLY000'

/** A fresh copy of the module, with or without a measurement ID configured. */
async function loadAnalytics({ id } = {}) {
  vi.resetModules()
  if (id) vi.stubEnv('VITE_GA_MEASUREMENT_ID', id)
  else vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
  return import('./analytics')
}

/** Every gtag call recorded so far, as ['event', name, params] tuples. */
const calls = () => Array.from(window.dataLayer ?? []).map((args) => [...args])

const events = () => calls().filter(([kind]) => kind === 'event')

beforeEach(() => {
  delete window.dataLayer
  document.head.querySelectorAll('script').forEach((node) => node.remove())
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('with no measurement ID configured', () => {
  it('reports itself disabled', async () => {
    const analytics = await loadAnalytics()
    expect(analytics.isAnalyticsEnabled()).toBe(false)
  })

  it('loads no script and records nothing, without throwing', async () => {
    const analytics = await loadAnalytics()

    expect(analytics.initializeAnalytics()).toBe(false)
    expect(analytics.trackPageView('/people')).toBe(false)
    expect(analytics.trackEvent('profile_link_click', { person_id: 'x' })).toBe(
      false,
    )
    await expect(analytics.startPerformanceMonitoring()).resolves.toBe(false)

    expect(document.querySelector('script[src*="googletagmanager"]')).toBeNull()
    expect(window.dataLayer).toBeUndefined()
  })
})

describe('with a measurement ID configured', () => {
  it('loads gtag once, however many times it is asked', async () => {
    const analytics = await loadAnalytics({ id: ID })

    expect(analytics.initializeAnalytics()).toBe(true)
    expect(analytics.initializeAnalytics()).toBe(false)
    expect(analytics.initializeAnalytics()).toBe(false)

    const scripts = document.querySelectorAll(
      'script[src*="googletagmanager.com/gtag/js"]',
    )
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toContain(ID)
    expect(scripts[0].async).toBe(true)
  })

  it('turns gtag’s own page-view measurement off', async () => {
    /*
     * The line that stops every landing being counted twice: gtag would send
     * a view on load, and this application sends one for the same route from
     * AnalyticsTracker a moment later.
     */
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()

    const config = calls().find(([kind]) => kind === 'config')
    expect(config).toBeDefined()
    expect(config[1]).toBe(ID)
    expect(config[2]).toMatchObject({ send_page_view: false })
  })

  it('pushes every command as an Arguments object, not an Array', async () => {
    /*
     * The regression test for a silent, total analytics outage.
     *
     * gtag.js only acts on a dataLayer entry when it is a genuine Arguments
     * object; a real Array — what `(...args) => dataLayer.push(args)` builds —
     * is ignored. The symptom is that everything looks correct: gtag/js loads
     * with a 200, the container registers, and dataLayer fills with entries
     * that read as `js`, `config` and `event`. Nothing is ever configured and
     * no measurement request is ever sent.
     *
     * Asserting the contents cannot catch this, because spreading an
     * Arguments object and spreading an Array produce identical tuples. Only
     * the entry's own type distinguishes them, so that is what is asserted.
     */
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()
    analytics.trackPageView('/people')
    analytics.trackEvent('contact_click', { contact_type: 'email' })

    const entries = Array.from(window.dataLayer)
    expect(entries.length).toBeGreaterThan(0)

    for (const entry of entries) {
      expect(Object.prototype.toString.call(entry)).toBe('[object Arguments]')
      expect(Array.isArray(entry)).toBe(false)
    }
  })

  it('configures the tag before it sends anything through it', async () => {
    /*
     * gtag ignores events for a destination it has not been configured for,
     * so `js` and `config` must be queued ahead of the first event — and the
     * script tag may only be added once the queue holds them, since gtag.js
     * drains dataLayer as soon as it runs.
     */
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()
    analytics.trackPageView('/')

    const kinds = calls().map(([kind]) => kind)
    expect(kinds[0]).toBe('js')
    expect(kinds[1]).toBe('config')
    expect(kinds.indexOf('event')).toBeGreaterThan(kinds.indexOf('config'))

    /* Exactly one config: a second would re-register the same destination. */
    expect(kinds.filter((kind) => kind === 'config')).toHaveLength(1)
  })

  it('records one page view per route, and never the same one twice', async () => {
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()

    expect(analytics.trackPageView('/')).toBe(true)
    expect(analytics.trackPageView('/people')).toBe(true)
    /* A re-render, a StrictMode double effect, a re-mount: all the same path. */
    expect(analytics.trackPageView('/people')).toBe(false)
    expect(analytics.trackPageView('/publications')).toBe(true)

    const paths = events()
      .filter(([, name]) => name === 'page_view')
      .map(([, , params]) => params.page_path)

    expect(paths).toEqual(['/', '/people', '/publications'])
  })

  it('sends nothing at all before initialisation', async () => {
    const analytics = await loadAnalytics({ id: ID })

    expect(analytics.trackPageView('/people')).toBe(false)
    expect(analytics.trackEvent('contact_click')).toBe(false)
    expect(window.dataLayer).toBeUndefined()
  })

  it('adds the page path to every event without being asked', async () => {
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()

    expect(
      analytics.trackEvent(analytics.EVENTS.profileLink, {
        person_id: 'wu-xu',
        profile_type: 'email',
      }),
    ).toBe(true)

    const [, name, params] = events().at(-1)
    expect(name).toBe('profile_link_click')
    expect(params).toEqual({
      page_path: window.location.pathname,
      person_id: 'wu-xu',
      profile_type: 'email',
    })
  })

  it('never throws, whatever gtag does', async () => {
    /*
     * These calls sit in click handlers on real links. An analytics failure
     * must be invisible to the person who clicked, so the only acceptable
     * behaviour is to return false.
     */
    const analytics = await loadAnalytics({ id: ID })
    analytics.initializeAnalytics()

    Object.defineProperty(window, 'dataLayer', {
      configurable: true,
      get() {
        throw new Error('blocked by an extension')
      },
    })

    expect(() => analytics.trackEvent('contact_click')).not.toThrow()
    expect(analytics.trackEvent('contact_click')).toBe(false)
    expect(analytics.trackPageView('/software')).toBe(false)

    delete window.dataLayer
  })

  it('names an event taxonomy small enough to read', async () => {
    const analytics = await loadAnalytics({ id: ID })

    expect(Object.values(analytics.EVENTS)).toEqual([
      'profile_link_click',
      'publication_link_click',
      'repository_link_click',
      'tutorial_link_click',
      'contact_click',
    ])
  })
})
