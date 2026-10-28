import { siteConfig } from '../app/siteConfig'
import { softwareRelease, repositories } from '../content'

/*
 * schema.org structured data, written into the prerendered HTML.
 *
 * Only what the site already states and the records already hold: the
 * group's name, address, contact email and GitHub organisation, and BioTSR's
 * release record. Nothing is added to make a search result richer — no
 * ratings, no prices, no dates or people that the records do not contain —
 * because structured data is a claim like any other, just one that readers
 * never see.
 *
 * Two pages carry it. The home page describes the site and the group; the
 * BioTSR page describes the released package. A method page is an
 * explanation backed by a cited paper, and the paper's own publisher already
 * publishes that paper's metadata, so these pages repeat none of it.
 */

const absolute = (path) => `${siteConfig.url}${path}`

function homeData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.name,
      url: absolute('/'),
      description: siteConfig.description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: siteConfig.name,
      url: absolute('/'),
      logo: absolute('/images/brand/tsr-mark.png'),
      email: siteConfig.email,
      sameAs: [siteConfig.github.orgUrl],
    },
  ]
}

function softwareData() {
  if (!softwareRelease) return []

  const record = repositories.find((repository) => repository.id === softwareRelease.id)
  const authors = record?.citation?.authors ?? []

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: softwareRelease.name,
      description: record?.description,
      url: absolute('/software'),
      softwareVersion: softwareRelease.version,
      datePublished: softwareRelease.date,
      operatingSystem: softwareRelease.platforms,
      license: softwareRelease.licence,
      downloadUrl: softwareRelease.pypiUrl,
      sameAs: [softwareRelease.repositoryUrl, softwareRelease.pypiUrl],
      author: authors.map((author) => ({
        '@type': 'Person',
        givenName: author.given,
        familyName: author.family,
      })),
    },
  ]
}

/** The structured data for one canonical path; empty for most pages. */
export function structuredDataFor(pathname) {
  if (pathname === '/') return homeData()
  if (pathname === '/software') return softwareData()
  return []
}
