import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    /*
     * Test files and build configuration run under Node, not in the browser,
     * so they may use Node globals and APIs. Application code under src/ may
     * not — keeping that boundary is the point of listing these explicitly
     * rather than enabling Node globals everywhere.
     */
    files: ['**/*.test.{js,jsx}', 'src/test/**/*.js', 'vite.config.js', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    /*
     * The build-time renderer is a module for scripts/prerender.mjs, never
     * hot-reloaded in the browser, so the Fast Refresh rule does not apply.
     */
    files: ['src/entry-server.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
