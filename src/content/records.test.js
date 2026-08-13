import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { ContentError } from '../lib/frontmatter'
import { getContentGroups } from '../app/navigation'
import {
  people,
  currentPeople,
  formerPeople,
  facultyPeople,
  methods,
  publications,
  publicationsByYear,
  getRecentPublications,
  formatPublicationCitation,
  doiUrl,
  repositories,
  repositoryPath,
  getPagesForRepository,
  getRepositoriesByCategory,
  validateHome,
  validatePages,
  validatePerson,
  validateRepository,
  home,
  pages,
} from './index'

/*
 * The record collections, checked against the rules that keep them
 * publishable: one record per paper, no placeholder contact details, a
 * deterministic order, and a citation that reads correctly however much
 * bibliographic detail a record happens to carry.
 */

const root = process.cwd()

describe('publication records', () => {
  it('has a record for every file, and a file for every record', () => {
    const files = readdirSync(resolve(root, 'src/content/publications'))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''))
      .sort()

    expect(publications.map((p) => p.id).sort()).toEqual(files)
  })

  it('gives every record a title, and a year it can be sorted by', () => {
    for (const publication of publications) {
      expect(publication.title?.trim(), publication.id).toBeTruthy()
      expect(Number.isInteger(publication.year), publication.id).toBe(true)
    }
  })

  it('lists authors as separate names, not one string', () => {
    for (const publication of publications) {
      expect(Array.isArray(publication.authors), publication.id).toBe(true)
      expect(publication.authors.length, publication.id).toBeGreaterThan(0)
      for (const author of publication.authors) {
        // A comma inside one entry means the list was pasted rather than split,
        // which the legacy site did — its author strings even contained ", ,".
        expect(author, publication.id).not.toMatch(/,/)
        expect(author.trim(), publication.id).toBe(author)
      }
    }
  })

  it('uses no duplicate id', () => {
    const ids = publications.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses no duplicate DOI', () => {
    /*
     * One paper may be cited by several method pages — the DrugTSR paper is
     * credited on both DrugTSR and Key to 2D Image — but the publication
     * collection holds one record per paper. The loader throws on a duplicate;
     * this asserts the shipped data satisfies it.
     */
    const dois = publications.filter((p) => p.doi).map((p) => p.doi.toLowerCase())
    expect(new Set(dois).size).toBe(dois.length)
  })

  it('stores DOIs as bare identifiers, not URLs', () => {
    for (const publication of publications) {
      if (!publication.doi) continue
      expect(publication.doi, publication.id).toMatch(/^10\.\d{4,9}\//)
      expect(publication.doi, publication.id).not.toMatch(/^https?:/)
    }
  })

  it('builds a resolvable link from each DOI', () => {
    for (const publication of publications) {
      if (!publication.doi) continue
      const url = doiUrl(publication.doi)
      expect(() => new URL(url)).not.toThrow()
      expect(url).toBe(`https://doi.org/${publication.doi}`)
    }
  })

  it('sorts newest first, deterministically', () => {
    const years = publicationsByYear.map((p) => p.year)
    expect(years).toEqual([...years].sort((a, b) => b - a))

    // Same input, same output — the id tie-break makes the order total.
    expect(publicationsByYear.map((p) => p.id)).toEqual(
      [...publicationsByYear].map((p) => p.id),
    )
  })

  it('includes the recent work migrated in earlier stages', () => {
    const ids = publications.map((p) => p.id)
    expect(ids).toContain('khajouie-2026-sse-tsr')
    expect(ids).toContain('rauniyar-2025-nucleotide-tsr')
    expect(ids).toContain('chen-2025-parallel-tsr')
  })
})

describe('citation formatting', () => {
  it('reads as a citation when every field is present', () => {
    expect(
      formatPublicationCitation({
        venue: 'IEEE Transactions on Computational Biology and Bioinformatics',
        year: 2026,
        volume: '23',
        issue: '2',
        pages: '694–703',
      }),
    ).toBe(
      'IEEE Transactions on Computational Biology and Bioinformatics, 2026, 23(2), 694–703',
    )
  })

  it('leaves no dangling punctuation when detail is missing', () => {
    /*
     * The real risk with a citation template. A record with no volume must not
     * render "Data in Brief, 2022, , 108629", and one with only a venue must
     * not end in a comma.
     */
    expect(
      formatPublicationCitation({ venue: 'Data in Brief', year: 2022, pages: '108629' }),
    ).toBe('Data in Brief, 2022, 108629')

    expect(formatPublicationCitation({ venue: 'Photochem' })).toBe('Photochem')

    for (const publication of publications) {
      const citation = formatPublicationCitation(publication)
      expect(citation, publication.id).not.toMatch(/,\s*,/)
      expect(citation, publication.id).not.toMatch(/[,(]\s*$/)
      expect(citation, publication.id).not.toMatch(/\(\)/)
    }
  })

  it('shows a volume without an issue as a bare volume', () => {
    expect(
      formatPublicationCitation({
        venue: 'Computational Biology and Chemistry',
        year: 2024,
        volume: '112',
        pages: '108117',
      }),
    ).toBe('Computational Biology and Chemistry, 2024, 112, 108117')
  })
})

describe('people records', () => {
  it('names every file after the record id', () => {
    const files = readdirSync(resolve(root, 'src/content/people'))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''))
      .sort()

    expect(people.map((p) => p.id).sort()).toEqual(files)
  })

  it('splits everyone into current and former, with nobody lost', () => {
    expect(currentPeople.length + formerPeople.length).toBe(people.length)
    expect(currentPeople.length).toBeGreaterThan(0)
    expect(formerPeople.length).toBeGreaterThan(0)
  })

  it('derives the faculty from their own records', () => {
    for (const person of facultyPeople) {
      expect(person.group).toBe('faculty')
      expect(person.status).toBe('current')
    }
  })

  it('publishes no placeholder contact details', () => {
    /*
     * The previous site shipped `former.member1@louisiana.edu` and
     * `(337) 123-4567` for two former members, and empty strings for nine
     * others. None of that is migrated.
     */
    for (const person of people) {
      expect(person.email ?? '', person.id).not.toMatch(/former\.member/i)
      expect(person.email ?? '', person.id).not.toMatch(/example\.com/i)
      expect(person, person.id).not.toHaveProperty('phone')
    }
  })

  it('has no empty optional field, anywhere', () => {
    for (const person of people) {
      for (const [key, value] of Object.entries(person)) {
        if (typeof value !== 'string') continue
        expect(value.trim(), `${person.id}.${key}`).not.toBe('')
      }
    }
  })

  it('rejects an empty email rather than rendering a link to nowhere', () => {
    expect(() =>
      validatePerson({ id: 'x', name: 'X', role: 'Y', email: '  ' }),
    ).toThrow(ContentError)
  })

  it('rejects a status it does not understand', () => {
    expect(() =>
      validatePerson({ id: 'x', name: 'X', role: 'Y', status: 'alumnus' }),
    ).toThrow(ContentError)
  })

  it('points every photo at a file that exists', () => {
    const available = new Set(
      readdirSync(resolve(root, 'public/images/people')),
    )

    for (const person of people) {
      if (!person.photo) continue
      expect(person.photo, person.id).toMatch(/^\/images\/people\//)
      expect(
        available.has(person.photo.replace('/images/people/', '')),
        `${person.id}: ${person.photo} is missing from public/`,
      ).toBe(true)
    }
  })

  it('orders people deterministically', () => {
    const ids = people.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)

    const orders = people.map((p) => p.order ?? 999)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })
})

describe('repository records', () => {
  const valid = {
    id: 'x',
    name: 'X',
    url: 'https://github.com/owner/x',
    description: 'Does a thing.',
    category: 'core',
    kind: 'package',
  }

  it('names every file after the record id', () => {
    const files = readdirSync(resolve(root, 'src/content/repositories'))
      .filter((name) => name.endsWith('.json'))
      .map((name) => name.replace(/\.json$/, ''))
      .sort()

    expect(repositories.map((r) => r.id).sort()).toEqual(files)
  })

  it('uses no duplicate id or URL', () => {
    const ids = repositories.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)

    const urls = repositories.map((r) => r.url.replace(/\/+$/, '').toLowerCase())
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('gives every record an https URL that parses', () => {
    for (const repository of repositories) {
      expect(() => new URL(repository.url), repository.id).not.toThrow()
      expect(repository.url, repository.id).toMatch(
        /^https:\/\/github\.com\/[^/]+\/[^/]+$/,
      )
    }
  })

  it('carries no placeholder URL', () => {
    /*
     * The previous site's Source Code page shipped
     * `https://github.com/your-repo`, and the Metal-Ion page the same string.
     * The loader rejects it outright; this asserts the shipped data is clean.
     */
    for (const repository of repositories) {
      expect(repository.url, repository.id).not.toMatch(/your-repo|example\.com/)
    }
    expect(() =>
      validateRepository({ ...valid, url: 'https://github.com/your-repo' }),
    ).toThrow(ContentError)
  })

  it('requires a category and a kind it understands', () => {
    for (const repository of repositories) {
      expect(['core', 'method', 'analysis', 'tooling']).toContain(
        repository.category,
      )
      expect(['package', 'scripts']).toContain(repository.kind)
    }

    expect(() => validateRepository({ ...valid, kind: 'library' })).toThrow(
      ContentError,
    )
    expect(() => validateRepository({ ...valid, category: 'misc' })).toThrow(
      ContentError,
    )
  })

  it('rejects an http or malformed issue tracker', () => {
    expect(() =>
      validateRepository({ ...valid, issuesUrl: 'http://github.com/o/x/issues' }),
    ).toThrow(ContentError)
  })

  it('reads owner and name back out of the URL', () => {
    expect(repositoryPath('https://github.com/TSRMethod/future-package')).toBe(
      'TSRMethod/future-package',
    )
    expect(repositoryPath('https://github.com/owner/repo/')).toBe('owner/repo')
    expect(repositoryPath('https://example.org/thing')).toBeNull()
  })

  it('matches repositories to the pages that document them', () => {
    const tsrPackage = repositories.find((r) => r.id === 'tsr-package')
    const slugs = getPagesForRepository(tsrPackage.url).map((m) => m.slug)

    expect(slugs).toContain('tsr')
    expect(slugs).toContain('sse-tsr')
    // Never a draft: the derivation reads publishedMethods.
    expect(slugs).not.toContain('key-to-image')
  })

  it('returns nothing for a repository no page mentions', () => {
    expect(
      getPagesForRepository('https://github.com/TSRMethod/not-referenced-yet'),
    ).toEqual([])
  })

  it('has a record for every repository a published page cites', () => {
    /*
     * The two lists are written separately — each method page names its own
     * repositories in its frontmatter — so this is where they are held
     * together. A page citing code the catalogue does not list would leave a
     * reader unable to find it from /software.
     */
    const known = new Set(
      repositories.map((r) => r.url.replace(/\/+$/, '').toLowerCase()),
    )

    for (const method of methods.filter((m) => m.status === 'published')) {
      for (const repository of method.repositories) {
        const url = repository.url.replace(/\/+$/, '').toLowerCase()
        expect(
          known.has(url),
          `${method.slug} cites ${repository.url}, which has no record in src/content/repositories`,
        ).toBe(true)
      }
    }
  })

  it('groups by category without losing anyone', () => {
    const grouped = ['core', 'method', 'analysis', 'tooling'].flatMap(
      (category) => getRepositoriesByCategory(category),
    )
    expect(grouped).toHaveLength(repositories.length)
  })
})

describe('editorial copy for the hand-built pages', () => {
  it('validates the shipped home and page copy', () => {
    expect(() => validateHome(home)).not.toThrow()
    expect(() => validatePages(pages)).not.toThrow()
  })

  it('fails the build when a visible field is emptied', () => {
    /*
     * A blank heading or button label would render as an empty control. The
     * build failing is the desired outcome: deployment runs the build, so the
     * live site keeps its last good version instead of publishing the gap.
     */
    const emptied = { ...home, hero: { ...home.hero, primaryCta: '   ' } }
    expect(() => validateHome(emptied)).toThrow(ContentError)

    const missing = { ...pages, people: undefined }
    expect(() => validatePages(missing)).toThrow(ContentError)
  })

  it('requires the home diagram to describe itself', () => {
    const noAlt = {
      ...home,
      introduction: {
        ...home.introduction,
        figure: { src: '/images/home/x.webp' },
      },
    }
    expect(() => validateHome(noAlt)).toThrow(ContentError)
  })
})

describe('sections with nothing to show', () => {
  /*
   * The home page must survive an empty collection — a new deployment before
   * any paper has been entered, or a category whose only page is still a
   * draft. Each section asks its helper for records and renders nothing at all
   * when the answer is an empty list, rather than leaving a stranded heading.
   */
  it('returns no recent publications from an empty collection', () => {
    expect(getRecentPublications(3, [])).toEqual([])
  })

  it('returns no groups when nothing in a category is published', () => {
    expect(
      getContentGroups('analysis', { methods: [], isAvailable: () => true }),
    ).toEqual([])
  })

  it('drops a group whose pages are not routed yet', () => {
    expect(
      getContentGroups('method', { isAvailable: () => false }),
    ).toEqual([])
  })

  it('caps the highlights at the number asked for', () => {
    expect(getRecentPublications(2).length).toBe(2)
    expect(getRecentPublications(99).length).toBe(publications.length)
  })
})
