/*
 * Central site configuration.
 *
 * This is the single source of truth for identity, contact details and
 * outbound links. Nothing in this file should be duplicated inside a
 * component — import from here instead.
 *
 * Note for maintainers: values that a non-technical editor may eventually need
 * to change (group email, GitHub organisation, affiliations) are intended to
 * move into `src/content/site.json` in Stage 3, at which point this module
 * becomes a thin typed wrapper around that data. Keeping them here for now
 * means there is exactly one place to update in the meantime.
 */

export const siteConfig = {
  name: 'TSR Research Group',
  shortName: 'TSR',
  title: 'TSR Research Group',
  description:
    'The Triangular Spatial Relationship (TSR) method: alignment-free comparison ' +
    'of 3D protein structures, TSR-derived methods, and open-source Python tools.',
  url: 'https://tsrmethod.github.io',

  /*
   * Public contact address for the research group.
   * This is the ONLY place this address should appear in the codebase.
   */
  email: 'tsrresearchgroup@gmail.com',

  /* GitHub organisation that owns this website repository. */
  github: {
    org: 'TSRMethod',
    orgUrl: 'https://github.com/TSRMethod',
    websiteRepo: 'https://github.com/TSRMethod/TSRmethod.github.io',
    /* Where users are sent to report a problem with the software or site. */
    issuesUrl: 'https://github.com/TSRMethod/TSRmethod.github.io/issues',
  },

  /*
   * Institutions and computing resources credited in the footer.
   * Replaces the standalone /community route from the previous site.
   */
  affiliations: [
    {
      id: 'ull',
      name: 'University of Louisiana at Lafayette',
      url: 'https://www.louisiana.edu/',
    },
    {
      id: 'loni',
      name: 'Louisiana Optical Network Infrastructure (LONI)',
      url: 'https://loni.org/',
    },
  ],
}

/** Convenience helper so components never hand-build a mailto string. */
export function mailtoHref(subject) {
  const base = `mailto:${siteConfig.email}`
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base
}

export default siteConfig
