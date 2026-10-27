---
slug: nucleotide
title: Nucleotide TSR
shortTitle: Nucleotide TSR
summary: >-
  Applies the TSR representation to nucleotide residues, filtering the eight
  RNA and DNA residue types by their expected length before generating keys.
status: published
category: method
group: nucleotide
order: 1

paper:
  title: >-
    Development of a Novel Method for Representing 3D Structures of Nucleotides
    Using the Concept of the TSR Algorithm and Evaluation of the Method Through
    Studying Specific Interactions Between DNAs and p53
  authors: >-
    Krishna Rauniyar, Tarikul I. Milon, Poorya Khajouie, Ramy Alabdulkarim,
    Yuwu Chen, Sarika Kondra, Vijay Raghavan, Wu Xu
  journal: 'Proteins: Structure, Function, and Bioinformatics'
  year: 2025
  volume: '93'
  issue: '11'
  pages: 1988–2004
  doi: 10.1002/prot.70005

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR_NUCLEOTIDE_PACKAGE
    url: https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE
    description: >-
      The method's first implementation. It is kept unchanged for provenance
      and for work that depends on it; its README has its own installation
      instructions.
    language: Python
---

## Overview

Nucleotides are the building blocks of DNA and RNA, each consisting of a sugar,
a phosphate group and a nitrogenous base. Nucleotide TSR applies the
Triangular Spatial Relationship representation to nucleotide residues, so that
the same alignment-free key comparison used for proteins can be applied to
nucleic acid structures.

The workflow filters residues so that only those matching the expected length
for their type are processed. Each of the eight supported residue types has its
own expected length, which is used as the filtering criterion:

| Code | Residue | Found in | Expected length |
| --- | --- | --- | --- |
| G | Guanine | RNA and DNA | 23 |
| A | Adenine | RNA and DNA | 22 |
| C | Cytosine | RNA and DNA | 20 |
| U | Uracil | RNA only | 20 |
| DG | Deoxyguanosine | DNA | 22 |
| DA | Deoxyadenosine | DNA | 21 |
| DC | Deoxycytosine | DNA | 19 |
| DT | Deoxythymidine | DNA | 20 |

Guanine and adenine are purine bases; cytosine, uracil and thymine are
pyrimidines. The deoxy- forms distinguish DNA from RNA during filtering.

Keys and triplets are generated for all eight residue types, and mirror-image
keys can be produced as well.

## Run it with BioTSR

BioTSR's `nucleotide` method computes TSR keys from the heavy atoms of one
nucleotide residue, each atom labelled by its element. For the deoxycytidine
DC 3 of the Dickerson–Drew dodecamer, PDB entry 1BNA:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1BNA --pdb-dir structures
biotsr run --method nucleotide --pdb structures/1BNA.pdb --chain A --entity-name DC --entity-id 3 --output results
```

Its 19 heavy atoms form 969 triangles, with 654 distinct keys, written under
the prefix `results/1BNA_A_nucleotide_DC_3`.

- **The expected lengths:** BioTSR keeps this method's rule, with the counts in
  the table above. A residue whose heavy-atom count does not match is refused
  with the reason; in 1BNA, the 5′ DC 1 has no phosphate group and is refused
  with "expected exactly 19 atoms, got 16".
- **One copy or every copy:** with `--entity-id` the calculation is that one
  residue. With `--entity-name` alone it is every residue of that name on the
  chain, taken together as one set of points, so triangles may join atoms of
  different residues; the prefix then ends in `_allcopies`.
- **A whole strand:** `nucleotide_chain` pools the nucleotides of one chain
  into one calculation. It has no expected-length rule, and names each
  nucleotide whose atoms differ from the standard set in a warning.
- **Nucleotides in contact with a protein:** the two-molecule method
  [Nucleotide–Protein TSR](/methods/nucleotide-protein) forms cross triangles
  from the atoms where a nucleic acid and a protein are in contact.
- **Options:** mirror images and size filtering.
- **From Python:** `biotsr.analyze(..., method="nucleotide", entity_name="DC",
  entity_id="3")`.

The [user guide, §9](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#9-nucleotide-tsr)
covers the nucleotide methods, and
[tutorial 02](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/02_atomic.md#one-copy-or-every-copy-on-the-chain)
compares one copy with every copy. For many structures, `biotsr batch` runs a
CSV manifest
([tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md)),
and the
[command-line guide, §12](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc)
has example Slurm job scripts for an HPC cluster.

### Comparing with the earlier package

BioTSR's expected lengths are the earlier package's own. It reads alternate
location blank or `A` only, where the earlier analyser applied no
alternate-location test, and the whole-strand method has no earlier
counterpart. BioTSR has no option to reproduce the earlier package's output
files.
