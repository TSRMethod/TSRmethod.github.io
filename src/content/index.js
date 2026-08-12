import { parseFrontmatter, ContentError } from '../lib/frontmatter'
import { extractHeadings } from '../lib/toc'

import siteData from './site.json'

/*
 * The content registry.
 *
 * Every Markdown file in ./methods is read at build time, validated, and
 * turned into an entry. Nothing else in the application reads content files
 * directly — components import from here.
 *
 * Loading uses `import.meta.glob(..., { eager: true })`, so:
 *   - content is bundled, not fetched, and cannot 404 at runtime;
 *   - adding a file is enough to register a page, with no index to update;
 *   - a malformed file fails the build rather than reaching a visitor.
 */

const STATUSES = ['published', 'draft']
const CATEGORIES = ['core', 'method', 'analysis']

/* Where each category lives in the URL space. */
const ROUTE_PREFIX = {
  core: '',
  method: '/methods',
  analysis: '/analysis',
}

/*
 * Content lives in two folders, but is ONE registry.
 *
 *   methods/   the TSR method and its derivatives
 *   analysis/  downstream key analysis, visualisation and modelling tools
 *
 * The split is editorial, not technical: it gives Pages CMS two sensible
 * lists instead of one long mixed one, and keeps a folder listing readable.
 * Routing, validation, navigation and the publication gate are identical for
 * both — a second route system would be duplication for naming's sake.
 *
 * `category` in the frontmatter still decides the URL. The folder must agree
 * with it (checked in buildMethod), so a file cannot sit in one folder and
 * claim to be the other.
 */
const rawFiles = {
  ...import.meta.glob('./methods/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  ...import.meta.glob('./analysis/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
}

/** Which folder each category belongs in. */
const CATEGORY_FOLDER = {
  core: 'methods',
  method: 'methods',
  analysis: 'analysis',
}

function requireString(data, field, source) {
  const value = data[field]
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ContentError(source, `"${field}" is required and must be text`)
  }
  return value.trim()
}

function requireOneOf(data, field, allowed, source) {
  const value = requireString(data, field, source)
  if (!allowed.includes(value)) {
    throw new ContentError(
      source,
      `"${field}" must be one of ${allowed.join(', ')} — got "${value}"`,
    )
  }
  return value
}

function validateFigure(figure, source, { requireAlt = true } = {}) {
  if (!figure) return null
  // A figure with no image is a mistake at any status.
  if (!figure.src) throw new ContentError(source, 'figure needs a "src"')

  /*
   * Alt text is mandatory to publish, not optional politeness — the previous
   * site shipped figures whose alt text described a different method.
   *
   * It is only enforced at publication so that an editor who uploads an image
   * and saves a draft before writing the description does not break the build
   * for the whole site. The CMS marks the field required, so they are
   * prompted for it either way.
   */
  if (requireAlt && !figure.alt?.trim()) {
    throw new ContentError(
      source,
      'figure needs "alt" text describing what the image shows before this ' +
        'page can be published',
    )
  }

  return {
    src: figure.src,
    alt: figure.alt?.trim() ?? '',
    caption: figure.caption ?? null,
  }
}

function validateRepositories(repositories, source) {
  if (!repositories) return []
  if (!Array.isArray(repositories)) {
    throw new ContentError(source, '"repositories" must be a list')
  }
  return repositories.map((repo, index) => {
    if (!repo?.name || !repo?.url) {
      throw new ContentError(
        source,
        `repositories[${index}] needs both "name" and "url"`,
      )
    }
    return {
      name: repo.name,
      url: repo.url,
      description: repo.description ?? null,
      language: repo.language ?? null,
    }
  })
}

function validatePaper(paper, source) {
  if (!paper) return null
  if (!paper.doi && !paper.url) {
    throw new ContentError(source, '"paper" needs either a "doi" or a "url"')
  }
  return {
    title: paper.title ?? null,
    authors: paper.authors ?? null,
    journal: paper.journal ?? null,
    year: paper.year ?? null,
    // Optional bibliographic detail, shown after the journal when present.
    volume: paper.volume ?? null,
    issue: paper.issue ?? null,
    pages: paper.pages ?? null,
    doi: paper.doi ?? null,
    url: paper.url ?? (paper.doi ? `https://doi.org/${paper.doi}` : null),
  }
}

/** "Journal, 2026, 23(2), 694–703" — omitting whatever is absent. */
export function formatCitation(paper) {
  if (!paper) return ''

  const parts = []
  if (paper.journal) parts.push(paper.journal)
  if (paper.year) parts.push(String(paper.year))

  if (paper.volume) {
    parts.push(paper.issue ? `${paper.volume}(${paper.issue})` : `${paper.volume}`)
  }
  if (paper.pages) parts.push(paper.pages)

  return parts.join(', ')
}

/*
 * Slurm content is the one part of a method page held as structured fields
 * rather than free Markdown, because a reusable SlurmGuide component (Stage 4)
 * needs named slots: the job script, the submission command, and the notes
 * around them. Every value here stays package-specific and lives in content —
 * the component supplies presentation only and hard-codes no resource values.
 */
function validateSlurm(slurm, source) {
  if (!slurm) return null

  const script = slurm.script
  if (!script?.code || !script.code.trim()) {
    throw new ContentError(source, 'slurm needs "script.code" (the job script)')
  }
  if (!slurm.submit?.code || !slurm.submit.code.trim()) {
    throw new ContentError(
      source,
      'slurm needs "submit.code" (the command that queues the job)',
    )
  }

  return {
    intro: slurm.intro ?? null,
    script: {
      language: script.language ?? 'bash',
      filename: script.filename ?? null,
      code: script.code.replace(/\s+$/, ''),
    },
    submit: {
      language: slurm.submit.language ?? 'bash',
      code: slurm.submit.code.trim(),
    },
    resources: slurm.resources ?? null,
    notes: slurm.notes ?? null,
  }
}

/*
 * Builds one method entry.
 *
 * Validation is deliberately asymmetric:
 *
 *   DRAFTS are tolerant. A method created through the CMS arrives with the
 *   editorial fields only — no slug, status, category, group or order,
 *   because those are developer-controlled and hidden from the editor. It may
 *   also be saved half-finished. A draft must never break the build: it is
 *   not routed and not linked, so an incomplete one harms nobody, whereas a
 *   hard failure would block every subsequent deployment of the whole site.
 *
 *   PUBLISHED entries are strict. Everything needed to route, place and
 *   render the page must be present, or the build fails. This is what stops a
 *   page going live half-configured.
 *
 * Structural mistakes (a figure with no `src`, a repository with no `url`)
 * always fail, draft or not — those are errors rather than absences.
 */
function buildMethod(source, raw) {
  const { data, body } = parseFrontmatter(raw, source)

  const filenameSlug = source.replace(/^.*\//, '').replace(/\.md$/, '')

  /*
   * The filename is the source of truth for the slug. Pages CMS names a new
   * file by slugifying the title, so a CMS-created draft has no `slug` key at
   * all and we derive it. When a developer has written one explicitly, it
   * must still agree — a disagreement means the URL is not predictable from
   * the file, which is the mistake the check exists to catch.
   */
  const slug = data.slug ? String(data.slug).trim() : filenameSlug

  if (data.slug && slug !== filenameSlug) {
    throw new ContentError(
      source,
      `slug "${slug}" does not match the filename "${filenameSlug}.md". ` +
        'They must agree so the URL is predictable from the file.',
    )
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    throw new ContentError(
      source,
      `slug "${slug}" must be lowercase-with-hyphens`,
    )
  }

  /* No status means not yet reviewed, so: draft. */
  const status = data.status
    ? requireOneOf(data, 'status', STATUSES, source)
    : 'draft'
  const isPublished = status === 'published'

  /* Only a published page needs to know where it lives. */
  const category = data.category
    ? requireOneOf(data, 'category', CATEGORIES, source)
    : null
  const group = data.group ? String(data.group).trim() : null

  /*
   * The folder and the category must agree. Without this a file could sit in
   * analysis/ while claiming `category: method`, and its URL would silently
   * contradict where an editor found it.
   */
  if (category) {
    const folder = source.replace(/^\.\//, '').split('/')[0]
    const expected = CATEGORY_FOLDER[category]
    if (folder !== expected) {
      throw new ContentError(
        source,
        `category "${category}" belongs in ${expected}/, not ${folder}/`,
      )
    }
  }

  if (isPublished) {
    if (!category) {
      throw new ContentError(
        source,
        'a published method needs a "category" (core, method or analysis) — ' +
          'it decides the page URL',
      )
    }
    if (!group) {
      throw new ContentError(
        source,
        'a published method needs a "group" — it decides which navigation ' +
          'section the page appears under',
      )
    }
    requireString(data, 'summary', source)
    if (body.trim() === '') {
      throw new ContentError(
        source,
        'a published method needs body content',
      )
    }
  }

  return {
    slug,
    source,
    // A title is always required: Pages CMS derives the filename from it, so
    // a file cannot meaningfully exist without one.
    title: requireString(data, 'title', source),
    shortTitle: data.shortTitle?.trim() || null,
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
    status,
    category,
    group,
    order: Number.isFinite(data.order) ? data.order : 999,
    // Null until a category is assigned, so a draft has no URL to expose.
    path: category ? `${ROUTE_PREFIX[category]}/${slug}` : null,
    figure: validateFigure(data.figure, source, { requireAlt: isPublished }),
    paper: validatePaper(data.paper, source),
    repositories: validateRepositories(data.repositories, source),
    slurm: validateSlurm(data.slurm, source),
    references: Array.isArray(data.references) ? data.references : [],
    review: data.review ?? null,
    body,
    headings: extractHeadings(body),
  }
}

function buildRegistry(files) {
  const entries = Object.entries(files)
    .map(([source, raw]) => buildMethod(source, raw))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))

  const seen = new Set()
  for (const entry of entries) {
    if (seen.has(entry.slug)) {
      throw new ContentError(entry.source, `duplicate slug "${entry.slug}"`)
    }
    seen.add(entry.slug)
  }

  return entries
}

/** Every method, published and draft, in display order. */
export const methods = buildRegistry(rawFiles)

/** Only methods cleared for publication. Draft pages must never be routed. */
export const publishedMethods = methods.filter(
  (method) => method.status === 'published',
)

/** Look up a published method by slug. Draft slugs resolve to undefined. */
export function getPublishedMethod(slug) {
  return publishedMethods.find((method) => method.slug === slug)
}

/** Published methods in one category, e.g. 'method' or 'analysis'. */
export function getPublishedMethodsByCategory(category) {
  return publishedMethods.filter((method) => method.category === category)
}

/* Exposed for tests, so the validation rules can be exercised directly. */
export { buildMethod, buildRegistry }

/*
 * Record collections: one JSON file per record, in a folder.
 *
 * A folder of files rather than one array file, because that is what Pages
 * CMS calls a collection — it gives an editor a searchable list with "add"
 * and "delete" buttons instead of one long nested form, and two people
 * editing different records no longer touch the same file.
 *
 * Display order is the `order` field, then the record's title, so it does not
 * depend on how the filesystem happens to list the directory.
 */
function loadCollection(files, label) {
  return Object.entries(files)
    .map(([source, record]) => {
      const id = source.replace(/^.*\//, '').replace(/\.json$/, '')

      if (record.id && record.id !== id) {
        throw new ContentError(
          source,
          `id "${record.id}" does not match the filename "${id}.json"`,
        )
      }

      return { ...record, id }
    })
    .sort(
      (a, b) =>
        (a.order ?? 999) - (b.order ?? 999) ||
        String(a.name ?? a.title ?? '').localeCompare(
          String(b.name ?? b.title ?? ''),
        ),
    )
    .map((record) => {
      if (!record.id) throw new ContentError(label, 'record has no id')
      return record
    })
}

export const site = siteData

export const people = loadCollection(
  import.meta.glob('./people/*.json', { import: 'default', eager: true }),
  'people',
)

export const publications = loadCollection(
  import.meta.glob('./publications/*.json', { import: 'default', eager: true }),
  'publications',
)

export const repositories = loadCollection(
  import.meta.glob('./repositories/*.json', { import: 'default', eager: true }),
  'repositories',
)
