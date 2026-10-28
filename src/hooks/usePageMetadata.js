import { useContext, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { buildPageMetadata, PageMetadataCollector } from '../lib/pageMetadata'

/*
 * Per-page document metadata: title, description, canonical URL, Open Graph.
 *
 * Every published page is prerendered at build time (scripts/prerender.mjs),
 * so its HTML file already carries these values for crawlers and link
 * previews that do not run JavaScript. The build gets them from this same
 * hook: during the server render there is a collector in context, and the
 * hook records its values there. In the browser there is none, and the hook
 * updates <head> as the reader moves between routes.
 *
 * Kept deliberately small. There is no head-management library here: a
 * handful of elements on a site with nine page types does not justify one,
 * and a dependency in this position would be another thing for the next
 * maintainer to learn.
 *
 *   usePageMetadata({ title: 'Publications', description: '…' })
 *     -> "Publications | TSR Research Group"
 *   usePageMetadata()
 *     -> the bare site title, which is what the home page wants
 *   usePageMetadata({ title: 'Page not found', noindex: true })
 *     -> robots noindex, and no canonical URL
 */

/** Create the tag if it is missing, then set its content. */
function setMeta(selector, attributes, content) {
  let element = document.head.querySelector(selector)

  if (!content) {
    element?.remove()
    return
  }

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

export default function usePageMetadata({ title, description, noindex = false } = {}) {
  const { pathname } = useLocation()
  const collector = useContext(PageMetadataCollector)

  /*
   * Build time only. Recording during render is safe here because the
   * collector belongs to this one render of this one page, and nothing reads
   * it until the render has finished.
   */
  if (collector) {
    Object.assign(collector, buildPageMetadata({ title, description, pathname, noindex }))
  }

  useEffect(() => {
    const metadata = buildPageMetadata({ title, description, pathname, noindex })

    document.title = metadata.title

    setMeta('meta[name="description"]', { tag: 'meta', name: 'description' }, metadata.description)
    setMeta('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }, metadata.canonical)
    setMeta('meta[name="robots"]', { tag: 'meta', name: 'robots' }, noindex ? 'noindex' : null)

    setMeta('meta[property="og:title"]', { tag: 'meta', property: 'og:title' }, metadata.title)
    setMeta(
      'meta[property="og:description"]',
      { tag: 'meta', property: 'og:description' },
      metadata.description,
    )
    setMeta('meta[property="og:url"]', { tag: 'meta', property: 'og:url' }, metadata.canonical)
  }, [title, description, pathname, noindex])
}
