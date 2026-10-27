---
slug: amino-acid-grouping
title: Amino Acid Grouping TSR
shortTitle: Amino Acid Grouping TSR
summary: >-
  Groups amino acids by structural similarity before generating keys, so that
  related substructures match even when the residues themselves differ.
status: published
category: method
group: one-molecule
order: 1

figure:
  src: /images/methods/amino-acid-grouping.webp
  alt: >-
    Two clustered heatmaps of protein kinase structures side by side, labelled
    "apply amino acid grouping". Before grouping, PKB appears as two separate
    blocks either side of PKA. After grouping, PKB forms a single block, with
    PKA and PKC each remaining distinct.
  caption: >-
    Amino acid grouping merges two separated PKB clusters into one, while
    keeping PKA and PKC distinct.

paper:
  title: >-
    Exploring the effectiveness of the TSR-based protein 3-D structural
    comparison method for protein clustering, and structural motif
    identification and discovery of protein kinases, hydrolases, and
    SARS-CoV-2's protein via the application of amino acid grouping
  authors: Titli Sarkar, Vijay V. Raghavan, Feng Chen, Andrew Riley, Sophia Zhou, Wu Xu
  journal: Computational Biology and Chemistry
  year: 2021
  doi: 10.1016/j.compbiolchem.2021.107479

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Grouping was first implemented here, as the aa_grouping argument of the
      TSR() function. It is kept unchanged for provenance and for work that
      depends on it; its README has its own installation instructions.
    language: Python
---

## Overview

Amino acid grouping was introduced to improve the accuracy of identifying
structurally conserved regions across proteins. By grouping amino acids
according to their structural similarities, the method better captures global
structural similarities and makes it easier to discover conserved motifs, which
are important for understanding protein function.

Applied to the Triangular Spatial Relationship (TSR)-based method, amino acid
grouping has been shown to modestly improve the accuracy of protein clustering
in specific cases. It also aids in identifying key substructures, referred to
as common and specific keys. Common keys represent substructures shared among
different types of proteins, while specific keys belong to a particular protein
type, giving deeper insight into structural relationships.

The work also demonstrates that amino acid grouping helps uncover conserved
binding sites, such as those found in proteins involved in viral infections
including SARS-CoV-2. These findings are relevant to antiviral drug design,
where identifying critical structural features supports therapeutic targeting.

## Run it with BioTSR

Amino acid grouping is an option of BioTSR's protein Cα method,
`--aa-grouping`. To compute grouped keys for chain A of ubiquitin:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --aa-grouping --output results
```

The run forms the same 70,300 triangles as an ungrouped one, but they produce
26,395 distinct keys rather than 45,349, because residues in the same group now
share a label. The files are written under the prefix
`results/1UBQ_A_protein_aagroup`.

- **Which methods take it:** the two protein Cα methods, `protein` and
  `aa_selection` (the Cα atoms of residues you list). Every other method
  refuses the option.
- **From Python:** `biotsr.analyze(..., aa_grouping=True)`.
- **Comparing results:** grouped and ungrouped keys are different key spaces,
  and BioTSR will not compare a grouped result with an ungrouped one.

![](diagram:modifier-scope?highlight=aa-grouping)

For many structures, a two-column CSV of protein IDs and chains, as the
earlier package used, works as a BioTSR manifest; `--download-missing` fetches
any structure not yet in the folder:

```csv
protein,chain
1GTA,A
1GTB,A
1LBE,A
```

```bash
biotsr batch --manifest sample_details.csv --method protein --aa-grouping --pdb-dir structures --download-missing --output results
```

[Tutorial 01](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/01_protein_calpha.md#the-three-cα-modifiers)
runs grouping beside the other Cα options, and the
[user guide, §11](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#11-modifiers)
describes every option.

### Grouped labels in BioTSR

BioTSR keeps the 13 groups of the standard amino acids. Selenomethionine
(MSE) takes methionine's group, and each other supported modified residue keeps
a label of its own: 23 grouped labels in all, encoded at radix 30. The earlier
implementation encoded its 13 groups within the ungrouped 20-label space, so
the same grouped triangle receives a different integer in the two programs;
[SSE-TSR §7](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/SSE_TSR.md#7-conventions-and-how-they-differ-from-the-original-program)
lists this with BioTSR's other conventions.
