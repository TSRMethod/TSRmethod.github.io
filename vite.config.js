import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { optimizeImages, formatSummary } from './scripts/optimize-images.mjs'
import { collectCanonicalPaths, renderSitemap } from './scripts/site-routes.mjs'

const SITE_ORIGIN = 'https://tsrmethod.github.io'
const SSR_OUT_DIR = 'node_modules/.cache/tsr-ssr'

const VIRTUAL_MANIFEST = 'virtual:image-manifest'
const MANIFEST_FILE = resolve(process.cwd(), 'node_modules/.cache/tsr-image-manifest.json')
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
  let isSsrBuild = false
  let outDir

  return {
    name: 'tsr-image-optimizer',

    config(_config, env) {
      isBuild = env.command === 'build'
      isSsrBuild = Boolean(env.isSsrBuild)
    },

    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },

    async buildStart() {
      if (!isBuild) return

      /*
       * The prerender's server build must give OptimizedImage the same
       * manifest as the browser build, or the HTML it writes would name
       * different image files from the ones React expects when it takes the
       * page over. So it reads what the browser build wrote, rather than
       * optimising every image a second time.
       */
      if (isSsrBuild) {
        if (!existsSync(MANIFEST_FILE)) {
          this.error('run the browser build first: no image manifest at ' + MANIFEST_FILE)
        }
        manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'))
        return
      }

      rmSync(derivativesDir, { recursive: true, force: true })

      const result = await optimizeImages({
        publicDir: resolve(process.cwd(), 'public'),
        contentDir: resolve(process.cwd(), 'src/content'),
        outDir: derivativesDir,
      })

      manifest = result.manifest
      mkdirSync(dirname(MANIFEST_FILE), { recursive: true })
      writeFileSync(MANIFEST_FILE, JSON.stringify(manifest))
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
      if (!isBuild || isSsrBuild || !existsSync(derivativesDir)) return
      cpSync(derivativesDir, outDir, { recursive: true })
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
    apply: (_config, env) => env.command === 'build' && !env.isSsrBuild,

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

/*
 * Two builds, run in turn by `npm run build`:
 *
 *   vite build        the site itself, into dist/
 *   vite build --ssr  the same app compiled for Node, which
 *                     scripts/prerender.mjs runs to write each page's HTML
 *
 * The second is a build tool, not part of the site: it goes to
 * node_modules/.cache and is never published. See docs/DEPLOYMENT.md.
 */
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), imageOptimizer(), sitemap()],

  build: isSsrBuild
    ? {
        outDir: SSR_OUT_DIR,
        emptyOutDir: true,
        copyPublicDir: false,
        /*
         * .mjs, because Node reads a plain .js file under node_modules/ as
         * CommonJS: the "type": "module" in this repository's package.json
         * does not reach past a node_modules folder.
         */
        rollupOptions: {
          output: { entryFileNames: '[name].mjs', chunkFileNames: 'assets/[name]-[hash].mjs' },
        },
      }
    : {
        /*
         * Read by the prerender to link each page's lazily loaded stylesheet
         * in its HTML, then deleted from dist/ — see scripts/prerender.mjs.
         */
        manifest: true,
      },

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
}))
