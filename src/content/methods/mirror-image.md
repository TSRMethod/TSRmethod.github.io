---
slug: mirror-image
title: Mirror-Image TSR
shortTitle: Mirror-Image TSR
summary: >-
  Extends TSR with keys that distinguish a triangle from its mirror image, so
  that stereochemistry is captured rather than lost.
status: published
category: method
group: one-molecule
order: 2

figure:
  src: /images/methods/mirror-image.webp
  alt: >-
    Two triangles either side of a mirror line, each with vertices labelled
    aa1, aa2 and aa3 and the same angle theta and MaxDist edge. The triangle on
    the left is marked "a positive key" and its reflection on the right is
    marked "a negative key".
  caption: >-
    A triangle and its reflection receive keys of equal magnitude and opposite
    sign, which is what allows the two to be told apart.

paper:
  title: >-
    Introducing mirror-image discrimination capability to the TSR-based method
    for capturing stereo geometry and understanding hierarchical structure
    relationships of protein receptor family
  authors: >-
    Titli Sarkar, Yuwu Chen, Yu Wang, Yixin Chen, Feng Chen, Camille R. Reaux,
    Laura E. Moore, Vijay Raghavan, Wu Xu
  journal: Computational Biology and Chemistry
  year: 2023
  doi: 10.1016/j.compbiolchem.2023.107824

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Mirror-image keys were first implemented here, as the mirror_image
      argument of the TSR() function. It is kept unchanged for provenance and
      for work that depends on it; its README has its own installation
      instructions.
    language: Python
---

## Overview

Building on the Triangular Spatial Relationship (TSR) method, Mirror-Image TSR
addresses a key limitation: the inability to distinguish between triangles that
are mirror images of each other. This distinction is critical, as many
biological processes are stereospecific, with molecules such as enzymes and
receptors showing preferences for particular geometric arrangements of atoms.

Mirror-Image TSR extends the original approach by incorporating keys that
account for the chirality of protein structures. Chirality refers to the
geometric property where molecules, despite having the same atomic
connectivity, exist as non-superimposable mirror images. This is particularly
important in drug development, where enantioselectivity plays a crucial role in
determining the function of pharmaceuticals.

By modifying the key generation formula to include mirror-image recognition,
Mirror-Image TSR captures the stereochemical properties of protein structures,
enabling discrimination between enantiomers. This provides greater precision in
identifying dynamic structural changes and molecular recognition processes,
making it a useful tool for analysing stereochemistry in proteins and their
interactions with ligands and drugs.

## Run it with BioTSR

Mirror-image keys are an option of BioTSR's single-structure methods,
`--mirror`. To compute them for chain A of ubiquitin:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --mirror --output results
```

A triangle's key is negated when its angle θ, before it is folded into 0–90°,
exceeds 90°, so a triangle and its mirror image receive keys of opposite sign.
For ubiquitin chain A the 70,300 triangles give 51,913 distinct keys, 24,909 of
them negative, against 45,349 without the option. The files are written under
the prefix `results/1UBQ_A_protein_mirror`, and the category column of the keys
file reads `mirror`.

- **Which methods take it:** both protein Cα methods and all 13 atomic
  methods, from single amino acids to ligands, carbohydrates and nucleotides.
  The five cross methods refuse it; no earlier cross program had a mirror
  convention.
- **From Python:** `biotsr.analyze(..., mirror=True)`.
- **Comparing results:** mirror keys are a different key space from unsigned
  keys, and BioTSR will not compare the two.
- **Compared with the earlier package:** where BioTSR's protein Cα conventions
  differ from TSR-Package's, such as dividing angles by π rather than 3.14,
  the [TSR method page](/tsr#how-biotsr-differs-from-the-earlier-implementation)
  lists the differences.

![](diagram:modifier-scope?highlight=mirror)

[Tutorial 01](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/01_protein_calpha.md#the-three-cα-modifiers)
runs the option beside the other Cα options, and the
[user guide, §11](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#11-modifiers)
describes every option. For many structures, `biotsr batch` runs a CSV manifest
([tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md)).
