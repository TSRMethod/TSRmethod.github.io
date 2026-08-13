# TSR Research Group — website

Source for <https://tsrmethod.github.io/>.

A static site documenting the Triangular Spatial Relationship (TSR) method, the
TSR-derived methods built on it, the associated Python packages, publications
and the research group.

Built with React 19 + Vite. Plain JavaScript/JSX — no TypeScript, no CSS
framework, no backend.

---

## Requirements

Node **24** — see [`.nvmrc`](.nvmrc) and the `engines` field in
`package.json`. The project standardises on a single major version rather than
a range: Vite 8 needs 20.19+/22.12+, but ESLint 10 additionally rejects 22.12,
so a wider range would only invite confusing failures.

```bash
nvm use
npm ci      # clean install matching package-lock.json; use `npm install` only
            # when you are deliberately changing dependencies
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload, <http://localhost:5173> |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint over the whole project |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

Run `npm run lint`, `npm test` and `npm run build` before committing.

## Project layout

```
src/
  app/          App shell, route table, navigation, site-wide configuration
  components/
    layout/     Header, navigation, footer, page layout
    shared/     Small widely-used pieces (error boundary, scroll handling)
    method/     Reusable building blocks for method/tutorial pages
    home/       The home page's sections
  content/      Editable content — Markdown and JSON, no React. See its README.
  lib/          Content plumbing (frontmatter parsing, heading extraction)
  pages/        One folder per top-level page — Home, Publications, People,
                Software, Contact, 404
  hooks/        Reusable React hooks
  styles/       Design tokens, reset, global base styles
  test/         Test setup

public/
  images/       Content images, referenced from Markdown and JSON
```

Every public page now exists: the home page, the method and analysis tutorials,
`/publications`, `/people`, `/software` and `/contact`. The navigation and the
footer still ask the router whether a path resolves before showing it, so a
page can never be advertised before it is built — that is what let each of them
appear on its own as it was added.

### Two rules worth keeping

**Content lives in `src/content`, not in components.** Method write-ups and
tutorials are Markdown; people, publications, repositories and site settings
are JSON. React components decide *how* things look; content files decide
*what* the site says. This is what will let a non-technical editor update the
science through a CMS without touching code.
[`src/content/README.md`](src/content/README.md) documents the format and is
written for that editor, not for developers.

**Styling goes through design tokens.** Colours, spacing and type sizes are
defined once in `src/styles/tokens.css`. Component styles are CSS Modules
(`Component.module.css`) placed next to the component. Avoid adding global
element rules — the previous site defined `code` and `table` styles globally
and they leaked into every page.

## Deployment

```
branch  →  pull request  →  CI  →  merge to main  →  deploy workflow  →  live
```

GitHub Pages, from this repository (`TSRMethod/TSRmethod.github.io`), via
GitHub Actions. Because this is the organisation root Pages site, Vite's `base`
stays `/`.

Nothing is published from a branch, and no deployment happens without lint,
tests, content validation and a successful build passing first. **Content
edits made through Pages CMS are ordinary commits and go through the same
checks** — if one would break the site, the deployment fails and the live site
stays as it was.

Routing uses `BrowserRouter`. The build writes `dist/404.html` as a copy of
`dist/index.html` so that GitHub Pages serves the app for deep links such as
`/tsr` — see the comment in [`vite.config.js`](vite.config.js) for how this
works and its one tradeoff.

Full details, including first-time Pages setup and how to verify a
deployment: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Rebuild in progress

This site is being rebuilt from an earlier Create React App version. Content is
migrating in stages; some method pages are still marked as drafts and are
deliberately absent from the navigation until their content has been reviewed.
