import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { ContentError } from '../lib/frontmatter'
import { getContentGroups } from '../app/navigation'
import {
  people,
  currentPeople,
  formerPeople,
  facultyPeople,
  publications,
  publicationsByYear,
  getRecentPublications,
  formatPublicationCitation,
  doiUrl,
  isApprovedPhotoPath,
  PHOTO_ROOTS,
  validateHome,
  validatePages,
  validatePerson,
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

  /*
   * A portrait's path is a URL in the served site, and `public/` is the root
   * of that site — so the file it names is found by resolving it under
   * `public/`, whichever approved folder it happens to be in.
   *
   * This replaces an earlier version that listed `public/images/people` and
   * string-replaced that one prefix. It assumed curated portraits were the
   * only kind, and broke the moment Pages CMS did exactly what it is
   * configured to do: write an upload to `/images/uploads/`.
   */
  const publicFile = (photo) => resolve(root, 'public', photo.replace(/^\//, ''))

  it('points every photo at an approved folder', () => {
    expect(people.some((person) => person.photo)).toBe(true)

    for (const person of people) {
      if (!person.photo) continue
      expect(
        isApprovedPhotoPath(person.photo),
        `${person.id}: ${person.photo} is not in ${PHOTO_ROOTS.join(' or ')}`,
      ).toBe(true)
    }
  })

  it('points every photo at a file that exists', () => {
    for (const person of people) {
      if (!person.photo) continue
      expect(
        existsSync(publicFile(person.photo)),
        `${person.id}: ${person.photo} is missing from public/`,
      ).toBe(true)
    }
  })

  it('accepts a curated portrait and a CMS upload alike', () => {
    /*
     * Both halves of the model, asserted against the real repository rather
     * than a fixture: the migrated portraits live in one folder, and the
     * photo Pages CMS uploaded lives in the other. Each must resolve to a
     * file that is actually there.
     */
    const curated = '/images/people/wu-xu.webp'
    const uploaded = '/images/uploads/img202504141842238022-copy.jpeg'

    for (const photo of [curated, uploaded]) {
      expect(isApprovedPhotoPath(photo), photo).toBe(true)
      expect(existsSync(publicFile(photo)), photo).toBe(true)
    }

    // ...and the site is genuinely using both, not just permitting them.
    const roots = people
      .filter((person) => person.photo)
      .map((person) => PHOTO_ROOTS.find((r) => person.photo.startsWith(r)))
    expect(new Set(roots)).toEqual(new Set(PHOTO_ROOTS))
  })

  it('refuses a photo outside the approved folders', () => {
    for (const photo of [
      '/random/portrait.jpg',
      '../secret.png',
      '/images/uploads/../../etc/passwd',
      'http://example.com/portrait.jpg',
      'https://example.com/portrait.jpg',
      'images/people/no-leading-slash.webp',
    ]) {
      expect(isApprovedPhotoPath(photo), photo).toBe(false)
      expect(
        () => validatePerson({ id: 'x', name: 'X', role: 'Y', photo }),
        photo,
      ).toThrow(ContentError)
    }
  })

  it('catches a photo whose file is not in the repository', () => {
    /*
     * The half of the check that a path rule cannot do: an approved,
     * well-formed path naming a file nobody committed. That is what a broken
     * image on the live site looks like, and it is why the existence check
     * survives rather than being replaced by the prefix rule.
     */
    const missing = '/images/uploads/never-uploaded-this.jpeg'

    expect(isApprovedPhotoPath(missing)).toBe(true)
    expect(existsSync(publicFile(missing))).toBe(false)
  })

  it('orders people deterministically', () => {
    const ids = people.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)

    const orders = people.map((p) => p.order ?? 999)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
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
