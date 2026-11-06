/*
 * Where the Learn BioTSR resources live, and the facts about them that are
 * not prose: addresses, file sizes, dates. The Learn page's words are in
 * pages.json under "learn".
 *
 * The lesson and the notebook's recorded run are ordinary routes of the app,
 * under BioTSR → Learn BioTSR. Files a visitor downloads or plays live under
 * public/learn-files/, a folder no page address shares, and are not in the
 * sitemap (see docs/DEPLOYMENT.md, "Learning resources"). src/learn.test.js
 * checks that every file named here exists, at the size written here.
 */

/** The two pages the Learn BioTSR page introduces. Both are routes in the app. */
export const LEARNING_PAGES = {
  lesson: { path: '/software/four-triangles-one-key' },
  notebookPreview: { path: '/software/first-10-minutes' },
}

export const NOTEBOOK = {
  href: '/learn-files/biotsr-first-10-minutes.ipynb',
  file: 'learn-files/biotsr-first-10-minutes.ipynb',
  /** The name a visitor's browser saves it under. */
  downloadName: 'biotsr-first-10-minutes.ipynb',
  bytes: 38090,
  /** When the stored outputs were recorded, from a clean environment. */
  recordedOn: '2026-11-05',
}

/*
 * The video, once its corrected render exists (see the PR that added this
 * page). Until then there is no Watch section: the page starts with Explore,
 * and nothing links to a video. Shape, when set:
 *
 *   {
 *     heading, intro, credits,           words that belong to this render
 *     src, poster, captions, chapters,   paths under /learn-files/
 *     bytes, durationSeconds, width, height,
 *     transcript: [{ time, speech, screen }],
 *     chapterList: [{ time, title }],
 *   }
 */
export const VIDEO = null
