import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { siteConfig } from '../app/siteConfig'

/*
 * Per-page document metadata: title, description, canonical URL, Open Graph.
 *
 * This is a single-page app, so `index.html` ships one static set of tags and
 * every route after the first has to update them itself. Crawlers that execute
 * JavaScript (Google does) read the updated values; those that do not still
 * get the accurate site-level defaults baked into index.html.
 *
 * Kept deliberately small. There is no head-management library here: five
 * elements on a site with nine page types does not justify one, and a
 * dependency in this position would be another thing for the next maintainer
 * to learn.
 *
 *   usePageMetadata({ title: 'Publications', description: '…' })
 *     -> "Publications | TSR Research Group"
 *   usePageMetadata()
 *     -> the bare site title, which is what the home page wants
 */

/** Create the tag if it is missing, then set its content. */
function setMeta(selector, attributes, content) {
  if (!content) return

  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement(attributes.tag)
    for (const [name, value] of Object.entries(attributes)) {
      if (name !== 'tag') element.setAttribute(name, value)
    }
    document.head.appendChild(element)
  }

  if (attributes.tag === 'link') element.setAttribute('href', content)
  else element.setAttribute('content', content)
}

export default function usePageMetadata({ title, description } = {}) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle =
      title && title !== siteConfig.title
        ? `${title} | ${siteConfig.title}`
        : siteConfig.title

    const summary = description?.trim() || siteConfig.description

    /*
     * The canonical URL is built from the real pathname, never a wildcard, so
     * the aliases (/mirror-image, /source-code) and the 404 do not compete
     * with the pages they point at. A trailing slash is normalised away except
     * at the root, so /people and /people/ cannot be indexed as two pages.
     */
    const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
    const canonical = `${siteConfig.url}${path}`

    document.title = fullTitle

    setMeta('meta[name="description"]', { tag: 'meta', name: 'description' }, summary)
    setMeta('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }, canonical)

    setMeta('meta[property="og:title"]', { tag: 'meta', property: 'og:title' }, fullTitle)
    setMeta(
      'meta[property="og:description"]',
      { tag: 'meta', property: 'og:description' },
      summary,
    )
    setMeta('meta[property="og:url"]', { tag: 'meta', property: 'og:url' }, canonical)
  }, [title, description, pathname])
}
