import { parseFrontmatter, ContentError } from '../lib/frontmatter'
import { extractHeadings } from '../lib/toc'

import siteData from './site.json'
import homeData from './home.json'
import pagesData from './pages.json'

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

/* ------------------------------------------------------------------------ *
 * Software repositories
 * ------------------------------------------------------------------------ */

const REPOSITORY_CATEGORIES = ['core', 'method', 'analysis', 'tooling']

/*
 * Whether a repository is something you install, or a set of scripts you run
 * where they sit.
 *
 * Worth a field of its own rather than a turn of phrase in each description,
 * because it is the honest distinction between the three repositories with a
 * `setup.py` and the four that are research code accompanying a paper. The
 * page says which is which, so nothing here implies a maintained release when
 * there is none.
 */
const REPOSITORY_KINDS = ['package', 'scripts']

function validateRepository(repository) {
  const source = `repositories/${repository.id}.json`

  for (const field of ['name', 'url', 'description']) {
    if (!String(repository[field] ?? '').trim()) {
      throw new ContentError(source, `"${field}" is required`)
    }
  }

  for (const [field, allowed] of [
    ['category', REPOSITORY_CATEGORIES],
    ['kind', REPOSITORY_KINDS],
  ]) {
    if (!allowed.includes(repository[field])) {
      throw new ContentError(
        source,
        `"${field}" must be one of ${allowed.join(', ')} — got "${repository[field]}"`,
      )
    }
  }

  for (const field of ['url', 'issuesUrl']) {
    const value = repository[field]
    if (value === undefined) continue
    if (!/^https:\/\/[^\s]+$/.test(value)) {
      throw new ContentError(source, `"${field}" must be an https URL`)
    }
    // The placeholder the previous site shipped on its Source Code page.
    if (value.includes('your-repo')) {
      throw new ContentError(source, `"${field}" is a placeholder URL`)
    }
  }

  return repository
}

const validatedRepositories = repositories.map(validateRepository)

/** "pooryakhajouie/TSR-Package" — read from the URL, never stored twice. */
export function repositoryPath(url) {
  const match = /^https:\/\/github\.com\/([^/]+\/[^/]+?)\/?$/.exec(url)
  return match ? match[1] : null
}

function sameRepository(a, b) {
  return String(a).replace(/\/+$/, '') === String(b).replace(/\/+$/, '')
}

/**
 * The published pages a repository provides the code for.
 *
 * DERIVED by matching the repository's URL against the `repositories` block
 * already in each method's frontmatter, rather than stored a second time on
 * the repository record. Two consequences worth having: the software page and
 * the method pages cannot disagree about which code implements what, and a
 * draft page is invisible here for free — `publishedMethods` excludes it, so
 * Key to 2D Image cannot be reached through a repository card while its
 * content is unreviewed.
 */
export function getPagesForRepository(url, methods = publishedMethods) {
  return methods.filter((method) =>
    method.repositories.some((repository) =>
      sameRepository(repository.url, url),
    ),
  )
}

/**
 * Repositories in one category, in display order.
 *
 * The software page asks for the categories it wants to show; nothing here
 * knows what those are called or what order they appear in. That is what lets
 * a future organisation-owned package take over the `core` category by editing
 * one JSON file, with no change to the page.
 */
export function getRepositoriesByCategory(
  category,
  records = validatedRepositories,
) {
  return records.filter((repository) => repository.category === category)
}

/* ------------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------------ */

const PERSON_STATUSES = ['current', 'former']

/*
 * Where a portrait may live, as a path in the served site.
 *
 * TWO locations, because there are two ways a portrait legitimately arrives:
 *
 *   /images/people/   curated by a developer — the migrated portraits, sized
 *                     and converted to webp by hand.
 *   /images/uploads/  written by Pages CMS. This is `media.output` in
 *                     .pages.yml, so it is the only path the CMS can produce,
 *                     and a supervisor changing someone's photo through the
 *                     editor will always land here.
 *
 * Anything else is rejected: an absolute `http://` URL would put a third-party
 * request on the page and break if that host goes away, and a path outside
 * `public/` cannot be served at all. `..` is refused even under an allowed
 * prefix, so a traversal cannot smuggle its way past the prefix check.
 */
export const PHOTO_ROOTS = ['/images/people/', '/images/uploads/']

/** Is `photo` a root-relative path inside one of the approved folders? */
export function isApprovedPhotoPath(photo) {
  if (typeof photo !== 'string') return false
  if (photo.split('/').includes('..')) return false
  return PHOTO_ROOTS.some((root) => photo.startsWith(root))
}

/*
 * Optional fields are ABSENT, never empty.
 *
 * The previous site stored `phone: ''` and `email: ''` for nine people and
 * rendered "Phone:" followed by nothing, plus a `mailto:` link pointing at no
 * address. Rejecting the empty string here means a component can simply ask
 * "is there an email?" and trust the answer, and an editor who clears a field
 * in the CMS gets a build failure rather than a broken link on the live site.
 */
function validatePerson(person) {
  const source = `people/${person.id}.json`

  if (!person.name?.trim()) throw new ContentError(source, '"name" is required')
  if (!person.role?.trim()) throw new ContentError(source, '"role" is required')

  const status = person.status ?? 'current'
  if (!PERSON_STATUSES.includes(status)) {
    throw new ContentError(
      source,
      `"status" must be current or former — got "${status}"`,
    )
  }

  for (const field of ['email', 'photo', 'bio', 'affiliation']) {
    if (field in person && !String(person[field]).trim()) {
      throw new ContentError(
        source,
        `"${field}" is empty. Leave the field out entirely instead — an empty ` +
          'value renders as a dangling label or a link to nowhere.',
      )
    }
  }

  if (person.photo && !isApprovedPhotoPath(person.photo)) {
    throw new ContentError(
      source,
      `"photo" is "${person.photo}". It must be a path inside ` +
        `${PHOTO_ROOTS.join(' or ')} — uploads through the CMS already are.`,
    )
  }

  return { ...person, status }
}

const validatedPeople = people.map(validatePerson)

/** Group members, in display order, split by whether they are still here. */
export const currentPeople = validatedPeople.filter(
  (person) => person.status === 'current',
)
export const formerPeople = validatedPeople.filter(
  (person) => person.status === 'former',
)

/**
 * Faculty who lead the group.
 *
 * Derived from `group`, not from a second hand-maintained list, so nobody can
 * be shown as faculty on the home page while their record says otherwise.
 */
export const facultyPeople = currentPeople.filter(
  (person) => person.group === 'faculty',
)

/* ------------------------------------------------------------------------ *
 * Publications
 * ------------------------------------------------------------------------ */

/**
 * The publications list as it is displayed: newest first.
 *
 * `id` is the final tie-break so the order is total and deterministic — two
 * papers from the same year with the same `order` cannot swap places between
 * builds. `id` is unique by construction, because it is the filename.
 */
export const publicationsByYear = [...publications].sort(
  (a, b) =>
    (b.year ?? 0) - (a.year ?? 0) ||
    (a.order ?? 999) - (b.order ?? 999) ||
    a.id.localeCompare(b.id),
)

/*
 * One record per paper.
 *
 * A single paper legitimately supports several method pages — the DrugTSR
 * paper is cited by both DrugTSR and Key to 2D Image — but it must appear in
 * this collection once. Two records for one DOI would show the paper twice on
 * the publications page and make "which record do I edit?" ambiguous.
 */
const seenDois = new Map()
for (const publication of publications) {
  if (!publication.doi) continue
  const doi = publication.doi.toLowerCase()
  const first = seenDois.get(doi)
  if (first) {
    throw new ContentError(
      `publications/${publication.id}.json`,
      `DOI ${publication.doi} is already used by ${first}.json. One record per paper.`,
    )
  }
  seenDois.set(doi, publication.id)
}

/** The resolver URL for a DOI, or null when the record has none. */
export function doiUrl(doi) {
  return doi ? `https://doi.org/${doi}` : null
}

/**
 * "Frontiers in Chemistry, 2021, 8, 602291" for a publication record.
 *
 * Delegates to the same `formatCitation` used for the paper credited at the
 * top of a method page, so the two never drift into different house styles.
 * Publication records call the journal `venue`, because some of them are
 * conferences or book chapters rather than journals.
 */
export function formatPublicationCitation(publication) {
  return formatCitation({
    journal: publication.venue,
    year: publication.year,
    volume: publication.volume,
    issue: publication.issue,
    pages: publication.pages,
  })
}

/**
 * The most recent publications, for the home page.
 *
 * Deliberately derived from the year rather than an editorial "featured" flag:
 * the home page then stays current as papers are added through the CMS, with
 * nothing to remember to update, and the section heading ("Recent
 * publications") states the rule honestly. Returns fewer than `count` — or
 * none at all — if that is all there is.
 */
export function getRecentPublications(count = 3, records = publicationsByYear) {
  return records.slice(0, count)
}

/* ------------------------------------------------------------------------ *
 * Home page editorial content
 * ------------------------------------------------------------------------ */

/*
 * What the home page SAYS, and nothing about how it is arranged.
 *
 * There are no paths, component names or ordering hints in home.json: the
 * sections, their links and their layout live in React. An editor changes the
 * words; they cannot rewire the page or point a button at a route that does
 * not exist.
 *
 * Every field is required. A blank heading or a missing call-to-action label
 * would render as an empty button, so an emptied field fails the build — and
 * because deployment runs the build, the live site keeps the last good
 * version instead of publishing the gap.
 */
const HOME_SHAPE = {
  hero: ['lede', 'primaryCta', 'secondaryCta'],
  researchVision: ['heading', 'question', 'intro', 'direction'],
  introduction: ['heading', 'body', 'cta'],
  methods: ['heading', 'intro'],
  analysis: ['heading', 'intro'],
  software: ['heading', 'intro'],
  publications: ['heading', 'intro', 'cta'],
  group: ['heading', 'intro', 'cta'],
  funding: ['heading', 'primarySupport', 'computingSupport'],
  contact: ['heading', 'body', 'cta'],
}

/*
 * Expandable detail: optional as a whole, strict once present.
 *
 * The label and the paragraphs only make sense together — a label with nothing
 * behind it is a control that opens onto an empty box, and paragraphs with no
 * label cannot be reached. Either both are there or neither is, and anything
 * in between fails the build rather than shipping a dead control.
 *
 * Blank entries inside the list are rejected too: the CMS list widget adds an
 * empty row as soon as an editor clicks "add", and an unfilled one would
 * otherwise render as an empty paragraph.
 */
const HOME_DISCLOSURES = [['researchVision', 'detailsLabel', 'details']]

function validateDisclosure(block, section, labelField, listField) {
  const label = block[labelField]
  const paragraphs = block[listField]

  const hasLabel = typeof label === 'string' && label.trim() !== ''
  const hasList = Array.isArray(paragraphs) && paragraphs.length > 0

  if (!hasLabel && !hasList) return

  if (!hasLabel) {
    throw new ContentError(
      'home.json',
      `"${section}.${listField}" has content but "${section}.${labelField}" is ` +
        'empty, so there would be nothing to click to reveal it',
    )
  }

  if (!hasList) {
    throw new ContentError(
      'home.json',
      `"${section}.${labelField}" is set but "${section}.${listField}" is empty. ` +
        'Remove the label, or write the text it should reveal.',
    )
  }

  validateParagraphs(paragraphs, section, listField)
}

/** Every entry of an editorial paragraph list is prose someone has written. */
function validateParagraphs(paragraphs, section, listField) {
  paragraphs.forEach((paragraph, index) => {
    if (typeof paragraph !== 'string' || paragraph.trim() === '') {
      throw new ContentError(
        'home.json',
        `"${section}.${listField}[${index}]" is empty`,
      )
    }
  })
}

/*
 * Funding: structured awards, prose acknowledgments — never the two mixed.
 *
 * An award is three facts (who funded it, who holds it, and the identifier to
 * quote), so it is stored as three fields and the page arranges them. The
 * earlier model kept the same information as one long acknowledgment string,
 * which meant an editor had to build the layout out of line breaks — and the
 * moment they did, the rendered text no longer matched anything the site
 * could reason about. Structure belongs here; wording belongs to the editor.
 *
 * Everything below is optional as a whole and strict once present. A funding
 * section with no awards and no acknowledgments is a valid, shorter section.
 */
const AWARD_FIELDS = ['funder', 'investigators', 'grant']

function validateFunding(block) {
  const awards = requireList(block.awards, 'funding.awards')

  awards.forEach((award, index) => {
    /* The CMS adds an empty row the moment "add award" is clicked. */
    if (!award || typeof award !== 'object' || Array.isArray(award)) {
      throw new ContentError(
        'home.json',
        `"funding.awards[${index}]" is not an award. Each entry needs a ` +
          `funding organisation, its investigators and an award number.`,
      )
    }
    for (const name of AWARD_FIELDS) {
      if (typeof award[name] !== 'string' || award[name].trim() === '') {
        throw new ContentError(
          'home.json',
          `"funding.awards[${index}].${name}" is required and must not be empty`,
        )
      }
    }
  })

  const acknowledgments = requireList(
    block.acknowledgments,
    'funding.acknowledgments',
  )
  validateParagraphs(acknowledgments, 'funding', 'acknowledgments')

  /*
   * The acknowledgments get their own heading inside the disclosure, so the
   * names are not read as part of the award list. One without the other is a
   * heading over nothing, or prose that arrives unannounced.
   */
  const heading = block.acknowledgmentsHeading
  const hasHeading = typeof heading === 'string' && heading.trim() !== ''

  if (acknowledgments.length > 0 && !hasHeading) {
    throw new ContentError(
      'home.json',
      '"funding.acknowledgments" has content but ' +
        '"funding.acknowledgmentsHeading" is empty, so the paragraphs would ' +
        'run on from the award list with nothing to introduce them',
    )
  }
  if (hasHeading && acknowledgments.length === 0) {
    throw new ContentError(
      'home.json',
      '"funding.acknowledgmentsHeading" is set but ' +
        '"funding.acknowledgments" is empty. Remove the heading, or write ' +
        'the text it should introduce.',
    )
  }

  /*
   * The same rule as any other disclosure, applied across both lists: the
   * button is only shown when there is something behind it, and there must
   * never be content nobody can reach.
   */
  const label = block.detailsLabel
  const hasLabel = typeof label === 'string' && label.trim() !== ''
  const hasContent = awards.length > 0 || acknowledgments.length > 0

  if (hasContent && !hasLabel) {
    throw new ContentError(
      'home.json',
      '"funding" has awards or acknowledgments but "funding.detailsLabel" ' +
        'is empty, so there would be nothing to click to reveal them',
    )
  }
  if (hasLabel && !hasContent) {
    throw new ContentError(
      'home.json',
      '"funding.detailsLabel" is set but there are no awards and no ' +
        'acknowledgments behind it. Remove the label, or add the detail it ' +
        'should reveal.',
    )
  }
}

/** An absent list is an empty one; anything else must actually be a list. */
function requireList(value, path) {
  if (value === undefined || value === null) return []
  if (!Array.isArray(value)) {
    throw new ContentError('home.json', `"${path}" must be a list`)
  }
  return value
}

function validateHome(data) {
  for (const [section, fields] of Object.entries(HOME_SHAPE)) {
    const block = data[section]
    if (!block || typeof block !== 'object') {
      throw new ContentError('home.json', `"${section}" section is missing`)
    }
    for (const name of fields) {
      if (typeof block[name] !== 'string' || block[name].trim() === '') {
        throw new ContentError(
          'home.json',
          `"${section}.${name}" is required and must not be empty`,
        )
      }
    }
  }

  for (const [section, labelField, listField] of HOME_DISCLOSURES) {
    validateDisclosure(data[section], section, labelField, listField)
  }

  validateFunding(data.funding)

  /* Same rule as a method page: an illustration without a description of
     what it shows is not publishable. */
  validateFigure(data.introduction.figure, 'home.json')

  return data
}

export const home = validateHome(homeData)

/*
 * The same idea for the other hand-built pages.
 *
 * Separate from home.json because the home page is a distinct editing job with
 * a lot more copy in it; keeping the rest together means Stage 8's software and
 * contact pages extend this file rather than adding one more per page.
 */
const PAGES_SHAPE = {
  publications: ['title', 'intro'],
  people: ['title', 'intro', 'currentHeading', 'formerHeading'],
  software: ['title', 'intro', 'note'],
  contact: [
    'title',
    'intro',
    'emailHeading',
    'emailAction',
    'collaborationHeading',
    'collaborationBody',
    'softwareHeading',
    'softwareBody',
    'affiliationHeading',
  ],
}

function validatePages(data) {
  for (const [page, fields] of Object.entries(PAGES_SHAPE)) {
    const block = data[page]
    if (!block || typeof block !== 'object') {
      throw new ContentError('pages.json', `"${page}" section is missing`)
    }
    for (const name of fields) {
      if (typeof block[name] !== 'string' || block[name].trim() === '') {
        throw new ContentError(
          'pages.json',
          `"${page}.${name}" is required and must not be empty`,
        )
      }
    }
  }
  return data
}

export const pages = validatePages(pagesData)

/* Exposed so tests can exercise the rules without a fixture file. */
export { validateHome, validatePages, validatePerson, validateRepository }
