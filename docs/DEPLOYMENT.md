# Deployment

For developers and maintainers. Editors should read
[CONTENT-EDITOR-GUIDE.md](CONTENT-EDITOR-GUIDE.md) instead.

## How a change reaches the live site

```
branch  →  pull request  →  CI  →  merge to main  →  deploy workflow  →  live
```

Nothing is published from a branch. `main` is the only source of the live
site, and even a push to `main` is built and tested before anything is
deployed.

**Content edits made in Pages CMS are ordinary Git commits.** They go through
the same build and the same checks. If a CMS edit would break the site, the
deploy workflow fails and **the previously deployed site stays online
untouched** — the failure blocks the update, it does not take the site down.

## The two workflows

### `.github/workflows/ci.yml`

Runs on pull requests to `main`, on pushes to `main`, and on pushes to
`refactor/site-foundation` while the rebuild is in progress.

`npm ci` → `npm run lint` → `npm test` → `npm run build` →
`npm run check:dist` (the built pages, see below).

Read-only permissions; publishes nothing.

### `.github/workflows/deploy-pages.yml`

Runs on pushes to `main`, or manually from the Actions tab.

Two jobs. `build` repeats every CI check and then uploads `dist/` as a Pages
artifact. `deploy` runs only if `build` succeeded. There is no path to the
deploy step that skips validation.

`concurrency: pages` with `cancel-in-progress: false` — a queued deployment
may be skipped, but one that has started is allowed to finish, so production
is never left half-published.

## Action versions

| Action | Version |
| --- | --- |
| `actions/checkout` | v7 |
| `actions/setup-node` | v7 |
| `actions/configure-pages` | v6 |
| `actions/upload-pages-artifact` | v5 |
| `actions/deploy-pages` | v5 |

All are first-party GitHub actions, pinned to a major version so they receive
patches. For stricter supply-chain hardening they can be pinned to commit
SHAs, at the cost of needing manual updates.

Node comes from [`.nvmrc`](../.nvmrc) via `node-version-file`, so CI and local
development cannot drift apart.

## Routing on GitHub Pages

This repository is the organisation **root** Pages site
(`https://tsrmethod.github.io/`), so Vite's `base` stays `/`. It must **not**
be set to `/TSRmethod.github.io/` — that is only for project sites served from
a subpath.

The app uses `BrowserRouter`, and **every published page is prerendered**:
`npm run build` writes an HTML file for each one, so GitHub Pages answers a
direct visit or a refresh with HTTP 200 and that page's own content and
metadata.

### How GitHub Pages resolves an address

Observed on GitHub Pages, and relied on here:

| Request | Served |
| --- | --- |
| `/people` | `people.html`, **200** |
| `/software` | `software.html`, **200**, even with a `software/` folder beside it |
| `/people/` | 404 (`people.html` is not a folder's index) |
| `/methods` (a folder, no index) | 301 to `/methods/`, then 404 |
| anything else | `404.html`, **404** |

So each canonical address, which never ends in a slash, becomes
`<path>.html`; the home page is `index.html`.

### What the build writes

`npm run build` runs three steps:

1. `vite build`: the site, into `dist/`, plus `sitemap.xml`.
2. `vite build --ssr src/entry-server.jsx`: the same app compiled for
   Node, into `node_modules/.cache/tsr-ssr/`. Never published.
3. `node scripts/prerender.mjs`: renders each page with that build and
   writes:
   - **one file per sitemap URL** (`publications.html`,
     `methods/drug-tsr.html`, …). Each holds the page's rendered content,
     its own `<title>`, description, canonical URL and `og:` tags, and
     structured data on the home and BioTSR pages. It also links the page's
     lazily loaded stylesheet, so the first paint is styled;
   - **`404.html`**, the not-found page, marked `noindex` with no canonical.
     GitHub Pages serves it with a real 404 for every unknown address;
   - **a redirect page for each old address** (`mirror-image.html`,
     `source-code.html`, …). Each forwards at once, keeping any `#section`,
     and is `noindex` with a canonical pointing at the new page.

In the browser, `src/main.jsx` *hydrates* the prerendered HTML (React takes it
over rather than drawing it again), so navigation, menus, anchors and
analytics behave as before. An address in another form (`/people/`,
`/people.html`, `/People`) is sent to the page's own address before anything
renders. The development server and the 404 page are drawn from scratch as
before.

Two things must stay true for hydration to work, and tests hold both:

- **The first render must not depend on the browser.** Width-dependent
  markup (the navigation, a method page's "On this page") renders both forms
  until the screen is measured, with CSS showing the right one
  (`useMediaQuery` returns `undefined` then). Scroll reveals start shown on a
  prerendered page and re-arm only below the fold.
- **A lazily loaded route component must be listed** in `LAZY_SOURCES` in
  `src/entry-server.jsx`, so its stylesheet is linked in the page's HTML.

`npm run check:dist` then reads `dist/` as GitHub Pages will serve it. Every
sitemap URL must have its file, a unique title, a description, one `<h1>`, a
canonical and `og:url` equal to the sitemap entry, and content in document
order. Any other HTML file must be a redirect into the sitemap. The `og:image`
must exist at its declared size, and no analytics tag may be written into the
HTML. CI and the deploy workflow both run it.

`public/.nojekyll` stops GitHub applying Jekyll processing to the output.

## First-time setup (once, by a maintainer)

> ### The Pages source must be changed before this works
>
> GitHub Pages is **already enabled** on this repository, but with the older
> **"Deploy from a branch"** source pointing at `main`. That publishes the
> repository root as-is, with no build step. It is why
> <https://tsrmethod.github.io/> currently returns a blank page: it is serving
> the unbuilt `index.html`, whose `<script src="/src/main.jsx">` does not
> exist as a served file.
>
> Merging without changing this will **not** fix the site. The branch builder
> would publish the raw source again, and `actions/deploy-pages` fails when
> the source is not set to GitHub Actions.

1. **Settings → Pages → Build and deployment → Source: _GitHub Actions_.**
   This is the step that switches publishing from the raw branch to the
   workflow in this repository. It can be done before or after the merge.
2. Merge the release pull request into `main`.
3. Watch the run in the Actions tab. The `deploy` job prints the live URL.
4. Run through the verification list below.

## Verifying a deployment

Local `npm run preview` does **not** prove GitHub Pages behaviour — it has its
own fallback handling. These must be checked on the real site:

- `https://tsrmethod.github.io/` loads
- `https://tsrmethod.github.io/tsr` loads **when typed directly**, with
  **HTTP 200** and its own `<title>` in the raw HTML
  (`curl -sI https://tsrmethod.github.io/tsr`, then `curl -s … | grep '<title>'`)
- refreshing the browser while on `/tsr` still works
- an invalid URL such as `/no-such-page` shows the site's own 404 page, with
  **HTTP 404**
- an old address such as `/mirror-image` lands on `/methods/mirror-image`
- CSS, JavaScript and images all load

## Media uploads through the CMS

`src/content/pages-cms.test.js` pins the two paths that have to agree:

```yaml
media:
  input: public/images/uploads    # where the file is committed
  output: /images/uploads         # what gets written into the content file
```

Vite's `base` is `/`, so the absolute output path resolves both locally and on
GitHub Pages, and uploads stay separate from `public/images/methods`,
`public/images/people` and `public/images/home`, which developers curate.

### Verified live on 14 August 2026

This was previously untested — the tests could show the configuration was
self-consistent, not that Pages CMS writes where it says it does. It has now
been run for real, by changing a portrait through the CMS, and **the upload
flow works exactly as configured**:

- the image was committed under `public/images/uploads/`, with the filename
  slugified as `media.rename: safe` specifies;
- the content record received the root-relative `/images/uploads/…` form;
- the change arrived as an ordinary commit and went through CI like any other.

CI did fail on that first upload, and it is worth being precise about why:
**the upload was correct and the test was wrong.** `records.test.js` asserted
that every portrait path began `/images/people/`, which held only while
developers were the only people adding portraits. Both approved roots are now
accepted, and a photo's existence is checked by resolving its path under
`public/` rather than by listing one folder. Nothing in `.pages.yml` changed.

**The CMS does not resize or optimise what it is given.** The portrait uploaded
in this test is 1474 × 1474 and 270 KB for a slot about 88 px wide; curated
portraits are capped and converted to webp by hand. An editor uploading a photo
straight from a phone will ship it at full size.

### Running the check again

Worth repeating if `media.input` or `media.output` is ever changed:

1. Sign in at <https://app.pagescms.org> and open the site.
2. Go to **Method & tutorial pages** and click **Add** — a new page is created
   as a draft and cannot reach the live site, which is what makes it safe to
   use as a test.
3. Set the **Title** to `Media upload test`.
4. Under **Main illustration**, upload any small PNG or JPEG, and write a line
   of alt text.
5. **Save.**
6. In GitHub, check that the commit contains:
   - the image, under `public/images/uploads/`, with a slugified filename;
   - `src/content/methods/media-upload-test.md`, whose `figure.src` begins
     `/images/uploads/`.
7. Wait for CI on `main` to pass. The page is a draft, so nothing appears on
   the live site.
8. **Clean up:** delete both files. The CMS does not allow deleting a method,
   so do it in Git — `git rm` the two paths, commit and push.

If step 6 shows a different folder or a path without the leading slash, fix
`media.input` / `media.output` in `.pages.yml` together and re-run the tests.

## Local commands

```bash
nvm use          # Node 24
npm ci           # clean install matching package-lock.json
npm run dev      # development server
npm run lint
npm test
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

Run lint, tests and build before pushing — they are exactly what CI runs.

## Rolling back

Revert the offending commit on `main` and push. The deploy workflow runs again
and republishes the previous state. There is no separate rollback button.

## The website QR code

`public/share/tsr-website-qr.svg` and `public/share/tsr-website-qr.png`
encode `https://tsrmethod.github.io/` directly, with no shortener or tracking
service in between. Offered for download on the Contact page, and meant for
posters and slides as well.

- QR version 3, error correction level Q (about 25% recoverable), 29 × 29
  modules with the standard 4-module quiet zone. Black on white, no logo.
- SVG: filled squares on an explicit white background, scalable for print.
  PNG: 2035 × 2035 pixels, 1-bit, white background, tagged 600 dpi (about
  86 mm square at that resolution).
- Generated with [segno](https://pypi.org/project/segno/) 1.6.6. Both files,
  and the SVG rasterised at 120 to 3000 pixels, were decoded with zxing-cpp
  3.1.1 and OpenCV 5.0. Every decode returned exactly
  `https://tsrmethod.github.io/`. The one OpenCV miss, at 3000 pixels, is that
  decoder's limit at very large sizes: the same image decodes once scaled
  down, and its modules match the encoder's matrix one for one.

They never need regenerating while the address stays the same. If it ever
changes, make new files and decode both before replacing these.
`Contact.test.jsx` checks the properties an edit could break: the white
background, the quiet zone and the PNG size.

## The social preview image

`public/share/social-card.png`, 1200 × 630, is the `og:image` of every page.
It is drawn by `scripts/social-card.mjs` from the favicon's geometry and the
group's name and tagline in `src/content/site.json`. That script is not part
of the build, so the committed PNG is what gets published. It lives outside
`public/images/` so that the image optimiser leaves it exactly as committed.
