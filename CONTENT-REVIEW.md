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

Item numbers are stable, so a resolved item keeps its number and its section
rather than being renumbered or deleted.

## Index

| # | Item | Status |
| --- | --- | --- |
| 1 | CrossTSR — overview duplicated from DrugTSR | 🚫 Blocked |
| 2 | Metal-Ion TSR — appears unfinished | 🚫 Blocked |
| 3 | SSE-TSR — citation | ✅ Resolved |
| 4 | Key to 2D Image — citation | ⚠️ Verify |
| 5 | Clustering — three repositories | ✅ Resolved |
| 6 | DrugTSR — `aa_grouping` passage | ✅ Resolved |
| 7 | Size-Filtering — `size_filter` argument | ✅ Resolved |
| 8 | Amino Acid TSR — example variables | ✅ Resolved |
| 9 | Nucleotide–Protein TSR — terminology | ✅ Resolved |
| 10 | Key to 2D Image — keys vs triplets | 🚫 Blocked |
| 11 | Deep Neural Network — architecture and results | ✅ Resolved |
| 12 | TSR — HPC job script has no legacy source | ⚠️ Verify |
| 13 | Size-Filtering — `retrieve_pdb_files` | ✅ Resolved |
| 14 | Package import path | ✅ Resolved |
| 15 | `output_option` default | ✅ Resolved |
| 16 | DrugTSR — CSV column count | ✅ Resolved |
| 17 | Amino Acid TSR — meaning of "Length" | ⚠️ Verify |
| 18 | Amino Acid TSR — is this the right citation? | ⚠️ Verify |
| 19 | Slurm placeholder script name | ⚠️ Verify |
| 20 | DNN repository README lists PNGs as .csv | ⚠️ Verify |
| 21 | Publication inventory — completeness | ⚠️ Verify |
| 22 | Size-Filtering paper — 2021 or 2022? | ✅ Resolved |
| 23 | Undergraduate members — are they still current? | ⚠️ Verify |
| 24 | Former members — employment claims removed | ⚠️ Verify |
| 25 | Which year a publication is filed under | ✅ Resolved |
| 26 | Five publication records have no abstract | ⚠️ Verify |
| 27 | A non-TSR preprint was left out | ⚠️ Verify |
| 28 | Five repositories have no licence | ⚠️ Verify |
| 29 | Who reads the GitHub issue trackers? | ⚠️ Verify |
| 30 | The legacy postal address was not migrated | ⚠️ Verify |
| 31 | `/problems` and `/community` retired | ✅ Resolved |

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

### 3. SSE-TSR — citation ✅ **resolved**

**Was.** The legacy page cited `10.1016/j.compbiolchem.2021.107479`, the amino
acid grouping paper, and the only version of this work available locally was
an IEEEtran manuscript from November 2024 carrying no DOI. The page was held
as a draft on that basis.

**Resolved.** The final publication has been independently verified:

> **SSE-TSR: An Approach to Integrate Secondary Structure Elements into
> Triangular Spatial Relationships for Protein Classification**
> Poorya Khajouie, Titli Sarkar, Krishna Rauniyar, Li Chen, Wu Xu,
> Vijay Raghavan
> *IEEE Transactions on Computational Biology and Bioinformatics*, 2026,
> 23(2), 694–703.
> DOI: [10.1109/TCBBIO.2026.3654047](https://doi.org/10.1109/TCBBIO.2026.3654047)

`src/content/methods/sse-tsr.md` now carries this citation and is
`status: published`. The incorrect amino-acid DOI is gone, and a test asserts
it cannot come back. The page is live at `/methods/sse-tsr`, appears under
One Molecule, and its `/sse-tsr` legacy alias became active on its own.

The record is also in `src/content/publications/khajouie-2026-sse-tsr.json`.

Two related legacy faults were fixed during migration and need no decision:
the figure's alt text read "Size Filtering Illustration Illustration" and now
describes the actual diagram, and the method is named **SSE-TSR** throughout,
matching the authors' own title.

---

### 4. Key to 2D Image — citation may not match the page subject

**Observed.** The page cites `10.1016/j.compbiolchem.2024.108117`, the DrugTSR
paper. The abstract of the Proteins 2021 paper (`10.1002/prot.26215`)
describes *a new visualization method where keys are organized according to
evolutionary closeness and shown in a 2D image*, which reads as related to
this page's subject.

**Question.** Which paper should this page cite? Possibly both.

---

### 5. Clustering — three repositories, relationship unstated ✅ **resolved**

**Observed.** The page linked `KrishnaRauniyar/Kinases-and-Phosphatases-Clustering`,
`KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE` and `dbxmcf/hsp70_actin` without
describing how they relate.

**Resolved** from the `Kinases-and-Phosphatases-Clustering` README, which sets
out a three-step workflow spanning two repositories:

1. `key_frequency_drug.py -p triplets_directory -H no` — key frequencies
   (Kinases-and-Phosphatases-Clustering)
2. Jaccard similarity — **`dbxmcf/hsp70_actin`**, a genuinely separate tool
3. `clustermap_n.py -p jaccard.csv -n 5` — clustering
   (Kinases-and-Phosphatases-Clustering)

`TSR_NUCLEOTIDE_PACKAGE` is not part of the clustering workflow: it is only
mentioned as one possible producer of the triplet files that feed step 1. The
migrated page therefore lists two repositories, not three, and labels which
step each provides.

---

### 6. DrugTSR — passage about `aa_grouping` ✅ **resolved**

**Observed.** The legacy page ended its usage section with: *"With
'aa_grouping' argument set to 'True', the Method will group amino acids
together and assign a same label to each group of them."* The same sentence
appears on the Amino Acid Grouping page.

**Resolved.** `DrugTSR()` has no such parameter:

```python
def DrugTSR(data_dir, input_files, chain=None, drug_name=None, drug_id=None,
            output_option='both', output_subdir='lexicographic'):
```

The sentence was carried over in error and is not migrated. A test asserts
`aa_grouping` does not appear anywhere on the DrugTSR page.

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

### 8. Amino Acid TSR — example variables ✅ **resolved**

**Observed.** The legacy tutorial referenced `pdb_ids` in snippets where it was
never defined, so those snippets could not be run as written.

**Resolved** against the package's own README
(`KrishnaRauniyar/TSR_AMINOACID_PACKAGE`), which is the authoritative
documentation and defines every variable it uses. The migrated examples follow
the README, so each snippet is self-contained.

---

### 9. Nucleotide–Protein TSR — terminology ✅ **resolved**

**Observed.** The legacy page used drug-related and nucleotide-related
vocabulary interchangeably for the same workflow.

**Resolved.** This comes from upstream, and is not a mistake on the website.
In `KrishnaRauniyar/Nucleotide-Protein` the nucleotide occupies the "drug"
position of a general drug–protein cross-key pipeline: the script is named
`drug_protein_3A.py`, its output column is `drug`, and the repository README
states *"The csv input file includes information for both Nucleotide (drug)
and Protein."*

The migrated page keeps the upstream names, because they are what a user types
and sees, and adds a short note explaining that "drug" means the nucleotide
here. Renaming them on the page would have made the documentation disagree
with the tool.

---

### 10. Key to 2D Image — keys vs triplets, and a missing grid file 🚫 **blocking**

**Observed.** The legacy example called
`TSR(data_dir, pdb_ids, chain=chain, output_option="keys")` and then passed
`extension = ".triplets_29_35"` to `KeyToImage`, so it generated keys and fed
triplets.

**Resolved (the keys/triplets half).** `Key_To_Image.py` reads tab-separated
triplet files and takes the triplet residue names, angle and distance from
columns 1/3/5, 7 and 9. It requires **triplets**. The migrated example uses
`output_option="triplets"`.

Two further details came out of the same reading, and are documented on the
page: the module is **not** re-exported from `tsr_package/__init__.py`, so it
must be imported as `from tsr_package.Key_To_Image import KeyToImage`; and the
image is a 35 × 44 grid of blocks, each 35 distance bins by 29 angle bins.

**Still blocking.** `KeyToImage` requires `35by44grid.csv`, which maps each
amino acid triplet to a block. That file is **not in the TSR-Package
repository** and is not present anywhere we can see. Without it the tutorial
cannot be followed, so `src/content/analysis/key-to-image.md` is held at
`status: draft`.

**Question.** Where do users obtain `35by44grid.csv`? Should it be committed to
TSR-Package, or is it generated by something we have not found?

---

### 11. Deep Neural Network — architecture and results ✅ **resolved**

**Observed.** The legacy page said the output layer had 8 neurons while also
describing seven groups, and listed results files as CSVs.

**Resolved** from `Nucleotide_Analysis/dnn/drug_model.py`. The model is:

```python
Dense(128, input_dim=X_train.shape[1], activation='relu'),
Dense(64,  activation='relu', kernel_regularizer=l2(0.01)),
Dense(32,  activation='relu', kernel_regularizer=l2(0.01)),
Dense(16,  activation='relu', kernel_regularizer=l2(0.01)),
Dense(8,   activation='relu', kernel_regularizer=l2(0.01)),
Dense(len(label_encoders['residue_type'].classes_), activation='softmax')
```

There is no contradiction to settle: the **8 is the last hidden layer**, and
the output layer is `len(classes_)` — sized from the data at runtime, not
fixed at 7 or 8. The legacy text conflated the two. The migrated page shows
the full layer table and says explicitly that the output follows the dataset.

The results are all images — the code calls `plt.savefig` for
`accuracy_plot.png`, `loss_plot.png` and `confusion_matrix.png`.

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

### 13. Size-Filtering TSR — a stale function name ✅ **resolved**

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

**Resolved.** Confirmed against the current `pooryakhajouie/TSR-Package`
source: the supported entry point is `PDB_DL`, re-exported from
`tsr_package/__init__.py`. `retrieve_pdb_files` is not part of the current
package API.

This is not a claim that the function never existed — it plainly did, and
still appears in stale build output and in an older installed copy. It is
simply retired, and the legacy example calling it was already broken because
it never imported the name.

---

### 14. Import path ✅ **resolved**

Affects every migrated tutorial, **including the already-published TSR page.**

**Observed.** All tutorials use `from tsr_package.tsr.PDB_DL import PDB_DL`,
i.e. a `tsr` sub-package. The local source at `~/Desktop/tsr_package` has no
such sub-package: modules sit directly in `tsr_package/`, and `setup.py` uses
`find_packages()`, which would make the import `from tsr_package.PDB_DL import
PDB_DL`. The `tsr` name does appear in stale build output (`build/lib/tsr/`)
and in the installed virtualenv (`tsrenv/.../tsr/`), suggesting the inner
package was renamed at some point.

**Resolved** against the authoritative repository,
`pooryakhajouie/TSR-Package`. Its `tsr_package/__init__.py` re-exports
`.PDB_DL`, `.TSR`, `.SSE_TSR`, `.Cross_TSR` and `.Drug_TSR`, so the public API
is a flat import from the package:

```python
from tsr_package import PDB_DL, TSR
from tsr_package import SSETSR
```

The `tsr_package.tsr.X` form does not match the current layout. All five
method pages were updated together — 23 import statements, with adjacent
`PDB_DL`/`TSR` imports collapsed onto one line. This included the already
published `/tsr` page, which carried the same stale form.

---

### 15. `output_option` default ✅ **resolved**

Affects the already-published TSR page.

**Observed.** The parameter table on `/tsr` gives the default for
`output_option` as `"keys"`. The source signature has `output_option='both'`.

**Resolved.** The signature is authoritative:

```python
TSR(data_dir, input_files, chain=None, output_option='both',
    output_subdir='lexicographic', aa_grouping=False,
    mirror_image=False, size_filter=10000)
```

The default is `'both'`. The parameter table on `/tsr` has been corrected, and
extended to document `size_filter` (default `10000`), `aa_grouping` and
`mirror_image` alongside it, each linking to its own method page.

Examples that explicitly pass `output_option="keys"` were left alone: an
explicit argument in an example is not a statement about the default.

---

### 16. DrugTSR — CSV column count ✅ **resolved**

**Observed.** The legacy page said the DrugTSR CSV *"should have two columns:
one for the protein IDs and one for the corresponding chains"*, while the table
immediately below it showed four: `protein`, `chain`, `drug_name`, `drug_id`.

**Resolved.** Four is right. `DrugTSR()` takes `drug_name` and `drug_id` in
addition to `chain`, so the CSV must identify the drug as well. The sentence
was stale text copied from the core TSR page, whose CSV genuinely has two
columns. The migrated page says four.

---

### 17. Amino Acid TSR — what "Length" means

`TSR-WEB/src/tabs/AminoAcid.js`

**Observed.** The page lists a required length per residue type — GLY 4, ALA 5,
SER/CYS 6, VAL/PRO/THR 7, up to PTR 16 — introduced as *"specific sequence
lengths"*. These numbers correspond to the count of non-hydrogen atoms in each
residue rather than to any sequence length.

**What I did.** Migrated the table verbatim with the neutral column heading
"Expected length", without reinterpreting the term.

**Question.** Should this column be labelled atom count? If so the surrounding
sentence should be reworded too.

---

### 18. Amino Acid TSR — is this the right citation?

**Observed.** The legacy page carried no citation at all. The closest verified
publication by the group is:

> **A Parallel Implementation for Large-Scale TSR-based 3D Structural
> Comparisons of Protein and Amino Acid**
> Feng Chen, Tarikul I. Milon, Poorya Khajouie, Antoinette Myers, Wu Xu
> *Current Bioinformatics*, 2025, 20(6), 564–579.
> DOI [10.2174/0115748936306625240724102438](https://doi.org/10.2174/0115748936306625240724102438)

Its abstract states that *"3D structures of proteins and amino acids are
represented by an integer vector in the TSR-based method"*, so amino-acid
representation is genuinely within scope. Metadata verified through Crossref.

**What I did.** Attached it as the page's reference and published the page,
since its tutorial is fully verified against the package README.

**Question.** Is this the intended primary citation? The paper's own
contribution is the parallel implementation, so if a dedicated amino-acid
representation paper exists it would be the better reference — or both could be
listed.

---

### 19. Slurm — placeholder script name

`amino-acid.md`, `nucleotide.md`

**Observed.** The legacy job scripts ended with the literal line
`python3 (actual path to python script)`, which is a parenthetical instruction
rather than runnable shell.

**What I did.** Replaced it with `python3 your_script.py`, which is valid shell
and obviously a placeholder, and added a note saying the script should contain
the `PDB_DL` and generation calls from the Usage section above.

The group's real allocation, `-A loni_tsr_4`, was **kept** rather than
genericised: it is the authentic value from the group's own scripts and this is
the group's own documentation. The resource note tells outside readers to
substitute their own.

**Question.** Is there a canonical driver script in either package that should
be named here instead?

---

### 20. DNN repository README lists two PNGs as `.csv`

`KrishnaRauniyar/Nucleotide_Analysis`, `dnn/README.md`

**Observed.** The README's Result section lists `loss_plot.csv` and
`confusion_matrix.csv`. The code writes `plt.savefig("loss_plot.png")` and
`plt.savefig("confusion_matrix.png")`. Only `accuracy_plot.png` is listed
correctly.

**What I did.** Followed the code, which is authoritative for what the program
actually produces, and noted the discrepancy on the page.

**Question.** Worth an upstream README fix, so the repository and the website
agree.

---

### 21. Publication inventory — is anything still missing?

`src/content/publications/`

**Observed.** The legacy Publications page carried seven papers, hard-coded in
`TSR-WEB/src/components/Publications.js`, and ended in 2024. The collection now
holds **thirteen**, every one verified field by field against Crossref.

Three of the six additions were not on the legacy page and were found by
looking beyond it:

- **Descriptor based protein structure representation using triangular spatial
  relationships in 3-D** — Singh, Xu, Raghavan. *IEEE BIBM*, 2017, 1114–1118.
  [10.1109/BIBM.2017.8217812](https://doi.org/10.1109/BIBM.2017.8217812)
- **Application of the Triangular Spatial Relationship Algorithm … in
  Chlorophylls and Protein Local Environments** — Milon, Orthi, Rauniyar,
  Renfrow, Gallo, Xu. *Photochem*, 2025, 5(1), 8.
  [10.3390/photochem5010008](https://doi.org/10.3390/photochem5010008)
- **Quantification of Conformational Changes of Kinase Regulators, Kinases, and
  Regulator–Kinase Complexes Using the TSR Algorithm** — Milon, Khajouie, Chen,
  Borel, Knierim, Raghavan, Xu. *Methods in Molecular Biology: Protein
  Evolution*, 2026, 189–212.
  [10.1007/978-1-0716-4828-5_12](https://doi.org/10.1007/978-1-0716-4828-5_12)

**How the search was done.** Poorya Khajouie's Google Scholar profile was
readable and was used for discovery only, plus a Crossref author/title sweep
for "triangular spatial relationship" restricted to papers with Xu as an
author. Every record's metadata then came from Crossref, not from Scholar.

**Question.** That profile covers one author. Papers by other members that
Khajouie did not co-author — and anything too recent or too far outside the
"TSR" phrasing for the Crossref sweep to catch — would not have been found.
Please check the list against Wu Xu's and Vijay Raghavan's own Scholar profiles
or CVs. **This is the one item that most needs an author's eye.**

---

### 22. Size-Filtering paper — 2021 or 2022? ✅ **resolved**

**Observed.** The legacy page, and `src/content/methods/size-filtering.md` as
migrated in Stage 7A, dated `10.1002/prot.26215` to **2021**. Crossref gives
two dates for it.

**Resolved** against Crossref:

```
published-online   2021-08-23
published-print    2022-01
volume 90, issue 1, pages 239–257
```

Both are correct; they describe different events. The version of record — the
one a reader cites — is *Proteins* **2022**, 90(1), 239–257. The publication
record uses that, and `size-filtering.md` was corrected to match, together with
the volume, issue and page range it had never carried. Nothing about the
science changed; this is a bibliographic correction with a citable source, of
the same kind as items 14 and 15.

---

### 25. Which year a publication is filed under ✅ **resolved**

**Observed.** Three papers are online in one year and in print the next:
size-filtering (online 2021, print 2022), SSE-TSR (online 2025, print 2026) and
the *Methods in Molecular Biology* chapter (online 2025, print 2026).

**Resolved.** One rule, applied to all of them: **the year of the version of
record** — the print or issue year where there is one, the online year
otherwise. That is the year in the formal citation, and it keeps the year
heading on the publications page agreeing with the volume and issue printed
beneath it.

The consequence worth knowing: the MiMB chapter appears under 2026 even though
Google Scholar lists it as 2025. If the group would rather file papers by the
date they first appeared, that is a one-line change to each record's `year` —
recorded here so it is a choice rather than an accident.

---

### 23. Undergraduate members — are they still current?

`src/content/people/`

**Observed.** Seven undergraduate researchers came across from the legacy page.
Their biographies were written in 2024 and several state plans that have since
passed: *"plans to graduate in Fall 2025"*, *"graduating in Fall 2025"*,
*"plans to take a gap year"*. Their roles were given as class standing —
"Senior", "Junior" — which is true only for the year it was written.

**What I did.** Migrated the substance and dropped the dated parts:

- class standing became "Undergraduate Researcher" plus the subject, so the
  role does not silently become wrong a year later;
- sentences asserting a specific graduation date or gap year were removed;
- everything about their studies, interests and involvement was kept;
- all seven are marked `status: current`, because there is no evidence they
  have left, and no authoritative source to say otherwise.

Two of them are corroborated as genuine research contributors by authorship:
Rhen Renfrow on the Photochem 2025 paper and Tyler Borel on the 2026 MiMB
chapter.

**Question.** Which of the seven are still in the group? Anyone who has
finished should be moved to `status: former` — a one-field change in the CMS —
and any current class standing or new role can be filled in there.

---

### 24. Former members — current employment claims removed

**Observed.** The legacy entries for both former members described where they
work now. Sarika Kondra's ran to a paragraph naming an employer and several
named clients; Titli Sarkar's named her employer and the contractor managing
the role. Both were written in 2024 or earlier.

**What I did.** Kept education, the doctorate, and research interests. Removed
the employer and client names. A website that says where someone works is
making a claim on their behalf that goes stale silently, and neither is
verifiable from any source available here.

**Question.** If either would like their current position shown, the wording
they want is theirs to give and can be added through the CMS.

---

### 26. Five publication records have no abstract

**Observed.** Eight of the thirteen records carry a short abstract, taken from
the group's own legacy page. Five do not: the 2017 BIBM paper, the Photochem
2025 paper, the MiMB 2026 chapter, *Current Bioinformatics* 2025 and *Proteins*
2025.

**What I did.** Left them empty rather than pasting in publisher-formatted
abstracts or writing my own condensation of someone else's results. The field
is optional and the "Abstract" toggle simply does not appear without it.

**Question.** Worth pasting the authors' own abstracts in through the CMS, for
consistency across the page.

---

### 27. A non-TSR preprint was left out

**Observed.** Khajouie's Scholar profile also lists *"Optimizing task
scheduling in heterogeneous computing environments: a comparative analysis of
CPU, GPU, and ASIC platforms using E2C simulator"* (arXiv:2405.08187, 2024,
with A. Mohammadjafari).

**What I did.** Did not add it. It is not TSR work, and its co-author is not a
member of the group, so it looked like personal output rather than the
research group's.

**Question.** Confirm — if the publications page is meant to list members'
complete output rather than the group's TSR work, this and anything like it
should be added.

---

### 28. Five repositories have no licence

`src/content/repositories/`

**Observed.** The site calls this software open source, on the home page and
now on `/software`. Checked against the GitHub API and each repository's file
listing on 13 August 2026:

| Repository | Licence | Installable |
| --- | --- | --- |
| `pooryakhajouie/TSR-Package` | MIT | `setup.py` |
| `KrishnaRauniyar/TSR_AMINOACID_PACKAGE` | **none** | `setup.py` |
| `KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE` | **none** | `setup.py` |
| `KrishnaRauniyar/Nucleotide-Protein` | **none** | scripts |
| `KrishnaRauniyar/Nucleotide_Analysis` | **none** | scripts |
| `KrishnaRauniyar/Kinases-and-Phosphatases-Clustering` | **none** | scripts |
| `dbxmcf/hsp70_actin` | GPL-3.0 | scripts (not the group's) |

Code published on GitHub without a licence is **not** open source: the default
is exclusive copyright, so a reader may look at it but has no permission to
use, modify or redistribute it. Five of the six repositories the group owns are
in that position, including two that are packaged for installation and are
documented on this site with instructions telling people to install them.

**What I did.** The software page describes what each repository *is* — an
installable package or research scripts — and does not claim a licence for any
of them. The word "open-source" survives only on the home page, where it
describes the intent of the work rather than any individual repository.

**Question.** Adding a `LICENSE` file to each is a small change with real
consequences for anyone who wants to build on the work, and it matters more
once a consolidated package is published. MIT would match TSR-Package. This is
the authors' decision, not the website's.

---

### 29. Who reads the GitHub issue trackers?

**Observed.** Issues are enabled on all seven repositories, and every one of
them has zero open issues — so there is no evidence either way about whether
anyone watches them.

**What I did.** Only `TSR-Package` carries an `issuesUrl`, so it is the only
entry on `/software` with a "Report a problem" link. The field is optional and
the CMS describes it as a commitment: setting it puts that link on an entry.
The rest link to their repository, where the Issues tab is one click away for
anyone who wants it, without the site promising a response.

The footer's own "Report a website problem" goes to this repository's tracker
and is labelled to keep it distinct from the research code.

**Question.** Should the other repositories advertise their trackers too? If
somebody is willing to watch them, filling in one CMS field per repository is
the whole change.

---

### 30. The legacy postal address was not migrated

`TSR-WEB/src/components/ContactUs.js`

**Observed.** The old contact page carried an embedded Google Map and two
addresses:

> Oliver Hall Room 317, 301 East Lewis Street, P.O. Box 43586,
> Lafayette, LA 70504-3586 — School of Computing and Informatics

**What I did.** Neither is on the new contact page. The address is a School of
Computing and Informatics one, and the group spans Chemistry and Computing, so
it is not obviously the right address for the group as a whole; it also could
not be verified as current from anything available here. The embedded map was
dropped for a second reason — it loads a third-party frame on a page that
otherwise makes no external requests.

**Question.** Should a postal address be published, and if so which one? It is
a two-line addition to `pages.json` once someone confirms it.

---

### 31. `/problems` and `/community` retired ✅ **resolved**

**Observed.** The old site had three routes with no equivalent here.

**Resolved**, and recorded in `src/app/legacyPaths.js`:

- **`/source-code` → `/software`.** Same purpose under a new name: the old page
  existed to point people at the repositories. Redirected.
- **`/problems`** — a form that reported nothing. It logged the message to the
  browser console, then displayed *"Thank you for your submission! We will be
  in touch with you soon."* Nothing replaces it, because the honest answer now
  depends on the question: a reproducible bug belongs on the repository that
  provides the tool, anything else belongs in an email, and `/contact` explains
  both. Sending "report a problem" to one of them would be guessing which the
  visitor meant, so the address 404s and the 404 page offers the way back.
- **`/community`** — two affiliation logos. Those affiliations are now in the
  footer of every page, including the 404, and on `/contact`. Not redirected,
  because there is no page to redirect to.

---

## Data quality

Not scientific questions, but content that must not be migrated as-is.

**People — resolved in Stage 7D.** Nine members had empty `phone`/`email`
values that the old page rendered as bare `Phone:` / `Email:` labels with an
empty `mailto:` link, and two former members carried what look like
placeholders (`former.member1@louisiana.edu`, `(337) 123-4567`).

None of that is migrated. Four people have a real address — Wu Xu, Vijay
Raghavan, Poorya Khajouie and Krishna Rauniyar — and those are shown; every
other contact field is simply absent, and the content loader now **rejects an
empty string** so the old failure mode cannot come back through the CMS either.

**No telephone number is published for anyone.** `phone` is not a field in the
person schema at all. Three of the legacy numbers looked genuine, but a public
group directory is not the place for direct personal lines, and the site
already has one shared address for contact. If the group wants a departmental
or office number shown, that is a deliberate decision to make — say so and it
can be added, for the people who agree to it.

**Publications — addressed in Stage 7D**, see item 21 for what remains.

**Resolved already.** The old footer used `contact@ourlab.com`, and the old
"Problems" page displayed *"Thank you for your submission! We will be in
touch"* after only writing to the browser console. Neither has been carried
over: contact comes from `src/content/site.json`, and issue reporting links to
GitHub Issues.
