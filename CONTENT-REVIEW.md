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

### 3. SSE-TSR — no confirmed citation 🚫 **blocking publication**

**Observed.** The legacy page cited `10.1016/j.compbiolchem.2021.107479`, which
is the amino-acid-grouping paper, also cited by the Amino Acid Grouping page.
Its `learn-more` section was commented out in the source while the section
navigation still linked to `#learn-more`, so that anchor went nowhere.

A manuscript for this method exists locally at
`~/Desktop/Integrating_Secondary_Structures_Information_into_Triangular_Spatial_Relationships__TSR__for_Advanced_Protein_Classification`:

- Title: *Integrating Secondary Structures Information into Triangular Spatial
  Relationships (TSR) for Advanced Protein Classification*
- Authors: Poorya Khajouie, Titli Sarkar, Krishna Rauniyar, Li Chen, Wu Xu,
  Vijay Raghavan
- IEEEtran manuscript, dated November 2024, containing **no DOI**

So there is no confirmed publication to cite, which is why the amino-acid
DOI was probably reused.

**Question.** Has this manuscript since been published? If so, what is the DOI
or venue? If it is still unpublished, should the page cite it as a preprint,
or carry no citation at all?

**Status.** `src/content/methods/sse-tsr.md` exists with the scientific text
and tutorial migrated, and is held at `status: draft`. It has no route, no
navigation entry, and its legacy alias `/sse-tsr` is deliberately inert.
Publishing is a matter of adding the `paper:` block and flipping `status`.

Two related legacy faults are already fixed and need no decision: the figure's
alt text read "Size Filtering Illustration Illustration" and has been
rewritten to describe the actual diagram, and the method is now named
**SSE-TSR** consistently, matching the authors' own abstract.

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

### 7. Size-Filtering TSR — argument name ✅ **resolved**

**Observed.** Examples pass `size_filter=500` to `TSR(...)`.

**Resolved** against the package source at `~/Desktop/tsr_package`
(`tsr_package/TSR.py`, version 0.1.1 per `setup.py` — the same version the
tutorials reference):

```python
def TSR(data_dir, input_files, chain=None, output_option='both',
        output_subdir='lexicographic', aa_grouping=False,
        mirror_image=False, size_filter=10000):
```

`size_filter` is real, and its default is `10000` — high enough that no
filtering happens unless asked for. The same check confirms `mirror_image` and
`aa_grouping`, so those two pages needed no assumption either.

The migrated page documents the default as `10000`. Nothing here needs an
author decision; recorded so the next person does not repeat the check.

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

### 12. TSR — HPC job script has no legacy source

`src/content/methods/tsr.md`

**Observed.** The original TSR page had no Slurm section. The job script now
on the new page was written for this rebuild, following the pattern of the
`sbatch` scripts on the Amino Acid TSR and Nucleotide–Protein TSR pages
(`-p workq`, one node, 64 tasks, 72 hours, clone → venv → `pip install` → run)
with TSR-Package's own repository URL substituted.

The uncertainty is stated on the page itself, in the notes beneath the script,
rather than only here.

**Question.** Is this the right way to run TSR-Package on the cluster? In
particular: the partition, the resource request, and whether
`generate_keys.py` is the intended entry point. If TSR-Package is not
typically run through Slurm, the section should be removed instead.

---

### 13. Size-Filtering TSR — a stale function name I replaced

`TSR-WEB/src/tabs/SizeFiltering.js`, second example

**Observed.** The example imported `PDB_DL` and then called
`retrieve_pdb_files(csv_file)`, a name it never imported — so the snippet could
not run as written. `retrieve_pdb_files` appears in the package only under
`build/lib/tsr/` and inside the old installed `tsrenv` copy, not in the current
`tsr_package/` source, where the equivalent module is `PDB_DL.py`. Every other
example across the legacy site, and the already-published TSR page, use
`PDB_DL`.

**What I did.** Migrated that line as `PDB_DL(csv_file)`. Recording it rather
than making the change silently: it is an API name, and the evidence is
circumstantial even though it points one way.

**Question.** Confirm `retrieve_pdb_files` is genuinely retired and no
supported release still exposes it.

---

### 14. Import path — `tsr_package.tsr.X` versus `tsr_package.X`

Affects every migrated tutorial, **including the already-published TSR page.**

**Observed.** All tutorials use `from tsr_package.tsr.PDB_DL import PDB_DL`,
i.e. a `tsr` sub-package. The local source at `~/Desktop/tsr_package` has no
such sub-package: modules sit directly in `tsr_package/`, and `setup.py` uses
`find_packages()`, which would make the import `from tsr_package.PDB_DL import
PDB_DL`. The `tsr` name does appear in stale build output (`build/lib/tsr/`)
and in the installed virtualenv (`tsrenv/.../tsr/`), suggesting the inner
package was renamed at some point.

**What I did.** Nothing. I kept the legacy form on all four new pages so they
stay consistent with the published TSR page. Changing it would alter live
content on the strength of a local working copy that may not match the
released GitHub package.

**Question.** Which import path is correct for the version users install from
`TSR-Package`? If it is `tsr_package.X`, all five method pages need updating
together.

---

### 15. `output_option` default

Affects the already-published TSR page.

**Observed.** The parameter table on `/tsr` gives the default for
`output_option` as `"keys"`. The source signature has `output_option='both'`.

**What I did.** Nothing — `/tsr` is outside the scope of this migration group,
and the new pages avoid restating the default.

**Question.** Confirm `'both'` is correct, and the table should be amended.

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
