/*
 * The site's icon set: three inline SVGs, drawn once, used where needed.
 *
 * No icon library. Two or three glyphs do not justify a dependency — the
 * lightest packaged option still adds a runtime and a build-time tree-shaking
 * assumption to save about forty lines of markup, and every icon here is a
 * path that will not change.
 *
 * Each icon is DECORATIVE: `aria-hidden` and `focusable="false"`, with no
 * title element. The accessible name belongs to the control around it, which
 * knows who or what it points at; a name on the glyph as well would make a
 * screen reader announce the link twice.
 *
 * `currentColor` throughout, so an icon takes the colour of the link it sits
 * in and every hover and focus state is handled by the surrounding CSS.
 */

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: 'false',
}

export function EmailIcon(props) {
  return (
    <svg {...base} fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 7 8.15 5.6a1.5 1.5 0 0 0 1.7 0L21 7" strokeLinecap="round" />
    </svg>
  )
}

/*
 * Google Scholar's mark: a graduation cap over an open arc. Drawn as filled
 * shapes rather than traced from the brand asset, which is not ours to ship.
 */
export function ScholarIcon(props) {
  return (
    <svg {...base} fill="currentColor" {...props}>
      <path d="M12 3 1.5 8.6 12 14.2l8.4-4.48v5.66h1.85V8.6z" />
      <path d="M5.3 12.65v3.4c0 1.9 3 3.44 6.7 3.44s6.7-1.54 6.7-3.44v-3.4L12 16.06z" />
    </svg>
  )
}

export function LinkedInIcon(props) {
  return (
    <svg {...base} fill="currentColor" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M2.75 21h4.46V9.5H2.75z" />
      <path d="M9.75 9.5H14v1.57a4.6 4.6 0 0 1 4.14-2.07c3.06 0 4.36 1.9 4.36 5.2V21h-4.46v-6.1c0-1.6-.57-2.53-1.94-2.53-1.16 0-1.8.75-2.1 1.48-.11.26-.14.62-.14.99V21H9.75z" />
    </svg>
  )
}
