# Content review queue

Scientific and technical problems found in the previous website
(`TSR-WEB`) while planning this rebuild.

**These are questions for the authors, not defects to be fixed by whoever is
doing the web work.** Nothing here has been silently corrected. Content stays
out of the new site, or is migrated with its problem noted, until someone who
knows the science signs it off.

**Status key**

| Status | Meaning |
| --- | --- |
| 🚫 Blocked | Marked `status: 'draft'` in `src/app/navigation.js`. Absent from navigation *and* routing. Do not publish. |
| ⚠️ Verify | Will be migrated, but a specific claim needs checking against the paper or the Python package first. |
| ✅ Resolved | Reviewer has confirmed or corrected it. Record who and when. |

---

## 🚫 Blocked — must not be published

### 1. CrossTSR — overview is DrugTSR's text

`TSR-WEB/src/tabs/CrossTSR.js`

The abstract begins *"DrugTSR is our advanced method…"* and the whole overview
is verbatim DrugTSR content. The page also links the DrugTSR paper
(`10.1016/j.compbiolchem.2024.108117`), points at the generic `TSR-Package`
repository, and has its illustration commented out.

Nothing on the page is demonstrably about CrossTSR.

**Needed:** an original CrossTSR overview, the correct citation, the correct
repository, and a tutorial that reflects the actual CrossTSR API.

---

### 2. Metal-Ion TSR — placeholder content

`TSR-WEB/src/tabs/MetalIon.js`

- The abstract is generic TSR boilerplate with nothing metal-ion specific.
- **Two `<section id="tutorial">` blocks, byte-for-byte identical**, both
  containing a four-item placeholder list ("Install the required
  dependencies", "Interpret the output…").
- Source link is the literal placeholder `https://github.com/your-repo`.
- The page was never reachable from the old navigation either.

**Needed:** real content, or a decision to drop the page.

---

## ⚠️ Verify before publishing

### 3. SSE-TSR — citation appears to be the wrong paper

Cites `10.1016/j.compbiolchem.2021.107479`, which is the **amino acid
grouping** paper. Also, the `learn-more` section is commented out in the source
while the section navigation still links to it, so the anchor goes nowhere.

**Question:** what is the correct SSE-TSR reference?

---

### 4. Key to 2D Image — citation appears to be the wrong paper

Cites `10.1016/j.compbiolchem.2024.108117` (DrugTSR). The 2D key-image work
looks like it belongs to the Proteins 2021 paper
(`10.1002/prot.26215`), whose abstract describes *a new visualization method
where keys are organized according to evolutionary closeness and shown in a 2D
image*.

**Question:** which paper should this page cite?

---

### 5. Clustering — three unrelated repositories, no explanation

The page links `KrishnaRauniyar/Kinases-and-Phosphatases-Clustering`,
`KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE` and `dbxmcf/hsp70_actin` without
saying how they relate.

**Question:** which is canonical for this page, and what are the others for?

---

### 6. DrugTSR — a copied explanation about `aa_grouping`

Contains an explanation lifted from the amino-acid-grouping page that
describes `aa_grouping` in a context where it does not apply.

---

### 7. Size-Filtering TSR — API naming

Examples pass `size_filter=500` to `TSR(...)`. Confirm the argument name and
semantics against the current released package.

---

### 8. Amino Acid TSR — undefined example variables

The tutorial references `pdb_ids` in places where it is never defined, so the
snippets cannot be copy-pasted and run.

---

### 9. Nucleotide–Protein TSR — mixed terminology

Drug and nucleotide vocabulary are used interchangeably in places. Confirm
which is intended in each passage.

---

### 10. Key to 2D Image — keys vs triplets workflow

One workflow generates *keys* but a later step expects *triplet* files.

**Question:** is a step missing, or is the wrong `output_option` shown?

---

### 11. Deep Neural Network — architecture and results descriptions

- The stated number of output neurons is inconsistent with the stated number
  of classes.
- Some result files described as plots or matrices appear to be CSVs.

---

## Data quality (not blocking, but do not migrate as-is)

**People** — nine members have empty `phone`/`email` values that the old page
still rendered as bare `Phone:` / `Email:` labels with an empty `mailto:`
link. Two former members carry obvious placeholders
(`former.member1@louisiana.edu`, `(337) 123-4567`). The new People page must
omit fields that are absent rather than render them empty, and no placeholder
contact details may be carried over.

**Publications** — the list ends in 2024. Confirm whether 2025–2026 output is
missing.

**Footer / Report issues** — the old footer used `contact@ourlab.com` and the
old "Problems" form displayed *"Thank you for your submission! We will be in
touch"* after doing nothing but a `console.log`. Both are gone. Contact now
comes from `src/app/siteConfig.js` and issue reporting links to GitHub Issues.
