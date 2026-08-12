import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { render } from '@testing-library/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import { methods, getPublishedMethod, buildMethod } from './index'
import { parseFrontmatter } from '../lib/frontmatter'
import { extractHeadings } from '../lib/toc'

/* A minimal valid file, used as the base for validation tests. */
function file(frontmatter, body = '## Overview\n\nSome text.\n') {
  return `---\n${frontmatter}\n---\n\n${body}`
}

const VALID = `slug: example
title: Example Method
summary: A short summary.
status: published
category: method
group: one-molecule`

describe('frontmatter parsing', () => {
  it('separates frontmatter from body', () => {
    const { data, body } = parseFrontmatter(file(VALID))

    expect(data.slug).toBe('example')
    expect(body.trim()).toBe('## Overview\n\nSome text.')
  })

  it('rejects a file with no frontmatter', () => {
    expect(() => parseFrontmatter('# Just markdown', 'a.md')).toThrow(
      /missing YAML frontmatter/,
    )
  })

  it('reports the file name when the YAML is broken', () => {
    expect(() => parseFrontmatter('---\ntitle: "unclosed\n---\nbody', 'bad.md')).toThrow(
      /bad\.md/,
    )
  })
})

describe('method validation', () => {
  const build = (frontmatter, body) =>
    buildMethod('./methods/example.md', file(frontmatter, body))

  it('accepts a minimal valid file', () => {
    const method = build(VALID)

    expect(method.slug).toBe('example')
    expect(method.path).toBe('/methods/example')
    expect(method.status).toBe('published')
  })

  it('maps each category to its URL space', () => {
    expect(
      buildMethod('./methods/tsr.md', file(VALID.replace('slug: example', 'slug: tsr').replace('category: method', 'category: core'))).path,
    ).toBe('/tsr')
    expect(
      buildMethod(
        './methods/common-keys.md',
        file(
          VALID.replace('slug: example', 'slug: common-keys').replace(
            'category: method',
            'category: analysis',
          ),
        ),
      ).path,
    ).toBe('/analysis/common-keys')
  })

  it('requires the slug to match the filename', () => {
    expect(() =>
      buildMethod('./methods/other.md', file(VALID)),
    ).toThrow(/does not match the filename/)
  })

  it('rejects an unknown status', () => {
    expect(() => build(VALID.replace('status: published', 'status: maybe'))).toThrow(
      /"status" must be one of/,
    )
  })

  it('rejects a missing title', () => {
    expect(() => build(VALID.replace('title: Example Method\n', ''))).toThrow(
      /"title" is required/,
    )
  })

  it('rejects a published file with no body', () => {
    // Drafts may be empty; a published page may not. See
    // draft-creation.test.jsx for the draft side of this rule.
    expect(() => build(VALID, '   ')).toThrow(/needs body content/)
  })

  it('requires alt text on a figure', () => {
    expect(() =>
      build(`${VALID}\nfigure:\n  src: /images/x.png`),
    ).toThrow(/needs "alt" text/)
  })

  it('requires a doi or url on a paper', () => {
    expect(() => build(`${VALID}\npaper:\n  title: Something`)).toThrow(
      /needs either a "doi" or a "url"/,
    )
  })

  it('derives the paper url from a doi', () => {
    const method = build(`${VALID}\npaper:\n  doi: 10.1000/abc`)
    expect(method.paper.url).toBe('https://doi.org/10.1000/abc')
  })
})

describe('slurm schema', () => {
  /*
   * Modelled on the Slurm sections that recur across the TSR packages: an
   * intro, a job script, the submission command, and notes. Every value is
   * package-specific and lives here in content, which is what lets Stage 4's
   * SlurmGuide component hard-code no resource values of its own.
   */
  const withSlurm = `slug: example
title: Example Method
summary: A short summary.
status: published
category: method
group: one-molecule
slurm:
  intro: A basic Slurm script to submit a job looks like this.
  script:
    filename: run_example.sbatch
    code: |
      #!/bin/bash
      #SBATCH -p workq
      #SBATCH -n 64
      #SBATCH -t 72:00:00
      #SBATCH -J example

      python3 run_example.py
  submit:
    code: sbatch run_example.sbatch
  resources: Requests one node with 64 tasks for up to 72 hours.
  notes: Adjust the allocation to your own project.`

  const method = buildMethod('./methods/example.md', file(withSlurm))

  it('keeps the job script verbatim, including SBATCH directives', () => {
    expect(method.slurm.script.code).toContain('#SBATCH -p workq')
    expect(method.slurm.script.code).toContain('python3 run_example.py')
    expect(method.slurm.script.filename).toBe('run_example.sbatch')
  })

  it('defaults the script language to bash', () => {
    expect(method.slurm.script.language).toBe('bash')
  })

  it('carries the submission command and the surrounding prose', () => {
    expect(method.slurm.submit.code).toBe('sbatch run_example.sbatch')
    expect(method.slurm.intro).toMatch(/basic Slurm script/)
    expect(method.slurm.resources).toMatch(/64 tasks/)
    expect(method.slurm.notes).toMatch(/own project/)
  })

  it('does not treat SBATCH comment lines as headings', () => {
    // '#SBATCH' has no space after the hash, and the script lives in
    // frontmatter rather than the body, so it can never reach the TOC.
    expect(method.headings.map((h) => h.text)).not.toContain('SBATCH -p workq')
  })

  it('rejects a slurm block with no script or no submit command', () => {
    expect(() =>
      buildMethod('./methods/example.md', file(`${VALID}\nslurm:\n  intro: hi`)),
    ).toThrow(/needs "script.code"/)
  })
})

describe('heading extraction', () => {
  it('collects h2 and h3 headings in document order', () => {
    const headings = extractHeadings(
      '# Title\n\n## Overview\n\n### Details\n\n## Usage\n\n#### Too deep\n',
    )

    expect(headings).toEqual([
      { depth: 2, text: 'Overview', id: 'overview' },
      { depth: 3, text: 'Details', id: 'details' },
      { depth: 2, text: 'Usage', id: 'usage' },
    ])
  })

  it('ignores hashes inside fenced code blocks', () => {
    const headings = extractHeadings(
      '## Real\n\n```bash\n## not a heading\n#SBATCH --job-name=x\n```\n\n## Also real\n',
    )

    expect(headings.map((h) => h.text)).toEqual(['Real', 'Also real'])
  })

  it('strips inline markdown before slugging', () => {
    const headings = extractHeadings('## Using `TSR()` with **CSV** input\n')

    expect(headings[0].text).toBe('Using TSR() with CSV input')
  })

  it('disambiguates repeated headings the same way rehype-slug does', () => {
    const headings = extractHeadings('## Examples\n\n## Examples\n')

    expect(headings.map((h) => h.id)).toEqual(['examples', 'examples-1'])
  })
})

describe('anchor parity with the render pipeline', () => {
  /*
   * The section navigation is built from `extractHeadings`, but the ids it
   * links to are written by rehype-slug at render time. If the two ever
   * disagree, every section link silently points at nothing.
   *
   * This renders real content through the real pipeline and compares.
   */
  it.each(methods.map((m) => [m.slug, m]))(
    'ids match for %s',
    (_slug, methodEntry) => {
      const { container } = render(
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSlug]}
        >
          {methodEntry.body}
        </ReactMarkdown>,
      )

      const rendered = Array.from(container.querySelectorAll('h2, h3')).map(
        (el) => el.id,
      )
      const extracted = extractHeadings(methodEntry.body).map((h) => h.id)

      expect(extracted).toEqual(rendered)
    },
  )

  it('renders GFM tables, which the parameter and CSV examples rely on', () => {
    const { container } = render(
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
        {'| protein | chain |\n| --- | --- |\n| 1GTA | A |\n'}
      </ReactMarkdown>,
    )

    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelectorAll('th')).toHaveLength(2)
  })

  it('renders fenced code with its language recorded in a class', () => {
    const { container } = render(
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
        {'```python\nfrom tsr_package.tsr.TSR import TSR\n```\n'}
      </ReactMarkdown>,
    )

    const code = container.querySelector('pre code')
    expect(code).toHaveClass('language-python')
  })
})

describe('markdown body order survives a CMS round-trip', () => {
  /*
   * Pages CMS re-serialises a whole file on save: YAML block scalars are
   * rewritten, table delimiter rows are padded, blank lines move, and list
   * continuation lines lose their indentation (valid CommonMark lazy
   * continuation). All of that is cosmetic.
   *
   * What must never change is the ORDER of blocks in the body. If a save ever
   * moved a code block out from between the paragraphs it belongs to, the
   * tutorials would silently become wrong. This pins the real page's block
   * sequence so a regression shows up as a failing test rather than as a
   * confusing diff.
   */
  function blockSequence(markdown) {
    const out = []
    let fence = null

    for (const line of markdown.split('\n')) {
      const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})(\w*)/)
      if (fenceMatch) {
        if (fence === null) {
          fence = fenceMatch[1][0]
          out.push(`code:${fenceMatch[2] || 'plain'}`)
        } else if (fenceMatch[1][0] === fence) {
          fence = null
        }
        continue
      }
      if (fence !== null) continue

      const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/)
      if (heading) {
        out.push(`h${heading[1].length}:${heading[2]}`)
      } else if (/^\s*\|/.test(line) && !line.includes('---')) {
        if (out.at(-1) !== 'table') out.push('table')
      }
    }
    return out
  }

  it('keeps the TSR body in its authored order', () => {
    const tsr = getPublishedMethod('tsr')

    expect(blockSequence(tsr.body)).toEqual([
      'h2:Overview',
      'h3:Key generation process',
      'h3:Distinguishing features',
      'h3:Applications',
      'h2:Installation',
      'code:bash',
      'code:bash',
      'code:bash',
      'code:bash',
      'code:bash',
      'h2:Usage',
      'h3:Retrieve PDB files',
      'code:python',
      'h3:Generate keys and triplets',
      'code:python',
      'h3:Parameters',
      'table',
      'h3:Using a CSV file as input',
      'code:python',
      'table',
      'h2:Examples',
      'h3:Retrieving PDB files and generating keys',
      'code:python',
      'h3:Using a CSV file for input',
      'code:python',
    ])
  })

  it('keeps each code block adjacent to the prose that introduces it', () => {
    const tsr = getPublishedMethod('tsr')
    const sequence = blockSequence(tsr.body)

    // The two examples are each a heading immediately followed by their code.
    const examplesAt = sequence.indexOf('h2:Examples')
    expect(sequence.slice(examplesAt)).toEqual([
      'h2:Examples',
      'h3:Retrieving PDB files and generating keys',
      'code:python',
      'h3:Using a CSV file for input',
      'code:python',
    ])
  })
})

describe('the registry', () => {
  it('loads the representative TSR method', () => {
    const tsr = getPublishedMethod('tsr')

    expect(tsr).toBeDefined()
    expect(tsr.title).toBe('Triangular Spatial Relationship (TSR)')
    expect(tsr.path).toBe('/tsr')
    expect(tsr.category).toBe('core')
  })

  it('exposes paper, repository and figure metadata from frontmatter', () => {
    const tsr = getPublishedMethod('tsr')

    expect(tsr.paper.doi).toBe('10.3389/fchem.2020.602291')
    expect(tsr.paper.url).toBe('https://doi.org/10.3389/fchem.2020.602291')
    expect(tsr.repositories[0].url).toBe(
      'https://github.com/pooryakhajouie/TSR-Package',
    )
    expect(tsr.figure.alt.length).toBeGreaterThan(20)
  })

  it('builds a section list for the page navigation', () => {
    const tsr = getPublishedMethod('tsr')
    const topLevel = tsr.headings.filter((h) => h.depth === 2).map((h) => h.text)

    expect(topLevel).toEqual(['Overview', 'Installation', 'Usage', 'Examples'])
  })

  it('never returns a draft method by slug', () => {
    for (const draft of methods.filter((m) => m.status === 'draft')) {
      expect(getPublishedMethod(draft.slug)).toBeUndefined()
    }
  })

  it('gives every method a unique slug and path', () => {
    expect(new Set(methods.map((m) => m.slug)).size).toBe(methods.length)
    expect(new Set(methods.map((m) => m.path)).size).toBe(methods.length)
  })
})

describe('referenced images exist', () => {
  it.each(
    methods.filter((m) => m.figure).map((m) => [m.slug, m.figure.src]),
  )('%s figure %s is present in public/', (_slug, src) => {
    /*
     * Guards against the broken-image problem the previous site had: a
     * frontmatter path is just a string, and nothing else would catch a typo
     * or a file that was never copied across.
     */
    // Vitest runs with the project root as its working directory.
    const onDisk = resolve(process.cwd(), 'public', src.replace(/^\//, ''))
    expect(existsSync(onDisk), `${src} is not in public/`).toBe(true)
  })
})
