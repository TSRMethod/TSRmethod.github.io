# Editing site content

Everything the website *says* lives in this folder. Nothing here is React
code, and you do not need to know React to change any of it.

Components decide how content looks. Files in this folder decide what it says.

```
src/content/
  methods/          one Markdown file per method or tutorial page
    tsr.md
  analysis/         the same, for key analysis and visualisation tools
  people/           one JSON file per group member
  publications/     one JSON file per paper
  repositories/     one JSON file per software repository
  site.json         group name, description, contact address, affiliations
  home.json         the wording on the home page
  pages.json        the wording on the publications, people, software and
                    contact pages
  README.md         this file
```

Images go in `public/images/` and are referenced by path, for example
`/images/methods/tsr-method.png`.

---

## Method pages

Each method page is one Markdown file in `methods/`. **The filename becomes
the web address**, so `methods/mirror-image.md` is served at
`/methods/mirror-image`.

A file has two parts: a block of settings at the top between `---` lines
(the *frontmatter*), and the page text below it (the *body*).

### Frontmatter fields

| Field | Required | What it is |
| --- | --- | --- |
| `slug` | yes | URL segment. **Must match the filename.** |
| `title` | yes | Full page heading. |
| `shortTitle` | no | Shorter label for the navigation menu. |
| `summary` | yes | One or two sentences. Used in listings and previews. |
| `status` | yes | `published` or `draft`. See below. |
| `category` | yes | `core`, `method`, or `analysis`. Sets the URL prefix. |
| `group` | yes | Which sub-heading of the menu it appears under. |
| `order` | no | Sort position within its group. Lower comes first. |
| `figure` | no | Main illustration: `src`, `alt`, optional `caption`. |
| `paper` | no | The publication: `title`, `authors`, `journal`, `year`, `doi`. |
| `repositories` | no | List of code repositories: `name`, `url`, `description`, `language`. |
| `slurm` | no | HPC job instructions. See below. |
| `references` | no | Further reading: list of `title` and `url`. |
| `review` | no | Flags the page as needing author review. |

`category` decides where the page lives:

| `category` | URL | Menu |
| --- | --- | --- |
| `core` | `/tsr` | TSR Method |
| `method` | `/methods/<slug>` | TSR-Based Methods |
| `analysis` | `/analysis/<slug>` | Key Analysis & Visualization |

### `status`: publishing a page

**A file with no `status` is a draft.** This is what makes CMS-created pages
safe: Pages CMS writes only the editorial fields, so a new method arrives with
no `status`, no `category` and no `group`, and is therefore unpublished and
unrouted until a maintainer places it.

`status: draft` keeps a page **completely off the website** — not in the menu,
and not reachable by typing the address.

#### Publishing a draft (maintainer task)

1. Read the page and satisfy yourself the science is right.
2. Set `category` (`core`, `method` or `analysis`) — this decides the URL.
3. Set `group` to one of the values in `src/app/navigation.js` — this decides
   the menu section. Adding a *new* group is a code change.
4. Optionally set `order`.
5. Set `status: published`.
6. Run `npm test`. Publication is strictly validated: a published page missing
   a category, group, summary, body, or alt text on its figure fails the
   build. Nothing goes live half-configured.

The route and the navigation entry then appear on their own — there is no list
of pages to update.

#### What a draft may omit

| Field | Draft | Published |
| --- | --- | --- |
| `title` | required | required |
| `slug` | derived from filename | derived, or must match if written |
| `summary` | optional | required |
| body | may be empty | required |
| `status` | absent means draft | required to be `published` |
| `category`, `group` | optional | **required** |
| `order` | optional | optional |
| `figure.alt` (if a figure is set) | optional | **required** |

Structural mistakes — a `figure` with no `src`, a repository with no `url`, a
`slurm` block with no script — fail at any status. Those are errors, not
absences.

This is a *scientific* sign-off, not a technical one. It means "the content on
this page has not been approved". Two pages are currently draft because their
content has known problems; see `CONTENT-REVIEW.md` in the project root.

Setting `status: published` is how a page goes live, and it should only be
done by someone who can vouch for the science.

> A published page also needs its route to be built before it appears. That
> part is handled automatically in code — you cannot make a link appear before
> the page can be displayed, and you do not need to think about it.

### Alt text is required

If you add a `figure`, you must write `alt` text describing what the image
shows. The build fails without it. This is what a screen reader reads aloud in
place of the picture, so describe the content, not the file:

```yaml
figure:
  src: /images/methods/tsr-method.png
  alt: >-
    Triangles constructed between Cα atoms of a protein backbone, each
    labelled with its computed integer key.
```

---

## Writing the body

The body is ordinary Markdown.

### Headings become the section menu

`##` headings become the sections listed in the page's side navigation, and
`###` headings become entries beneath them. Nothing else is needed to build
that menu — write the headings and it appears.

Use `##` for the major sections of the page. A typical method page uses:

```markdown
## Overview
## Installation
## Usage
## Examples
```

but a page is free to use whatever sections suit it. A command-line tool with
no Python API can just as well have `## Overview`, `## Installation`,
`## Commands`, `## Output files`.

### Code

Use fenced code blocks and always say what language it is. The language
appears as a label on the block, and readers get a copy button.

````markdown
```python
from tsr_package.tsr.TSR import TSR
TSR(data_dir, input_files, chain=chain, output_option="keys")
```

```bash
python common_keys.py --path input_dir
```
````

### Tables

Use Markdown tables for anything tabular — parameter documentation, the
expected format of an input CSV, the columns of an output file. Long tables
scroll sideways on small screens rather than squashing.

```markdown
| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `output_option` | `str` | `"keys"` | One of `keys`, `triplets` or `both`. |
```

### Images inside the body

```markdown
![Clustering dendrogram of kinase structures](/images/methods/cluster.jpg)
```

The text in square brackets is the alt text. Write it properly.

### Notes and warnings

A blockquote becomes a highlighted note:

```markdown
> Chain IDs are case-sensitive and must match those in the PDB file.
```

---

## Slurm / HPC instructions

Slurm instructions recur across the TSR packages and always have the same
shape, so they are written as **fields** rather than free text. That lets
every package present them identically while keeping the actual commands,
scripts and resource requests specific to that package.

```yaml
slurm:
  intro: A basic Slurm script to submit this job looks like this.
  script:
    filename: run_tsr.sbatch
    code: |
      #!/bin/bash
      #SBATCH -p workq
      #SBATCH -n 64
      #SBATCH -t 72:00:00
      #SBATCH -A your_allocation
      #SBATCH -J tsr

      python3 -m venv myenv
      source myenv/bin/activate
      pip install -r requirements.txt
      python3 generate_keys.py
  submit:
    code: sbatch run_tsr.sbatch
  resources: Requests one node with 64 tasks for up to 72 hours.
  notes: Replace the allocation name with your own.
```

`script.code` and `submit.code` are required if you include a `slurm` block.
The `|` after `code:` means "keep the following lines exactly as written",
which is what preserves the script's line breaks.

**Never put resource values in the code.** Partitions, node counts, wall times
and allocation names differ per package and per cluster, and belong here.

---

## The other files

### `site.json`

Group name, description, tagline, public contact address and the list of
affiliations shown in the footer.

Changing `email` here changes it everywhere on the site — it is not repeated
anywhere else.

### `home.json` and `pages.json`

The words on the home page, and the headings and prose on the publications,
people, software and contact pages.

These files hold **what the pages say, and nothing about how they are built.**
There is no field for a link target, a section order or a layout, because those
are decided in code — and every list on the home page (the methods, the tools,
the packages, the recent papers, the faculty) is read from the folders above,
so there is no list to keep up to date here. Publish a method and it appears on
the home page by itself; add a repository and it appears on the software page.

The contact page holds no email address either — it reads the one in
`site.json`, which is also what the footer and the home page use.

Every field in these two files is required, because each one is visible text on
the page. Clearing one fails the build rather than putting a blank heading or
an unlabelled button on the site.

### `people/`

One file per person, named after the `id`:

```json
{
  "id": "wu-xu",
  "name": "Wu Xu",
  "role": "Professor and Department Head, Chemistry",
  "affiliation": "University of Louisiana at Lafayette",
  "group": "faculty",
  "status": "current",
  "order": 1,
  "bio": "…",
  "email": "wu.xu@louisiana.edu",
  "photo": "/images/people/wu-xu.jpg"
}
```

`status` is `current` or `former`, and decides which half of the people page
someone appears in. `group` is `faculty`, `postdoc`, `student`, `undergraduate`
or `collaborator`; the home page shows the faculty, and takes who they are from
this field.

`photo` may point at either `/images/people/…` (curated by a developer) or
`/images/uploads/…` (uploaded through the CMS). Both are approved; anywhere
else fails the build. See [Media](#media).

**Leave a field out entirely if you do not have it.** Do not put in an empty
string or a placeholder — the old site rendered "Phone:" followed by nothing
for nine people, and empty `mailto:` links. An empty value is now an error that
stops the build; an absent field is simply not shown.

### `publications/`

One file per paper, named after the `id`:

```json
{
  "id": "kondra-2021-tsr-method",
  "title": "…",
  "authors": ["Sarika Kondra", "Titli Sarkar"],
  "venue": "Frontiers in Chemistry",
  "year": 2021,
  "volume": "8",
  "pages": "602291",
  "doi": "10.3389/fchem.2020.602291",
  "abstract": "…"
}
```

`authors` is a list, **one name per entry** — not one long string. Give `doi`
where there is one, as the bare identifier (`10.3389/…`, no `https://`); the
link is built from it.

`year` is the year of the version of record: the print or issue year where
there is one, otherwise the year it appeared online. The publications page is
grouped by that year, newest first, and the home page shows the three most
recent — so adding a paper updates the home page with nothing else to do.

One record per paper. A paper credited on two method pages still gets one
record here, and a repeated DOI stops the build.

`volume`, `issue`, `pages` and `abstract` are all optional, and the citation
line is assembled from whichever are present without leaving stray commas.

### `repositories/`

One file per repository. These are what the software page lists.

```json
{
  "id": "tsr-package",
  "name": "TSR-Package",
  "url": "https://github.com/pooryakhajouie/TSR-Package",
  "description": "…",
  "language": "Python",
  "category": "core",
  "kind": "package",
  "issuesUrl": "https://github.com/pooryakhajouie/TSR-Package/issues",
  "order": 1
}
```

`category` decides which section of the software page the entry appears under:
`core` for the main TSR software, `method` for the specialised packages,
`analysis` for tools that work on keys once they exist.

`kind` is `package` for something a user installs, or `scripts` for research
code that is run where it sits. It is printed on the entry, so that nothing on
the page implies a maintained release where there is not one.

`issuesUrl` is optional and is a commitment: filling it in puts a "Report a
problem" link on the entry, so only set it for a repository whose issues
somebody actually reads.

**Which pages a repository documents is not stored here.** It is worked out by
matching this `url` against the `repositories` block in each method page's
frontmatter, so the two can never disagree, and a page that is still a draft
never appears.

**Moving a repository is one edit.** Change `url` and everything follows: the
link, the `owner/name` shown on the card, and the match to its documentation.
Nothing about any repository — no name, no account, no address — appears in the
React components.

---

## If something goes wrong

Content is checked when the site is built, and a bad file stops the build with
a message naming the file and the problem, for example:

```
./methods/mirror-image.md: slug "mirror-images" does not match the
filename "mirror-image.md". They must agree so the URL is predictable
from the file.
```

This is deliberate. A page with a broken reference never reaches the public
site; you get told instead.

Common causes:

- the `slug` and the filename differ
- a `figure` with no `alt`
- `status` spelled something other than `published` or `draft`
- indentation wrong in the frontmatter — YAML cares about spaces, and does not
  accept tabs
- a `slurm` block missing `script.code` or `submit.code`

---

## The CMS (`.pages.yml`)

Content is edited through [Pages CMS](https://pagescms.org) at
<https://app.pagescms.org>. The editor-facing instructions are in
[`docs/CONTENT-EDITOR-GUIDE.md`](../../docs/CONTENT-EDITOR-GUIDE.md); this
section is about the configuration.

`.pages.yml` in the repository root defines what the CMS shows. It is the
safety boundary between content and architecture, so treat changes to it with
the same care as changes to routing.

### Three rules

**1. `settings.content.merge: true` must stay.** Pages CMS otherwise rewrites a
file from its schema alone and *deletes every key it was not told about*.
Without this, the first CMS save of a method page would strip `slug`,
`category`, `group`, `order` and `status`, breaking the route and un-publishing
the page. This is the single most dangerous default in the tool.

**2. Architectural fields are `hidden: true`, not omitted.** A hidden field is
still part of the schema, so its value is read and written back untouched,
while never appearing in the editor. Omitting it instead would rely entirely on
rule 1.

**3. `status` is never editable.** It is what keeps unreviewed science off the
site. Publishing is a maintainer action performed in the repository.

`src/content/pages-cms.test.js` enforces all three, plus that every content
path exists and that every key in the real content files is representable. If
you change `.pages.yml`, run the tests.

### Extending the schema for a new content type

1. **Add the content first.** Create the folder and a representative file, and
   teach `src/content/index.js` to load and validate it. The CMS describes
   content that already works; it does not define it.

2. **Add a `content` entry to `.pages.yml`.**

   ```yaml
   - name: datasets              # internal id
     label: Datasets             # what the editor sees
     type: collection            # folder of files; use `file` for a single one
     path: src/content/datasets
     format: json                # or yaml-frontmatter for Markdown pages
     filename: '{fields.id}.json'
     view:
       primary: name             # column shown in the list
       fields: [name, year]
     fields: [...]
   ```

3. **Classify every field.** For each key ask: *would changing this alter a
   URL, a menu, or whether something is published?* If yes it is architecture —
   declare it `hidden: true`. If no, expose it with a `label` and a plain
   `description` written for a non-programmer.

4. **Decide the operations.** Collections that should grow (people,
   publications) allow create and delete. Collections whose members are tied to
   routes (methods) set `operations: { create: false, rename: false,
   delete: false }`.

5. **Extend the test.** Add the new entry to the cases in
   `pages-cms.test.js` so its paths and fields stay verified.

### Field types used here

| Need | Type |
| --- | --- |
| Short single-line value | `string` |
| Multi-line plain text (including shell scripts) | `text` |
| A Markdown page body | `rich-text` with `options: { format: markdown }` |
| Fixed set of choices | `select` |
| Grouped sub-fields | `object` |
| Repeatable records | add `list: true` |
| Image from the media library | `image` |

`rich-text` **must** specify `format: markdown`. Its other option is `html`,
which would stop content files being Markdown, and the site does not render
raw HTML inside Markdown.

Shell scripts use `text`, not `code`: the `code` field's language list has no
shell option, and a plain textarea preserves newlines just as well.

### Media

```yaml
media:
  input: public/images/uploads    # where files are committed
  output: /images/uploads         # what gets written into content
```

Vite's `base` is `/`, so the absolute output path resolves both locally and on
GitHub Pages. Uploads are kept in `public/images/uploads/` and separate from
`public/images/methods/` and `public/images/people/`, which developers curate.

**Verified against the live CMS on 14 August 2026.** A portrait changed through
Pages CMS was committed to `public/images/uploads/` with a slugified filename,
and `/images/uploads/…` was written into the person's record — exactly what the
configuration above describes. This is no longer an untested assumption.

### Upload a normal image. The site handles the rest.

**You do not need to resize, compress or convert anything before uploading.**
Pick the best-quality version you have and upload it.

Every time the site is built, each image is automatically turned into several
smaller WebP versions plus a compressed copy of the original, and each visitor's
browser picks the smallest one that still looks sharp on their screen. A 270 kB
photograph is delivered as about 6 kB; a 1.2 MB diagram as about 56 kB.

You will not see those versions anywhere, and you should not look for them: the
path stored in the content file is always the one you uploaded, and it keeps
working. There is nothing to click and nothing to remember.

The one thing worth keeping in mind is repository housekeeping rather than
speed: a 40 MB photograph straight from a camera is stored in the repository
forever, even though visitors would receive a small version of it. Something in
the region of a few megabytes is plenty for any image on this site.

A person's `photo` may therefore be in either place:

| Path | Who puts it there |
| --- | --- |
| `/images/people/…` | a developer, curated and converted to webp |
| `/images/uploads/…` | Pages CMS, when an editor uploads one |

Anything else — another folder, a `../` path, or an `http://` address — fails
the build. `src/content/records.test.js` additionally checks that the file is
really in the repository, by resolving the path under `public/`.

## Notes for developers

- Files are loaded by `src/content/index.js` using `import.meta.glob(...,
  { eager: true })`. Content is bundled at build time, so it cannot 404 at
  runtime, and adding a file is enough to register it — there is no index to
  update.
- Frontmatter is parsed with `js-yaml` and a small regex in
  `src/lib/frontmatter.js`, deliberately not `gray-matter`, which depends on
  Node's `Buffer` and needs a browser polyfill.
- The section menu comes from `src/lib/toc.js`, which slugs headings with
  `github-slugger` — the same package `rehype-slug` uses at render time.
  `content.test.jsx` renders every real content file through the real pipeline
  and asserts the two id lists are identical, so anchors cannot silently drift.
- Validation lives in `buildMethod` in `src/content/index.js`. Add a rule
  there and it applies to every file.
