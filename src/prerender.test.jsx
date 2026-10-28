import { describe, it, expect, vi } from 'vitest'
import { act, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { prerender } from 'react-dom/static'
import { BrowserRouter } from 'react-router-dom'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import App from './app/App'
import ownAddress from './app/ownAddress'
import { siteConfig } from './app/siteConfig'
import { methods, pages, softwareRelease } from './content'
import { PageMetadataCollector } from './lib/pageMetadata'
import { setViewport } from './test/viewport'
import {
  LAZY_SOURCES,
  lazySourcesFor,
  legacyRedirects,
  render,
  structuredDataFor,
} from './entry-server'
import { buildDocument, buildRedirect, fileForPath } from '../scripts/prerender.mjs'
import { collectCanonicalPaths } from '../scripts/site-routes.mjs'

/*
 * The build-time render (src/entry-server.jsx, scripts/prerender.mjs).
 *
 * These replace the old guarantee that dist/404.html was a byte copy of
 * index.html. Pages are no longer served through the 404 fallback, so what
 * is held to account instead is what each page's own HTML file says before
 * any JavaScript runs, and that the browser can take that HTML over without
 * redrawing it. scripts/check-dist.mjs then checks the real build output.
 */

const root = process.cwd()
const canonicalPaths = await collectCanonicalPaths(resolve(root, 'src/content'))

const TEMPLATE = readFileSync(resolve(root, 'index.html'), 'utf8')

describe('every published page renders at build time', () => {
  it.each(canonicalPaths)('%s: its own content and metadata', async (path) => {
    const { html, metadata } = await render(path)

    expect(metadata.noindex).toBe(false)
    expect(metadata.canonical).toBe(`${siteConfig.url}${path}`)
    expect(metadata.description).toBeTruthy()
    if (path === '/') expect(metadata.title).toBe(siteConfig.name)
    else expect(metadata.title).toMatch(/^.+ \| TSR Research Group$/)

    /* One page heading, and the site's links, in plain HTML for a crawler. */
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('href="/publications"')
    expect(html).not.toContain('Page not found')
  })

  it('gives each page a title no other page uses', async () => {
    const titles = await Promise.all(
      canonicalPaths.map(async (path) => (await render(path)).metadata.title),
    )
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('uses the same values the browser sets, from the same content', async () => {
    const tsr = methods.find((method) => method.slug === 'tsr')
    expect((await render('/tsr')).metadata.description).toBe(tsr.summary)

    const contact = await render('/contact')
    expect(contact.metadata.title).toBe(`${pages.contact.title} | TSR Research Group`)
    expect(contact.metadata.description).toBe(pages.contact.intro)
  })

  it('renders the lazily loaded pages in full, not their empty fallback', async () => {
    expect((await render('/methods/drug-tsr')).html).toContain('Earlier settings and BioTSR')
    expect((await render('/software')).html).toContain(softwareRelease.install.replace(/"/g, '&quot;'))
    expect((await render('/software/get-started')).html).toContain('batch_summary.csv')
  })

  it('renders the 404 page as noindex, with no canonical URL', async () => {
    const { html, metadata } = await render('/404')
    expect(html).toContain('Page not found')
    expect(metadata.noindex).toBe(true)
    expect(metadata.canonical).toBeNull()
  })

  it('renders both navigation forms, since the build cannot know the width', async () => {
    const { html } = await render('/publications')
    expect(html).toContain('aria-label="Main"') // the desktop bar
    expect(html).toMatch(/<button[^>]*aria-controls="mobile-nav-drawer"/) // the drawer's trigger
  })
})

describe('lazily loaded stylesheets', () => {
  it('knows the source of every lazy() route component', () => {
    /* Each lazy(() => import('…')) under src/app needs an entry, or its
       page would be painted unstyled until its code arrived. */
    const lazyImports = []
    for (const name of readdirSync(resolve(root, 'src/app'))) {
      const file = resolve(root, 'src/app', name)
      if (statSync(file).isDirectory() || !/\.jsx?$/.test(name)) continue
      const source = readFileSync(file, 'utf8')
      for (const [, path] of source.matchAll(/lazy\(\(\) => import\('([^']+)'\)\)/g)) {
        lazyImports.push(join('src/app', path).replace(/\\/g, '/'))
      }
    }

    const known = [...LAZY_SOURCES.values()].map((source) => source.replace(/\.jsx$/, ''))
    expect(lazyImports.sort()).toEqual(known.sort())
  })

  it('maps each route to the module it loads', () => {
    expect(lazySourcesFor('/methods/drug-tsr')).toEqual(['src/components/method/MethodPage.jsx'])
    expect(lazySourcesFor('/tsr')).toEqual(['src/components/method/MethodPage.jsx'])
    expect(lazySourcesFor('/software')).toEqual(['src/pages/Software/Software.jsx'])
    expect(lazySourcesFor('/software/get-started')).toEqual(['src/pages/GetStarted/GetStarted.jsx'])
    expect(lazySourcesFor('/publications')).toEqual([])
  })
})

describe('the page document', () => {
  const page = {
    html: '<main><h1>Publications</h1></main>',
    metadata: {
      title: 'Publications | TSR Research Group',
      description: 'Papers & "preprints" <by> the group.',
      canonical: 'https://tsrmethod.github.io/publications',
      noindex: false,
    },
    prerenderedPath: '/publications',
  }

  it('writes the page’s own head over the site defaults, escaped', () => {
    const doc = buildDocument(TEMPLATE, page)

    expect(doc).toContain('<title>Publications | TSR Research Group</title>')
    expect(doc).toContain(
      '<meta name="description" content="Papers &amp; &quot;preprints&quot; &lt;by&gt; the group." />',
    )
    expect(doc).toContain('<link rel="canonical" href="https://tsrmethod.github.io/publications" />')
    expect(doc).toContain('<meta property="og:url" content="https://tsrmethod.github.io/publications" />')
    expect(doc).toContain('<meta property="og:title" content="Publications | TSR Research Group" />')
    expect(doc).toContain('<div id="root" data-prerendered="/publications"><main><h1>Publications</h1>')

    /* Exactly one of each, not a default left beside the new value. */
    expect(doc.match(/<title>/g)).toHaveLength(1)
    expect(doc.match(/rel="canonical"/g)).toHaveLength(1)
    expect(doc.match(/name="description"/g)).toHaveLength(1)
  })

  it('marks a noindex page, and gives it no canonical or og:url', () => {
    const doc = buildDocument(TEMPLATE, {
      html: '<h1>Page not found</h1>',
      metadata: { title: 'Page not found | TSR Research Group', description: 'x', canonical: null, noindex: true },
    })

    expect(doc).toContain('<meta name="robots" content="noindex" />')
    expect(doc).not.toContain('rel="canonical"')
    expect(doc).not.toContain('property="og:url"')
    expect(doc).toContain('<div id="root"><h1>Page not found</h1>')
  })

  it('adds structured data and lazy stylesheets to the head only', () => {
    const doc = buildDocument(TEMPLATE, {
      ...page,
      structuredData: [{ '@context': 'https://schema.org', name: '</script><b>' }],
      assets: ['<link rel="stylesheet" href="/assets/x.css">'],
    })
    const head = doc.slice(0, doc.indexOf('</head>'))

    expect(head).toContain('<link rel="stylesheet" href="/assets/x.css">')
    expect(head).toContain('<script type="application/ld+json">')
    /* A value cannot close the script element. */
    expect(head).toContain('\\u003c/script>\\u003cb>')
    expect(head).not.toContain('</script><b>')
  })

  it('fails rather than shipping the defaults when the template changes shape', () => {
    const broken = TEMPLATE.replace(/<link\s+rel="canonical"[^>]*>/, '')
    expect(() => buildDocument(broken, page)).toThrow(/canonical/)
  })

  it('puts each page where GitHub Pages looks for it', () => {
    expect(fileForPath('/')).toBe('index.html')
    expect(fileForPath('/software')).toBe('software.html')
    expect(fileForPath('/software/get-started')).toBe('software/get-started.html')
    expect(fileForPath('/methods/drug-tsr')).toBe('methods/drug-tsr.html')
  })
})

describe('old addresses', () => {
  it('redirects each to a published page', () => {
    expect(legacyRedirects.length).toBeGreaterThan(0)
    for (const { from, to } of legacyRedirects) {
      expect(canonicalPaths, `${from} -> ${to}`).toContain(to)
      expect(canonicalPaths).not.toContain(from)
    }
    expect(legacyRedirects).toContainEqual({ from: '/source-code', to: '/software' })
    expect(legacyRedirects).toContainEqual({ from: '/mirror-image', to: '/methods/mirror-image' })
  })

  it('leaves a draft’s alias without a redirect', () => {
    expect(legacyRedirects.some(({ from }) => from === '/keytoimage')).toBe(false)
  })

  it('writes a redirect page that keeps the #section and is not indexed', () => {
    const doc = buildRedirect('/methods/mirror-image')

    expect(doc).toContain('<meta name="robots" content="noindex" />')
    expect(doc).toContain('<link rel="canonical" href="https://tsrmethod.github.io/methods/mirror-image" />')
    expect(doc).toContain('<meta http-equiv="refresh" content="0; url=/methods/mirror-image" />')
    expect(doc).toContain('location.replace("/methods/mirror-image" + location.search + location.hash)')
    expect(doc).toContain('<a href="/methods/mirror-image">')
  })
})

describe('structured data', () => {
  it('describes the site and the group on the home page, from site settings', () => {
    const [website, organisation] = structuredDataFor('/')

    expect(website).toMatchObject({ '@type': 'WebSite', name: siteConfig.name, url: `${siteConfig.url}/` })
    expect(organisation).toMatchObject({
      '@type': 'Organization',
      name: siteConfig.name,
      email: siteConfig.email,
      sameAs: [siteConfig.github.orgUrl],
    })
  })

  it('describes BioTSR from its release record, and claims nothing else', () => {
    const [software] = structuredDataFor('/software')

    expect(software).toMatchObject({
      '@type': 'SoftwareApplication',
      name: 'BioTSR',
      softwareVersion: softwareRelease.version,
      datePublished: softwareRelease.date,
      license: softwareRelease.licence,
      downloadUrl: softwareRelease.pypiUrl,
    })
    /* No ratings, prices or identifiers the records do not hold. */
    for (const key of ['aggregateRating', 'offers', 'identifier', 'review']) {
      expect(software).not.toHaveProperty(key)
    }
    expect(JSON.stringify(software)).not.toMatch(/undefined|null/)
  })

  it('adds none to the other pages', () => {
    expect(structuredDataFor('/publications')).toEqual([])
    expect(structuredDataFor('/methods/drug-tsr')).toEqual([])
  })
})

describe('addresses in another form', () => {
  it.each([
    ['/people/', '/people'],
    ['/people.html', '/people'],
    ['/People', '/people'],
    ['/methods/drug-tsr/', '/methods/drug-tsr'],
    ['/index.html', '/'],
    ['/mirror-image/', '/mirror-image'],
  ])('sends %s to %s', (from, to) => {
    expect(ownAddress(from)).toBe(to)
  })

  it.each(['/', '/people', '/methods/drug-tsr', '/no-such-page', '/methods/key-to-image'])(
    'leaves %s alone',
    (path) => {
      expect(ownAddress(path)).toBeNull()
    },
  )
})

describe('taking the prerendered HTML over in the browser', () => {
  /*
   * Everything React reported, less one development-only warning that this
   * test cannot avoid: the server renderer and the browser renderer share
   * context objects only because they run in the same process here, which
   * never happens on the site. A hydration mismatch is reported separately,
   * to onRecoverableError and as its own console error, and still fails.
   */
  const SAME_PROCESS = /^Detected multiple renderers concurrently rendering the same context provider/
  const reportedErrors = (spy) =>
    spy.mock.calls.map((args) => String(args[0])).filter((message) => !SAME_PROCESS.test(message))

  async function hydrate(path) {
    const { html } = await render(path)

    /*
     * Test-only housekeeping. React's server renderer leaves the context
     * values of a page that suspended (a lazily loaded one) set on the
     * context objects until its next render begins, which resets them. In
     * the build that next render always comes first; here the browser
     * renderer runs next, in the same process, and would read them. An empty
     * server render clears them, as the build's next page would.
     */
    await prerender(<></>)

    window.history.replaceState(null, '', path)
    document.body.innerHTML = `<div id="root" data-prerendered="${path}">${html}</div>`
    const container = document.getElementById('root')

    const recoverable = []
    const consoleError = vi.spyOn(console, 'error')
    let rootHandle
    await act(async () => {
      rootHandle = hydrateRoot(
        container,
        <StrictMode>
          <PageMetadataCollector value={null}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </PageMetadataCollector>
        </StrictMode>,
        { onRecoverableError: (error) => recoverable.push(error) },
      )
    })
    return { container, recoverable, consoleError, unmount: () => act(() => rootHandle.unmount()) }
  }

  it.each(['/', '/publications', '/contact', '/methods/drug-tsr', '/software/get-started'])(
    '%s hydrates without a mismatch',
    async (path) => {
      setViewport('desktop')
      const { container, recoverable, consoleError, unmount } = await hydrate(path)

      /* The lazily loaded page finishes hydrating once its module resolves. */
      await screen.findByRole('heading', { level: 1 })
      await act(async () => {})

      expect(recoverable).toEqual([])
      expect(reportedErrors(consoleError)).toEqual([])

      /* And then measures the screen: one navigation form, not both. */
      expect(container.querySelectorAll('nav[aria-label="Main"]')).toHaveLength(1)
      expect(screen.queryByRole('button', { name: 'Menu' })).toBeNull()

      unmount()
    },
  )

  it('keeps what was already painted on screen visible', async () => {
    setViewport('desktop')
    const { container, unmount } = await hydrate('/')
    await act(async () => {})

    /* jsdom lays nothing out, so every element measures as on screen. */
    const hidden = container.querySelectorAll('[data-reveal="hidden"]')
    expect(hidden).toHaveLength(0)
    unmount()
  })

  it('sends one page view, and loads the analytics tag once', async () => {
    /*
     * The prerendered HTML carries no analytics tag (check-dist enforces
     * that); it is added at run time, as before. Taking a page over must not
     * count the landing twice. Last in the file: the analytics module stays
     * initialised once started.
     */
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST000000')
    window.dataLayer = []
    setViewport('desktop')

    const { unmount } = await hydrate('/publications')
    await screen.findByRole('heading', { level: 1 })
    await act(async () => {})

    const views = window.dataLayer.filter((entry) => entry[0] === 'event' && entry[1] === 'page_view')
    expect(views).toHaveLength(1)
    expect(views[0][2]).toMatchObject({ page_path: '/publications' })
    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')).toHaveLength(1)

    unmount()
    vi.unstubAllEnvs()
  })
})
