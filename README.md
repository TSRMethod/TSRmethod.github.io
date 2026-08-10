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
npm install
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

The site is mid-rebuild, so the tree below marks what exists today and what is
still planned. Directories marked *(planned)* have not been created yet.

```
src/
  app/          App shell, route table, site-wide configuration
  components/
    shared/     Small widely-used pieces (error boundary, scroll handling)
    layout/     (planned) Header, navigation, footer, page layout
    method/     (planned) Reusable building blocks for method/tutorial pages
  content/      (planned) Editable content — Markdown and JSON, no React
  pages/        One folder per top-level page
  hooks/        Reusable React hooks
  styles/       Design tokens, reset, global base styles
  test/         Test setup

public/
  images/       (planned) Content images, referenced from Markdown and JSON
```

### Two rules worth keeping

**Content lives in `src/content`, not in components.** Method write-ups and
tutorials are Markdown; people, publications, repositories and site settings
are JSON. React components decide *how* things look; content files decide
*what* the site says. This is what will let a non-technical editor update the
science through a CMS without touching code.

**Styling goes through design tokens.** Colours, spacing and type sizes are
defined once in `src/styles/tokens.css`. Component styles are CSS Modules
(`Component.module.css`) placed next to the component. Avoid adding global
element rules — the previous site defined `code` and `table` styles globally
and they leaked into every page.

## Deployment

GitHub Pages, from this repository (`TSRMethod/TSRmethod.github.io`), via
GitHub Actions. Because this is the organisation root Pages site, Vite's `base`
stays `/`.

Routing uses `BrowserRouter`. The build writes `dist/404.html` as a copy of
`dist/index.html` so that GitHub Pages serves the app for deep links such as
`/methods/mirror-image` — see the comment in
[`vite.config.js`](vite.config.js) for how this works and its one tradeoff.

## Rebuild in progress

This site is being rebuilt from an earlier Create React App version. Content is
migrating in stages; some method pages are still marked as drafts and are
deliberately absent from the navigation until their content has been reviewed.
