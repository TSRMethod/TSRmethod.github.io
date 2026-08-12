import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { load as parseYaml } from 'js-yaml'

import { methods, site, people, publications, repositories } from './index'

/*
 * Validates .pages.yml against the repository it describes.
 *
 * A CMS config is easy to let rot: paths get renamed, fields get added to a
 * content file and never surfaced to the editor, or — worst — an
 * architectural field stops being hidden and a supervisor can suddenly change
 * a page's URL or publish unreviewed science. These tests fail the build
 * instead.
 */

const root = process.cwd()
const config = parseYaml(readFileSync(resolve(root, '.pages.yml'), 'utf8'))
const entries = Object.fromEntries(
  config.content.map((entry) => [entry.name, entry]),
)

/** Field names declared for an entry, including hidden ones. */
const fieldNames = (entry) => entry.fields.map((field) => field.name)
const field = (entry, name) => entry.fields.find((f) => f.name === name)

describe('.pages.yml is valid and matches the repository', () => {
  it('parses and declares the expected top-level keys', () => {
    expect(config.media).toBeDefined()
    expect(config.content).toBeInstanceOf(Array)
    expect(config.settings).toBeDefined()
  })

  it('points every content path at something that exists', () => {
    for (const entry of config.content) {
      expect(existsSync(resolve(root, entry.path)), `${entry.path}`).toBe(true)
    }
  })

  it('points media at a real folder, served from the site root', () => {
    expect(existsSync(resolve(root, config.media.input))).toBe(true)
    // Vite `base` is "/", so an absolute output path resolves on GitHub Pages.
    expect(config.media.output.startsWith('/')).toBe(true)
    expect(config.media.input).toBe(`public${config.media.output}`)
  })

  it('exposes exactly the four content areas', () => {
    expect(Object.keys(entries).sort()).toEqual([
      'methods',
      'people',
      'publications',
      'repositories',
      'site',
    ])
  })
})

describe('the architecture boundary', () => {
  const ARCHITECTURE = ['slug', 'category', 'group', 'order', 'status']

  it('hides every architectural field on method pages', () => {
    for (const name of ARCHITECTURE) {
      const declared = field(entries.methods, name)
      expect(declared, `${name} must be declared so it is preserved`).toBeDefined()
      expect(declared.hidden, `${name} must be hidden`).toBe(true)
    }
  })

  it('never lets an editor publish a draft method', () => {
    /*
     * The single most important assertion in this file. `status` decides
     * whether unreviewed science is public; it must be invisible in the CMS
     * and changeable only in the repository.
     */
    const status = field(entries.methods, 'status')
    expect(status.hidden).toBe(true)
    expect(status.readonly).toBeUndefined()
  })

  it('lets an editor create a method draft, but not rename or delete one', () => {
    /*
     * Create is allowed: writing up a new method is editorial work, and a new
     * file is a draft with no route until a maintainer places it.
     *
     * Rename is not: the filename decides the URL, so renaming would silently
     * move a published page. Delete is not: scientific content should not be
     * lost by a misclick.
     */
    expect(entries.methods.operations).toEqual({
      create: true,
      rename: false,
      delete: false,
    })
  })

  it('generates the filename from the title, with no filename box', () => {
    const { filename, view } = entries.methods

    // {primary} is view.primary, and Pages CMS slugifies the substituted
    // value, so a title of "VCNN-TSR" produces vcnn-tsr.md.
    expect(view.primary).toBe('title')
    expect(filename.template).toBe('{primary}.md')
    // The editor never sees or edits a raw filename.
    expect(filename.field).toBe(false)
  })

  it('requires nothing of the editor that would place or publish a page', () => {
    const required = entries.methods.fields
      .filter((f) => f.required)
      .map((f) => f.name)

    expect(required).toEqual(['title', 'summary'])
  })

  it('preserves keys that are not declared in the schema', () => {
    /*
     * Pages CMS defaults to rewriting a file from the schema alone, dropping
     * anything it was not told about. With merge enabled, a field added to a
     * content file but not yet added here survives a save.
     */
    expect(config.settings.content.merge).toBe(true)
  })

  it('exposes no technical or deployment configuration', () => {
    const yaml = readFileSync(resolve(root, '.pages.yml'), 'utf8')
    const forbidden = [
      'siteConfig',
      'vite.config',
      'package.json',
      '.github/',
      'routeRegistry',
      'navigation.js',
    ]
    for (const term of forbidden) {
      expect(yaml.includes(`path: ${term}`), `${term} must not be editable`).toBe(
        false,
      )
    }
  })
})

describe('the schema can represent the real content', () => {
  it.each(methods.map((m) => [m.slug, m.source]))(
    'covers every frontmatter key used by %s',
    (slug, source) => {
      /*
       * Checked for every method file, not just the first one. Each migrated
       * page is a chance to introduce a field the CMS cannot show, which
       * would leave an editor unable to change something they can see on the
       * page.
       */
      const declared = new Set(fieldNames(entries.methods))
      const path = resolve(root, source.replace(/^\.\//, 'src/content/'))
      const frontmatter = parseYaml(readFileSync(path, 'utf8').split('---')[1])

      for (const key of Object.keys(frontmatter)) {
        expect(
          declared.has(key),
          `${slug}: frontmatter key "${key}" is not in .pages.yml`,
        ).toBe(true)
      }
    },
  )

  it('edits the page body as markdown, not html', () => {
    const body = field(entries.methods, 'body')
    expect(body.type).toBe('rich-text')
    // Saving HTML here would stop the files being Markdown and would not
    // render, since the site does not enable raw HTML in Markdown.
    expect(body.options.format).toBe('markdown')
  })

  it('represents the multiline Slurm script as an editable field', () => {
    const slurm = field(entries.methods, 'slurm')
    const script = slurm.fields.find((f) => f.name === 'script')
    const code = script.fields.find((f) => f.name === 'code')

    // A multiline textarea: preserves newlines and needs no YAML knowledge.
    expect(code.type).toBe('text')
    expect(slurm.fields.map((f) => f.name)).toEqual([
      'intro',
      'script',
      'submit',
      'resources',
      'notes',
    ])
  })

  it('keeps the real Slurm script round-trippable', () => {
    const tsr = methods.find((method) => method.slug === 'tsr')

    // Re-serialising and re-parsing the script must return it unchanged,
    // which is what a CMS save does to the frontmatter.
    const yaml = parseYaml(
      `code: |\n${tsr.slurm.script.code
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n`,
    )
    expect(yaml.code.trimEnd()).toBe(tsr.slurm.script.code.trimEnd())
    expect(yaml.code).toContain('#SBATCH -t 72:00:00')
  })

  it('requires alt text wherever a figure can be set', () => {
    const figure = field(entries.methods, 'figure')
    const alt = figure.fields.find((f) => f.name === 'alt')
    expect(alt).toBeDefined()
    expect(alt.description).toMatch(/screen reader/i)
  })
})

describe('record collections match their sample data', () => {
  const cases = [
    ['people', people],
    ['publications', publications],
    ['repositories', repositories],
  ]

  it.each(cases)('%s: every stored key is editable', (name, records) => {
    const declared = new Set(fieldNames(entries[name]))

    for (const record of records) {
      for (const key of Object.keys(record)) {
        expect(declared.has(key), `${name}.${key} is not in .pages.yml`).toBe(true)
      }
    }
  })

  it.each(cases)('%s: names files after the record id', (name) => {
    expect(entries[name].filename).toBe('{fields.id}.json')
    expect(entries[name].format).toBe('json')
  })

  it('lets an editor add and remove records', () => {
    // The opposite of the methods collection: these are meant to grow.
    for (const [name] of cases) {
      expect(entries[name].operations?.create).not.toBe(false)
    }
  })
})

describe('site settings', () => {
  it('covers every key in site.json', () => {
    const declared = new Set(fieldNames(entries.site))
    for (const key of Object.keys(site)) {
      expect(declared.has(key), `site.${key} is not in .pages.yml`).toBe(true)
    }
  })

  it('exposes the contact email as an editable field', () => {
    expect(field(entries.site, 'email').required).toBe(true)
  })
})
