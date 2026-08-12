import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

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

export default defineConfig({
  plugins: [react(), githubPagesSpaFallback()],

  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
})
