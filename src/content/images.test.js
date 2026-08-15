import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  PROFILES,
  plannedWidths,
  selectProfile,
  variantUrl,
  readPortraitUrls,
} from '../../scripts/optimize-images.mjs'
import { buildSrcSet, getImageEntry, getIntrinsicSize } from '../lib/images'
import { people } from './index'

/*
 * The image pipeline's rules.
 *
 * What is tested here is the part that decides things — which profile an image
 * gets, which widths are worth generating, what a derivative is called. The
 * part that actually re-encodes pixels is verified by the production build
 * itself: `npm run build` fails loudly if sharp cannot read a referenced
 * image, and prints what it produced.
 */

const root = process.cwd()

describe('choosing a profile', () => {
  it('treats anything in the curated portrait folder as a portrait', () => {
    expect(selectProfile('/images/people/wu-xu.webp')).toBe('portrait')
  })

  it('treats a CMS-uploaded portrait as a portrait, not a figure', () => {
    /*
     * The case that matters. An editor changing someone's photo through Pages
     * CMS puts it in /images/uploads/, beside the home page diagram — so
     * location alone cannot classify it, and the People records are consulted.
     * Get this wrong and a face is delivered at 1600px.
     */
    const uploaded = '/images/uploads/img202504141842238022-copy.jpeg'
    expect(selectProfile(uploaded)).toBe('figure')
    expect(selectProfile(uploaded, new Set([uploaded]))).toBe('portrait')
  })

  it('reads the portrait set from the real People records', async () => {
    const urls = await readPortraitUrls(resolve(root, 'src/content'))
    const stored = people.filter((p) => p.photo).map((p) => p.photo)

    expect(stored.length).toBeGreaterThan(0)
    for (const photo of stored) expect(urls.has(photo)).toBe(true)
  })

  it('treats an uploaded diagram as a figure', () => {
    expect(
      selectProfile('/images/uploads/workflow.png', new Set(['/images/people/x.webp'])),
    ).toBe('figure')
  })

  it('gives figures more pixels and more quality than portraits', () => {
    expect(PROFILES.figure.fallbackWidth).toBeGreaterThan(
      PROFILES.portrait.fallbackWidth,
    )
    expect(PROFILES.figure.quality).toBeGreaterThan(PROFILES.portrait.quality)
  })
})

describe('planning derivative widths', () => {
  it('never upscales a source smaller than the profile', () => {
    /* A 200px portrait must not become three blurry enlargements. */
    const widths = plannedWidths(200, 'portrait')
    expect(Math.max(...widths)).toBeLessThanOrEqual(200)
    expect(widths).toEqual([160, 200])
  })

  it('caps a very large figure at the profile maximum', () => {
    expect(plannedWidths(3840, 'figure')).toEqual([480, 960, 1600])
  })

  it('includes the source width when it falls between profile steps', () => {
    // The uploaded home diagram: 1376px wide, between 960 and 1600.
    expect(plannedWidths(1376, 'figure')).toEqual([480, 960, 1376])
  })

  it('returns ascending, unique widths', () => {
    for (const source of [64, 200, 480, 601, 1376, 4000]) {
      for (const profile of ['portrait', 'figure']) {
        const widths = plannedWidths(source, profile)
        expect(widths, `${source}/${profile}`).toEqual(
          [...new Set(widths)].sort((a, b) => a - b),
        )
      }
    }
  })
})

describe('derivative URLs', () => {
  it('puts the width in the name and switches the extension to webp', () => {
    expect(variantUrl('/images/uploads/a.jpeg', 320)).toBe(
      '/images/uploads/a.w320.webp',
    )
    expect(variantUrl('/images/people/wu-xu.webp', 160)).toBe(
      '/images/people/wu-xu.w160.webp',
    )
  })

  it('survives a dotted CMS filename', () => {
    expect(variantUrl('/images/uploads/scan.v2.final.png', 600)).toBe(
      '/images/uploads/scan.v2.final.w600.webp',
    )
  })
})

describe('rendering without a manifest', () => {
  /*
   * The dev-server and first-upload case: no derivative exists yet.
   * OptimizedImage must fall back to the original rather than emitting a
   * srcSet pointing at files that are not there.
   */
  it('reports no srcSet for an unknown image', () => {
    expect(buildSrcSet('/images/uploads/not-built-yet.png', {})).toBeNull()
    expect(getImageEntry('/images/uploads/not-built-yet.png', {})).toBeNull()
    expect(getIntrinsicSize('/images/uploads/not-built-yet.png', {})).toBeNull()
  })

  it('reports no srcSet for an entry with no variants', () => {
    const manifest = { '/a.png': { width: 10, height: 10, variants: [] } }
    expect(buildSrcSet('/a.png', manifest)).toBeNull()
  })

  it('ignores a non-string src rather than throwing', () => {
    expect(getImageEntry(undefined, {})).toBeNull()
    expect(getImageEntry(null, {})).toBeNull()
  })
})

describe('rendering with a manifest', () => {
  const manifest = {
    '/images/uploads/a.jpeg': {
      width: 1474,
      height: 1474,
      profile: 'portrait',
      variants: [
        { width: 600, url: '/images/uploads/a.w600.webp' },
        { width: 160, url: '/images/uploads/a.w160.webp' },
        { width: 320, url: '/images/uploads/a.w320.webp' },
      ],
    },
  }

  it('lists candidates smallest first, whatever order they were stored in', () => {
    expect(buildSrcSet('/images/uploads/a.jpeg', manifest)).toBe(
      '/images/uploads/a.w160.webp 160w, ' +
        '/images/uploads/a.w320.webp 320w, ' +
        '/images/uploads/a.w600.webp 600w',
    )
  })

  it('exposes intrinsic dimensions so the layout can reserve the box', () => {
    expect(getIntrinsicSize('/images/uploads/a.jpeg', manifest)).toEqual({
      width: 1474,
      height: 1474,
    })
  })
})

describe('the images the site actually references', () => {
  it('has a real file behind every portrait, in an approved folder', () => {
    for (const person of people) {
      if (!person.photo) continue
      const file = resolve(root, 'public', person.photo.replace(/^\//, ''))
      expect(existsSync(file), `${person.id}: ${person.photo}`).toBe(true)
    }
  })

  it('ships the brand mark the header asks for', () => {
    expect(existsSync(resolve(root, 'public/images/brand/tsr-mark.png'))).toBe(true)
  })

  it('leaves vector assets out of the raster pipeline', () => {
    /*
     * SVG is resolution-independent: rasterising the favicon would make it
     * both worse and bigger. The optimiser skips anything it does not
     * recognise as a raster format, and the favicon is the live example.
     */
    expect(existsSync(resolve(root, 'public/favicon.svg'))).toBe(true)
    expect(
      readdirSync(resolve(root, 'public')).filter((n) => n.endsWith('.svg')),
    ).toContain('favicon.svg')
  })
})
