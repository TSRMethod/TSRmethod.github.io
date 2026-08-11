# Content review queue

Observations from the previous website (`TSR-WEB`) that need a decision from
someone who knows the science before the content is published here.

**Nothing in this list has been silently corrected, and nothing here is a
verdict.** Where a page looks inconsistent, that is recorded as a question,
not a correction. Only an author can say which reading is right.

Each entry separates:

- **Observed** — what is literally in the legacy source. Verifiable by reading it.
- **Question** — what needs an author's judgement.

**Status key**

| Status | Meaning |
| --- | --- |
| 🚫 Blocked | `status: draft` in the content file. Absent from navigation *and* routing. |
| ⚠️ Verify | Will be migrated, but a specific point needs checking against the paper or the package first. |
| ✅ Resolved | An author has confirmed or corrected it. Record who and when. |

---

## 🚫 Blocked — not published pending review

### 1. CrossTSR — overview text is duplicated from DrugTSR

`TSR-WEB/src/tabs/CrossTSR.js`

**Observed.** The abstract begins *"DrugTSR is our advanced method…"* and the
body of the overview is identical to the text on the DrugTSR page. The page
links the DrugTSR publication (`10.1016/j.compbiolchem.2024.108117`), points
at the general `TSR-Package` repository, and its illustration is commented out
in the source.

**Question.** What content should this page actually carry? Specifically: an
overview describing CrossTSR itself, the correct citation, the correct
repository, and a tutorial matching the real CrossTSR interface.

---

### 2. Metal-Ion TSR — appears unfinished

`TSR-WEB/src/tabs/MetalIon.js`

**Observed.**

- The abstract is general TSR text with no metal-ion-specific content.
- There are two `<section id="tutorial">` blocks with identical contents, each
  a four-item outline ("Install the required dependencies", "Interpret the
  output…").
- The source link is the literal string `https://github.com/your-repo`.
- The page was not linked from the old navigation.

**Question.** Is this page intended to exist? If so, what are its content and
its repository?

---

## ⚠️ Verify before publishing

### 3. SSE-TSR — citation may not match the page subject

**Observed.** The page cites `10.1016/j.compbiolchem.2021.107479`. That DOI is
the amino-acid-grouping paper, which is also cited by the Amino Acid Grouping
page. Separately, the `learn-more` section is commented out in the source
while the section navigation still links to `#learn-more`, so that anchor has
no target.

**Question.** Is this the intended reference for SSE-TSR, or should it cite a
different paper?

---

### 4. Key to 2D Image — citation may not match the page subject

**Observed.** The page cites `10.1016/j.compbiolchem.2024.108117`, the DrugTSR
paper. The abstract of the Proteins 2021 paper (`10.1002/prot.26215`)
describes *a new visualization method where keys are organized according to
evolutionary closeness and shown in a 2D image*, which reads as related to
this page's subject.

**Question.** Which paper should this page cite? Possibly both.

---

### 5. Clustering — three repositories, relationship unstated

**Observed.** The page links `KrishnaRauniyar/Kinases-and-Phosphatases-Clustering`,
`KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE` and `dbxmcf/hsp70_actin` without
describing how they relate to each other or to the page.

**Question.** Which is the canonical repository for this method, and what role
do the others play?

---

### 6. DrugTSR — passage about `aa_grouping`

**Observed.** The page contains an explanation of `aa_grouping` that also
appears on the Amino Acid Grouping page.

**Question.** Does `aa_grouping` apply in the DrugTSR context as described, or
was this passage carried over in error?

---

### 7. Size-Filtering TSR — argument name

**Observed.** Examples pass `size_filter=500` to `TSR(...)`.

**Question.** Does the current released package use this argument name and
these semantics?

---

### 8. Amino Acid TSR — example variables

**Observed.** The tutorial references `pdb_ids` in snippets where it is not
defined, so those snippets cannot be run as written.

**Question.** What should the examples define?

---

### 9. Nucleotide–Protein TSR — terminology

**Observed.** Drug-related and nucleotide-related vocabulary are both used in
describing the same workflow.

**Question.** Which term is intended in each passage?

---

### 10. Key to 2D Image — keys and triplets in one workflow

**Observed.** One workflow generates *keys*, and a later step in the same
workflow reads *triplet* files.

**Question.** Is an intermediate step missing, or should the earlier step use
a different `output_option`?

---

### 11. Deep Neural Network — architecture and results descriptions

**Observed.** The stated number of output neurons and the stated number of
classes differ. Separately, some output files described as plots or matrices
appear from their names to be CSV files.

**Question.** What are the correct figures and file descriptions?

---

## Data quality

Not scientific questions, but content that must not be migrated as-is.

**People.** Nine members have empty `phone`/`email` values that the old page
rendered as bare `Phone:` / `Email:` labels with an empty `mailto:` link. Two
former members carry values that appear to be placeholders
(`former.member1@louisiana.edu`, `(337) 123-4567`). The new schema omits
absent fields rather than rendering them empty; no placeholder contact details
will be carried over. Needs someone to supply the real values, or confirm
they should stay absent.

**Publications.** The legacy list ends in 2024. Needs confirming whether
2025–2026 output is missing.

**Resolved already.** The old footer used `contact@ourlab.com`, and the old
"Problems" page displayed *"Thank you for your submission! We will be in
touch"* after only writing to the browser console. Neither has been carried
over: contact comes from `src/content/site.json`, and issue reporting links to
GitHub Issues.
