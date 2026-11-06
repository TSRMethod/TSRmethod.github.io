/*
 * Where the Learn BioTSR resources live, and the facts about them that are
 * not prose: addresses, file sizes, durations. The page's words are in
 * pages.json under "learn".
 *
 * Two kinds of address, kept apart on purpose (see docs/DEPLOYMENT.md,
 * "Learning resources"):
 *
 *   - pages a visitor reads, as hand-written HTML files under public/software/,
 *     at extensionless addresses next to /software/get-started. They are in
 *     the sitemap. They are not React routes, so links to them are ordinary
 *     <a> elements and the browser loads them whole;
 *   - files a visitor downloads or plays, under public/learn-files/, a folder
 *     no page address shares, so it can never shadow /software/learn. They
 *     are not in the sitemap.
 *
 * src/learn.test.js checks that every file named here exists, at the size
 * written here.
 */

/** Hand-written learning pages: [path, file under public/]. */
export const LEARNING_PAGES = {
  lesson: {
    path: '/software/four-triangles-one-key',
    file: 'software/four-triangles-one-key.html',
  },
  notebookPreview: {
    path: '/software/first-10-minutes',
    file: 'software/first-10-minutes.html',
  },
}

export const NOTEBOOK = {
  href: '/learn-files/biotsr-first-10-minutes.ipynb',
  file: 'learn-files/biotsr-first-10-minutes.ipynb',
  /** The name a visitor's browser saves it under. */
  downloadName: 'biotsr-first-10-minutes.ipynb',
  bytes: 38090,
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
