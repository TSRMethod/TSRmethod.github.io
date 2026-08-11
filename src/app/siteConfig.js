import siteContent from '../content/site.json'

/*
 * Site configuration.
 *
 * Split deliberately into two halves:
 *
 *   1. EDITORIAL values come from `src/content/site.json` — the group name,
 *      description, contact address and affiliations. These are the things a
 *      supervisor may legitimately want to change, and site.json is what
 *      Pages CMS will expose in Stage 5.
 *
 *   2. TECHNICAL values are defined here in code — repository URLs, the
 *      deployment origin, the issues endpoint. These control routing and
 *      deployment, so they must not be editable through a CMS form.
 *
 * Components import from this module rather than reading site.json directly,
 * so the two halves present a single interface.
 */

export const siteConfig = {
  /* ---- Editorial: sourced from content, CMS-editable later ---- */
  name: siteContent.name,
  shortName: siteContent.shortName,
  title: siteContent.name,
  description: siteContent.description,
  tagline: siteContent.tagline,
  email: siteContent.email,
  affiliations: siteContent.affiliations,

  /* ---- Technical: code-only, never CMS-editable ---- */
  url: 'https://tsrmethod.github.io',
  github: {
    org: 'TSRMethod',
    orgUrl: 'https://github.com/TSRMethod',
    websiteRepo: 'https://github.com/TSRMethod/TSRmethod.github.io',
    issuesUrl: 'https://github.com/TSRMethod/TSRmethod.github.io/issues',
  },
}

/** Convenience helper so components never hand-build a mailto string. */
export function mailtoHref(subject) {
  const base = `mailto:${siteConfig.email}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}

export default siteConfig
