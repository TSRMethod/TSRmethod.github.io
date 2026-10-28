import { createContext } from 'react'
import { siteConfig } from '../app/siteConfig'

/*
 * What a page says about itself to browsers, crawlers and link previews.
 *
 * One function, used in two places, so the two cannot disagree:
 *
 *   - in the browser, usePageMetadata applies it to <head> on every route;
 *   - at build time, the prerender writes it into each page's HTML file, which
 *     is what a crawler or a link preview reads before any JavaScript runs.
 *
 *   buildPageMetadata({ title: 'Publications', pathname: '/publications' })
 *     -> { title: 'Publications | TSR Research Group', canonical: '…/publications', … }
 */

/** The social preview image, 1200 × 630, shared by every page. */
export const SOCIAL_IMAGE = {
  path: '/share/social-card.png',
  width: 1200,
  height: 630,
  alt: 'TSR Research Group: alignment-free comparison of 3D protein structures.',
}

/**
 * The canonical form of a path: no trailing slash except at the root.
 *
 * /people and /people/ must not be indexed as two pages, and GitHub Pages
 * serves only the first of them (see docs/DEPLOYMENT.md).
 */
export function canonicalPathname(pathname) {
  if (!pathname || pathname === '/') return '/'
  return pathname.replace(/\/+$/, '') || '/'
}

export function buildPageMetadata({ title, description, pathname, noindex = false }) {
  const fullTitle =
    title && title !== siteConfig.title
      ? `${title} | ${siteConfig.title}`
      : siteConfig.title

  const path = canonicalPathname(pathname)

  return {
    title: fullTitle,
    description: description?.trim() || siteConfig.description,
    /*
     * Built from the real pathname, never a wildcard, so the aliases
     * (/mirror-image, /source-code) do not compete with the pages they point
     * at. A page that must not be indexed — the 404 — has no canonical at
     * all: there is no URL it is the canonical version of.
     */
    canonical: noindex ? null : `${siteConfig.url}${path}`,
    noindex,
  }
}

/*
 * Server-side only: where a page's usePageMetadata call leaves its values
 * during the build-time render, since effects do not run there. In the
 * browser there is no provider, and the hook writes to <head> instead.
 */
export const PageMetadataCollector = createContext(null)
