---
slug: size-filtering
title: Size-Filtering TSR
shortTitle: Size-Filtering TSR
summary: >-
  Compares proteins of very different sizes fairly, by discarding triangles
  from the larger structure that the smaller one could not possibly contain.
status: published
category: method
group: one-molecule
order: 3

figure:
  src: /images/methods/size-filtering.webp
  alt: >-
    Two clustered heatmaps of receptor structures side by side, labelled
    "applying size filtering". Before filtering, one glucocorticoid receptor
    (5UC1) is boxed separately from the other seven glucocorticoids. After
    filtering, all eight glucocorticoid receptors fall inside a single box.
  caption: >-
    Size filtering brings a glucocorticoid receptor that had been separated by
    size back together with the rest of its family.

paper:
  title: >-
    A study of a hierarchical structure of proteins and ligand binding sites of
    receptors using the triangular spatial relationship-based structure
    comparison method and development of a size-filtering feature designed for
    comparing different sizes of protein structures
  authors: >-
    Sarika Kondra, Feng Chen, Yixin Chen, Yuwu Chen, Caleb J. Collette, Wu Xu
  journal: 'Proteins: Structure, Function, and Bioinformatics'
  year: 2022
  volume: '90'
  issue: '1'
  pages: 239–257
  doi: 10.1002/prot.26215

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Size filtering was first implemented here, as the size_filter argument
      of the TSR() function. It is kept unchanged for provenance and for work
      that depends on it; its README has its own installation instructions.
    language: Python
---

## Overview

Protein comparison often encounters difficulties when analysing proteins of
vastly different sizes. Smaller proteins may appear structurally dissimilar to
larger ones simply because of the size difference, leading to underestimation
of structural similarities. The size-filtering algorithm is an enhancement to
the Triangular Spatial Relationship (TSR)-based method designed to address
this.

Size filtering works by calculating the MaxDist — the maximum distance between
Cα atoms — for all triangles in the proteins being compared. Triangles from the
larger protein that exceed the MaxDist of the smaller one are filtered out,
removing outliers that skew the similarity calculation. After filtering, the
comparison is performed using Jaccard similarity, resulting in improved
clustering of proteins.

Studies demonstrated the effectiveness of this method across several protein
families. Applying size filtering to glucocorticoid receptors led to improved
clustering results, grouping proteins that had previously been separated
because of size differences. Similar improvements were observed with other
protein families, including phosphatases and GPCRs.

By refining structural similarity measurements, size filtering enables more
accurate comparisons between proteins of different sizes and helps uncover
their functional relationships.

## Run it with BioTSR

Size filtering is an option of every BioTSR method, `--size-filter`, followed
by a distance in ångströms. A run keeps only the triangles whose longest edge,
MaxDist, is below that distance:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --size-filter 25 --output results
```

With a 25 Å cutoff, ubiquitin chain A keeps 60,742 of its 70,300 triangles,
which give 37,522 distinct keys. The files are written under the prefix
`results/1UBQ_A_protein_size25`, and the run records how many triangles the
filter removed.

- **Choosing the cutoff:** BioTSR applies one fixed cutoff per run and does
  not derive it from a second structure. In the published comparison the
  cutoff for the larger protein was the MaxDist of the smaller one, so choose
  the value from the smaller structure and pass it when computing the larger.
- **Compared with the earlier package:** the filter is the same as in
  TSR-Package, where a value of 10000 meant no filtering, and keeps triangles
  strictly below the cutoff. In BioTSR it is off unless the option is given,
  and a run reports the triangles it removed.
- **Which methods take it:** all 20 methods, the cross methods included.
- **From Python:** `biotsr.analyze(..., size_filter=25.0)`.
- **Comparing results:** filtering keeps the same key space, so filtered keys
  are still comparable with unfiltered ones, but the analysis functions ask
  you to confirm that you mean to mix the two
  ([tutorial 07](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/07_analysis.md#what-has-to-match-and-what-never-blocks)).

![](diagram:modifier-scope?highlight=size-filter)

[Tutorial 01](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/01_protein_calpha.md#the-three-cα-modifiers)
runs the option beside the other Cα options, and the
[user guide, §11](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#11-modifiers)
describes every option.
