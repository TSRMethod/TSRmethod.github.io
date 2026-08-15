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

`npm run build` also optimises every image and writes `sitemap.xml`; both are
part of the ordinary build, so deployment gets them without a second step.

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
    uploads/    Pages CMS uploads
    brand/      The site mark, derived from assets/brand/
  robots.txt    Crawling policy; sitemap.xml is generated at build time

scripts/        Build-time tooling — image optimisation, sitemap routes
assets/brand/   Logo masters. NOT served; see its README for what is derived
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

## Images are optimised automatically

**Nobody has to prepare an image before using it** — not a developer, and
certainly not somebody editing through the CMS. Upload the best quality you
have and the build does the rest.

During `npm run build`, [`scripts/optimize-images.mjs`](scripts/optimize-images.mjs)
reads everything under `public/images/` and writes, into `dist/` only:

- responsive **WebP** derivatives at several widths (`photo.w320.webp`);
- a re-encoded copy of the original at its own URL, as the fallback.

`public/` is never touched, and **the path stored in content never changes**.
`OptimizedImage` renders a `<picture>` when derivatives exist and a plain
`<img>` when they do not, which is why the dev server and the tests work with
no image build at all, and why a freshly uploaded photo is never broken.

Two profiles, because a face and a labelled diagram need opposite things:
portraits are capped at 600 px, figures at 1600 px with a higher quality floor.
A portrait uploaded through the CMS lands in `/images/uploads/` beside the
diagrams, so the profile is chosen by consulting the People records rather than
by folder.

Current effect: 3.5 MB of source images are delivered as about 1.0 MB.

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

## Handing this over

The rebuild from the earlier Create React App site is complete. Every page is
live; three legacy pages remain unpublished because their *content* has known
problems, not because anything is unbuilt — see
[`CONTENT-REVIEW.md`](CONTENT-REVIEW.md), which is the list of questions only
an author can answer.

Where to look, depending on what you need to do:

| I want to… | Read |
| --- | --- |
| Change what a page says | [`src/content/README.md`](src/content/README.md) |
| Do that without touching code | [`docs/CONTENT-EDITOR-GUIDE.md`](docs/CONTENT-EDITOR-GUIDE.md) |
| Understand how it deploys | [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) |
| Replace the logo | [`assets/brand/README.md`](assets/brand/README.md) |
| Know what still needs an author | [`CONTENT-REVIEW.md`](CONTENT-REVIEW.md) |

### The five things worth knowing before changing anything

1. **Content decides, code renders.** Publishing a method is setting
   `status: published` in a Markdown file. Its route, its menu entry, its place
   on the home page and its line in `sitemap.xml` all follow from that — there
   is no list to update, and no way to publish a page that is not routed.

2. **A draft is invisible, completely.** No route, no menu entry, no link, no
   sitemap entry. Typing the address gives a 404. This is what keeps unreviewed
   science off a public site, and it is enforced in the loader rather than by
   remembering.

3. **The CMS cannot break the architecture.** Fields that decide a URL, a menu
   or publication are hidden from the editor and preserved on save
   (`settings.content.merge: true`). Everything an editor *can* change is
   validated at build time, so a bad save fails the build and the live site
   keeps its last good version.

4. **Nothing about a repository is written in a component.** Names, URLs,
   owners and descriptions live in `src/content/repositories/`. When the
   planned consolidated TSR package arrives, pointing the site at it is an edit
   to one JSON file — a test fails if a GitHub account name ever appears in the
   software page's JSX.

5. **Run it on Node 24.** `nvm use`. On an older Node the test suite fails with
   an error that looks like a broken dependency and is really a version
   mismatch.

### Deliberately not done

Documenting the current Python packages' APIs in any depth. They are expected
to be consolidated into a single package, and a second copy of today's import
paths would be wrong the day that happens. The method pages carry verified
usage; the software page is a directory that points at the authoritative
repositories.
