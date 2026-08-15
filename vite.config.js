import { copyFileSync, cpSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { optimizeImages, formatSummary } from './scripts/optimize-images.mjs'
import { collectCanonicalPaths, renderSitemap } from './scripts/site-routes.mjs'

const SITE_ORIGIN = 'https://tsrmethod.github.io'

const VIRTUAL_MANIFEST = 'virtual:image-manifest'
const RESOLVED_MANIFEST = '\0' + VIRTUAL_MANIFEST

/*
 * Automatic image optimisation.
 *
 * Everything a Pages CMS editor uploads is optimised on the way into `dist/`,
 * with no action required from them — see scripts/optimize-images.mjs for why
 * that is not negotiable.
 *
 * Why a plugin rather than a `postbuild` script: the OptimizedImage component
 * needs to know which derivative widths exist, and that is only known once the
 * images have been read. A separate script would have to write a generated
 * source file for the bundler to pick up, which then has to be either
 * committed (and goes stale the moment an editor uploads through the CMS,
 * failing CI on their commit — exactly the Stage 8 failure we already fixed
 * once) or gitignored (and then `npm run dev` and the tests cannot resolve the
 * import). A virtual module has neither problem: it is generated in memory
 * during the build that consumes it.
 *
 * In dev and under test the manifest is empty, and OptimizedImage falls back
 * to a plain <img> with the original URL. So nobody has to run an image build
 * to work on the site, and a page can never break because a derivative is
 * missing.
 */
function imageOptimizer() {
  const derivativesDir = resolve(process.cwd(), 'node_modules/.cache/tsr-images')
  let manifest = {}
  let isBuild = false
  let outDir

  return {
    name: 'tsr-image-optimizer',

    config(_config, { command }) {
      isBuild = command === 'build'
    },

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },

    async buildStart() {
      if (!isBuild) return

      rmSync(derivativesDir, { recursive: true, force: true })

      const result = await optimizeImages({
        publicDir: resolve(process.cwd(), 'public'),
        contentDir: resolve(process.cwd(), 'src/content'),
        outDir: derivativesDir,
      })

      manifest = result.manifest
      this.info('\n  ' + formatSummary(result.stats) + '\n')
    },

    resolveId(id) {
      if (id === VIRTUAL_MANIFEST) return RESOLVED_MANIFEST
      return null
    },

    load(id) {
      if (id !== RESOLVED_MANIFEST) return null
      return `export default ${JSON.stringify(manifest)}`
    },

    /*
     * Copied last, over the verbatim public/ copy Vite has already made, so
     * the optimised fallback replaces the original at the same URL and the
     * WebP derivatives land beside it.
     */
    closeBundle() {
      if (!isBuild || !existsSync(derivativesDir)) return
      cpSync(derivativesDir, outDir, { recursive: true })
    },
  }
}

/*
 * GitHub Pages serves `404.html` for any path it cannot resolve to a file.
 *
 * Because this repository is the organisation root Pages site, Vite's `base`
 * stays "/" and every asset URL in index.html is absolute. That means a byte
 * copy of index.html works as the SPA fallback: GitHub Pages serves it without
 * rewriting the URL, the same bundle boots, and React Router reads the real
 * pathname and renders the right route. No redirect hop, no flicker.
 *
 * Documented tradeoff: those responses still carry HTTP status 404 even though
 * the correct page renders. Users and browsers do not notice; crawlers may.
 * If HTTP 200 on deep links ever matters, the fix is prerendering, not a
 * redirect hack.
 *
 * This must be verified on the real GitHub Pages deployment in Stage 6 —
 * `vite preview` uses its own fallback behaviour and does NOT prove that
 * GitHub Pages will behave the same way.
 */
function githubPagesSpaFallback() {
  let outDir

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) {
        copyFileSync(index, resolve(outDir, '404.html'))
      }
    },
  }
}

/*
 * sitemap.xml, generated from the published content rather than maintained.
 *
 * Writing it by hand would mean remembering to add a line every time a method
 * is published — and, worse, remembering to remove one when a page goes back
 * to draft, which is exactly the mistake that would advertise unreviewed
 * science to a search engine.
 */
function sitemap() {
  let outDir

  return {
    name: 'tsr-sitemap',
    apply: 'build',

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },

    async closeBundle() {
      const paths = await collectCanonicalPaths(
        resolve(process.cwd(), 'src/content'),
      )
      writeFileSync(
        resolve(outDir, 'sitemap.xml'),
        renderSitemap(paths, SITE_ORIGIN),
      )
      this.info(`sitemap.xml: ${paths.length} canonical URLs`)
    },
  }
}

export default defineConfig({
  plugins: [react(), imageOptimizer(), sitemap(), githubPagesSpaFallback()],

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
})
