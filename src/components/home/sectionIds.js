/*
 * The ids of the home page's sections.
 *
 * Shared constants rather than literals, so the hero's "browse the methods"
 * anchor and the section it points at cannot drift apart. Plain data in its
 * own module so the component files keep exporting components only, which is
 * what React Fast Refresh needs.
 */
export const METHODS_SECTION_ID = 'methods'
export const ANALYSIS_SECTION_ID = 'analysis'
export const SOFTWARE_SECTION_ID = 'software'
export const PUBLICATIONS_SECTION_ID = 'publications'
export const GROUP_SECTION_ID = 'group'
export const CONTACT_SECTION_ID = 'contact'
