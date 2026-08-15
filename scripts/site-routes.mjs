/*
 * The site's canonical public URLs, read straight from the content files.
 *
 * Used to generate sitemap.xml during the build. It cannot import the app's
 * route table: that is JSX and uses `import.meta.glob`, neither of which
 * plain Node can load.
 *
 * So the rules are restated here — and then held to account. `sitemap.test.js`
 * imports BOTH this and the real route registry and asserts they agree, so if
 * routing ever changes without this following, the test fails rather than the
 * sitemap quietly advertising pages that no longer exist.
 *
 * What is deliberately absent, and must stay absent:
 *
 *   - draft methods and analysis pages (no route, and unreviewed science);
 *   - legacy aliases such as /mirror-image and /source-code — they redirect,
 *     so listing them would offer a crawler two URLs for one page;
 *   - retired addresses such as /problems and /community, which 404;
 *   - the 404 page itself.
 */
import { readdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { load as parseYaml } from 'js-yaml'

/** Mirrors ROUTE_PREFIX in src/content/index.js. */
const ROUTE_PREFIX = { core: '', method: '/methods', analysis: '/analysis' }

/** Hand-built pages, in the order they appear in the route table. */
export const STATIC_PATHS = [
  '/',
  '/publications',
  '/people',
  '/software',
  '/contact',
]

async function readFrontmatter(path) {
  const raw = await readFile(path, 'utf8')
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  return match ? (parseYaml(match[1]) ?? {}) : {}
}

/** Every published method and analysis page, as canonical paths. */
export async function collectContentPaths(contentDir) {
  const paths = []

  for (const folder of ['methods', 'analysis']) {
    const dir = join(contentDir, folder)
    if (!existsSync(dir)) continue

    for (const name of (await readdir(dir)).sort()) {
      if (!name.endsWith('.md')) continue

      const data = await readFrontmatter(join(dir, name))
      if (data.status !== 'published') continue

      const prefix = ROUTE_PREFIX[data.category]
      if (prefix === undefined) continue

      const slug = data.slug ?? name.replace(/\.md$/, '')
      paths.push(`${prefix}/${slug}`)
    }
  }

  return paths
}

/** Static pages plus published content, deduplicated and ordered. */
export async function collectCanonicalPaths(contentDir) {
  const content = await collectContentPaths(contentDir)
  return [...new Set([...STATIC_PATHS, ...content])]
}

/**
 * The sitemap document.
 *
 * No `lastmod`, `changefreq` or `priority`. A build timestamp would claim
 * every page changed whenever anything did, which is worse than saying
 * nothing, and Google ignores the other two.
 */
export function renderSitemap(paths, origin) {
  const urls = paths
    .map((path) => `  <url>\n    <loc>${origin}${path}</loc>\n  </url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}

export { ROUTE_PREFIX }
