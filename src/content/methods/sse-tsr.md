---
slug: sse-tsr
title: SSE-TSR
shortTitle: SSE-TSR
summary: >-
  Adds secondary structure information to TSR keys, sorting them into 18 groups
  according to the helix, strand and coil arrangement of each triangle.

status: published
category: method
group: one-molecule
order: 4

figure:
  src: /images/methods/sse-tsr.webp
  alt: >-
    Two panels. On the left, a protein structure of helices, a sheet and a coil
    with labelled triangles such as 3a1, 2a11b and 1a2c drawn between them,
    noting nine representative types of TSR key integrated with secondary
    structure, eighteen in total. On the right, three proteins with identical
    key counts are separated once the eighteen secondary structure groups are
    applied.
  caption: >-
    Proteins that are indistinguishable by key counts alone can be separated
    once secondary structure groups are taken into account.

paper:
  title: >-
    SSE-TSR: An Approach to Integrate Secondary Structure Elements into
    Triangular Spatial Relationships for Protein Classification
  authors: >-
    Poorya Khajouie, Titli Sarkar, Krishna Rauniyar, Li Chen, Wu Xu,
    Vijay Raghavan
  journal: IEEE Transactions on Computational Biology and Bioinformatics
  year: 2026
  volume: '23'
  issue: '2'
  pages: 694–703
  doi: 10.1109/TCBBIO.2026.3654047

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      SSE-TSR was first implemented here, as the SSETSR() function. It is kept
      unchanged for provenance and for work that depends on it; its README has
      its own installation instructions.
    language: Python
---

## Overview

SSE-TSR integrates secondary structure information with the Triangular Spatial
Relationship (TSR) framework. Traditional TSR creates triangles between Cα
atoms in protein structures and assigns each triangle an integer key based on
its residue labels and geometric features such as distance and angle;
triangles alike in those respects share a key. SSE-TSR builds on this by
categorising TSR keys into 18 distinct groups based on secondary structural
elements — alpha helices, beta sheets and coils.

This offers a more detailed representation of protein structures and improves
classification accuracy. By considering not only the geometric arrangement of
Cα atoms but also secondary structure, SSE-TSR gives a richer characterisation
of proteins. This dual-level representation supports efficient, alignment-free
comparison, capturing both high-level structural features and subtle
substructural variation.

The method has been tested on two major protein datasets, showing strong
performance in classifying proteins by structure.

## Run it with BioTSR

SSE-TSR is an option of BioTSR's protein Cα methods, `--sse`. To compute it for
chain A of ubiquitin:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --sse --output results
```

The option changes no key. Ubiquitin chain A gives the same 70,300 triangles
and 45,349 distinct keys as a run without it; what is added is the
secondary-structure category of every triangle, so each key's count is split
over the 18 categories. The keys file's `category` column, which in a plain run
reads `regular`, names the category, with one row for each key and category it
occurs in. The files are written under the prefix
`results/1UBQ_A_protein_sse`.

- **Where the secondary structure comes from:** the structure file's own
  `HELIX` and `SHEET` records. BioTSR does not run DSSP or assign secondary
  structure itself, so a file without those records has every residue in coil.
- **Which methods take it:** the two protein Cα methods, `protein` and
  `aa_selection`. It combines with amino acid grouping, mirror images and size
  filtering on the same command.
- **From Python:** `biotsr.analyze(..., sse=True)`; the result's
  `category_totals()` gives the count per category.

![](diagram:modifier-scope?highlight=sse)

[Tutorial 03](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/03_sse.md)
walks through one run, and the
[SSE-TSR method record, §4](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/SSE_TSR.md#4-the-18-triplet-categories)
defines the 18 categories.

### How BioTSR differs from the earlier program

Besides the protein Cα conventions listed on the
[TSR method page](/tsr#how-biotsr-differs-from-the-earlier-implementation), the
[SSE-TSR method record, §7](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/SSE_TSR.md#7-conventions-and-how-they-differ-from-the-original-program)
describes three differences specific to the earlier SSE program:

- **β-strand identity.** The earlier program identified a strand by its serial
  number alone, which restarts in each sheet, so strands of different sheets
  could be counted as one. BioTSR names a strand by its sheet and serial number.
  This changes no key, only the category of some triangles, and only on chains
  with more than one sheet.
- **Insertion codes.** The earlier program left out residues with an insertion
  code; BioTSR keeps them.
- **The per-key category file.** The record describes a defect in the earlier
  program's per-key category file; its per-triangle category assignments are
  unaffected.
