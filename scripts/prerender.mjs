/*
 * Writes an HTML file for every published page, after `vite build`.
 *
 * WHY. GitHub Pages serves files, and it serves `/publications` from
 * `publications.html` with HTTP 200 (and `/software` from `software.html`
 * even though a `software/` folder sits beside it). Before this, no such
 * files existed: every address except the home page fell through to
 * `404.html`, a copy of the app shell. Readers saw the right page, because
 * the app drew it, but every response carried status 404 and the same empty
 * <div>, the same title and the same description — which is what a crawler
 * or a link preview reads.
 *
 * WHAT IT WRITES, into dist/:
 *
 *   index.html, publications.html, methods/drug-tsr.html, …
 *        one per canonical path (scripts/site-routes.mjs — the sitemap's
 *        list), holding that page's rendered content, title, description,
 *        canonical URL, Open Graph tags and any structured data;
 *   404.html
 *        the not-found page, marked noindex, for every other address, which
 *        GitHub Pages keeps answering with a real 404;
 *   mirror-image.html, commonkeys.html, source-code.html, …
 *        a small redirect page for each old address, so a bookmark answers
 *        without a 404 first.
 *
 * The app then takes each page over in the browser (see main.jsx) rather
 * than drawing it again, so navigation, menus and analytics behave exactly
 * as before.
 *
 * Run by `npm run build` after the two Vite builds; it reads the browser
 * build's index.html as its template and the server build's renderer.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { collectCanonicalPaths } from './site-routes.mjs'

const ROOT = process.cwd()
const DIST = resolve(ROOT, 'dist')
const SERVER_ENTRY = resolve(ROOT, 'node_modules/.cache/tsr-ssr/entry-server.mjs')
const SITE_ORIGIN = 'https://tsrmethod.github.io'

/** Any address no page uses; the router answers it with the 404 page. */
const NOT_FOUND_PROBE = '/404'

/** The file GitHub Pages serves for a path. */
export function fileForPath(path) {
  return path === '/' ? 'index.html' : `${path.slice(1)}.html`
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** JSON inside <script>: `<` escaped so no value can close the element. */
function jsonLd(data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">${json}</script>`
}

/*
 * Replace exactly one occurrence, or fail the build. A template that has
 * changed shape must stop the build, not ship pages that silently kept the
 * site-wide defaults.
 */
function replaceOnce(html, pattern, replacement, what) {
  const matches = html.match(new RegExp(pattern, 'g')) ?? []
  if (matches.length !== 1) {
    throw new Error(`prerender: expected one ${what} in index.html, found ${matches.length}`)
  }
  return html.replace(pattern, replacement)
}

const TAGS = {
  title: /<title>[^<]*<\/title>/,
  description: /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
  canonical: /<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/,
  ogTitle: /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/,
  ogDescription: /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
  ogUrl: /<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/,
  root: /<div id="root"><\/div>/,
}

/**
 * One page's document: the template with its head and body filled in.
 *
 * `prerenderedPath` is written on the root element so the browser knows
 * which page the HTML is for, and hydrates it only at that address.
 */
export function buildDocument(
  template,
  { html, metadata, structuredData = [], assets = [], prerenderedPath },
) {
  const { title, description, canonical, noindex } = metadata
  let doc = template

  doc = replaceOnce(doc, TAGS.title, `<title>${escapeHtml(title)}</title>`, '<title>')
  doc = replaceOnce(
    doc,
    TAGS.description,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    'description',
  )
  doc = replaceOnce(
    doc,
    TAGS.ogTitle,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    'og:title',
  )
  doc = replaceOnce(
    doc,
    TAGS.ogDescription,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    'og:description',
  )

  if (noindex) {
    doc = replaceOnce(doc, TAGS.canonical, '<meta name="robots" content="noindex" />', 'canonical')
    doc = replaceOnce(doc, TAGS.ogUrl, '', 'og:url')
  } else {
    doc = replaceOnce(
      doc,
      TAGS.canonical,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
      'canonical',
    )
    doc = replaceOnce(
      doc,
      TAGS.ogUrl,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
      'og:url',
    )
  }

  if (assets.length > 0) {
    doc = doc.replace('</head>', `    ${assets.join('\n    ')}\n  </head>`)
  }

  if (structuredData.length > 0) {
    doc = doc.replace('</head>', `    ${structuredData.map(jsonLd).join('\n    ')}\n  </head>`)
  }

  const marker = prerenderedPath ? ` data-prerendered="${escapeHtml(prerenderedPath)}"` : ''
  return replaceOnce(doc, TAGS.root, `<div id="root"${marker}>${html}</div>`, 'root element')
}

/**
 * The page left at an old address.
 *
 * Static HTML, no app: it forwards at once, keeping any #section the old
 * link carried, and falls back to a plain link. noindex and a canonical
 * pointing at the new address tell a crawler which of the two to keep.
 */
export function buildRedirect(to) {
  const target = `${SITE_ORIGIN}${to}`
  const path = escapeHtml(to)

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>This page has moved | TSR Research Group</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${escapeHtml(target)}" />
    <meta http-equiv="refresh" content="0; url=${path}" />
    <script>location.replace(${JSON.stringify(to).replace(/</g, '\\u003c')} + location.search + location.hash)</script>
  </head>
  <body>
    <p>This page has moved to <a href="${path}">${escapeHtml(target)}</a>.</p>
  </body>
</html>
`
}

/**
 * <link> tags for a lazily loaded module: its stylesheets, and its code as a
 * modulepreload so React can take the page over sooner. Follows the module's
 * own static imports, and leaves out anything the template already links.
 */
export function lazyAssetTags(manifest, sources, template) {
  const css = new Set()
  const js = new Set()

  const visit = (key, isRoot) => {
    const chunk = manifest[key]
    if (!chunk) throw new Error(`prerender: ${key} is not in the build manifest`)
    if (!isRoot && chunk.isEntry) return
    js.add(`/${chunk.file}`)
    for (const file of chunk.css ?? []) css.add(`/${file}`)
    for (const imported of chunk.imports ?? []) visit(imported, false)
  }
  for (const source of sources) visit(source, true)

  const absent = (href) => !template.includes(`"${href}"`)
  return [
    ...[...css].filter(absent).map((href) => `<link rel="stylesheet" crossorigin href="${href}">`),
    ...[...js].filter(absent).map((href) => `<link rel="modulepreload" crossorigin href="${href}">`),
  ]
}

async function write(relativePath, contents, written) {
  if (written.has(relativePath)) {
    throw new Error(`prerender: two pages want dist/${relativePath}`)
  }
  written.add(relativePath)

  const file = resolve(DIST, relativePath)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, contents)
}

export async function prerender() {
  if (!existsSync(SERVER_ENTRY)) {
    throw new Error(`prerender: no server build at ${SERVER_ENTRY}; run the build script`)
  }

  const template = await readFile(resolve(DIST, 'index.html'), 'utf8')
  if (!TAGS.root.test(template)) {
    throw new Error('prerender: dist/index.html is already prerendered; run `npm run build`')
  }
  const manifestDir = resolve(DIST, '.vite')
  const manifest = JSON.parse(await readFile(resolve(manifestDir, 'manifest.json'), 'utf8'))
  const server = await import(pathToFileURL(SERVER_ENTRY).href)
  const paths = await collectCanonicalPaths(resolve(ROOT, 'src/content'))
  const written = new Set()

  for (const path of paths) {
    const { html, metadata } = await server.render(path)

    /* Every sitemap URL must be a real page, not the 404 drawn at its address. */
    if (metadata.noindex || !metadata.title) {
      throw new Error(`prerender: ${path} is in the sitemap but did not render a page`)
    }

    const doc = buildDocument(template, {
      html,
      metadata,
      structuredData: server.structuredDataFor(path),
      assets: lazyAssetTags(manifest, server.lazySourcesFor(path), template),
      prerenderedPath: path,
    })
    await write(fileForPath(path), doc, written)
  }

  /*
   * The 404 page is drawn afresh in the browser rather than hydrated: it is
   * served for every unknown address, and the router may yet decide the
   * address is a page in another form (see main.jsx).
   */
  const notFound = await server.render(NOT_FOUND_PROBE)
  if (!notFound.metadata.noindex) {
    throw new Error(`prerender: ${NOT_FOUND_PROBE} is expected to be the 404 page`)
  }
  await write('404.html', buildDocument(template, { ...notFound }), written)

  for (const { from, to } of server.legacyRedirects) {
    await write(fileForPath(from), buildRedirect(to), written)
  }

  /* Build information, not part of the site. */
  await rm(manifestDir, { recursive: true, force: true })

  console.log(
    `prerender: ${paths.length} pages, 404.html, ${server.legacyRedirects.length} redirects`,
  )
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  await prerender()
}
