---
slug: amino-acid
title: Amino Acid TSR
shortTitle: Amino Acid TSR
summary: >-
  Generates TSR keys at the level of individual amino acids, filtering residues
  against the expected length for each residue type before triplets are formed.
status: published
category: method
group: one-molecule
order: 5

paper:
  title: >-
    A Parallel Implementation for Large-Scale TSR-based 3D Structural
    Comparisons of Protein and Amino Acid
  authors: >-
    Feng Chen, Tarikul I. Milon, Poorya Khajouie, Antoinette Myers, Wu Xu
  journal: Current Bioinformatics
  year: 2025
  volume: '20'
  issue: '6'
  pages: 564–579
  doi: 10.2174/0115748936306625240724102438

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR_AMINOACID_PACKAGE
    url: https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE
    description: >-
      The method's first implementation. It is kept unchanged for provenance
      and for work that depends on it; its README has its own installation
      instructions.
    language: Python
---

## Overview

Amino Acid TSR generates TSR keys and triplets at the level of individual amino
acids rather than whole protein chains: the points of its triangles are the
heavy atoms of one residue, not the Cα atoms of a chain.

> **Not the same as [Amino Acid Grouping TSR](/methods/amino-acid-grouping).**
> That method groups amino acids by structural similarity before generating
> whole-protein Cα keys. This method represents each amino acid itself, from
> its atoms.

Key triplet generation filters residues against the expected length for each
amino acid type, so that only residues meeting the specified condition are
processed. The expected lengths are:

| Residue | Expected length |
| --- | --- |
| GLY (Glycine) | 4 |
| ALA (Alanine) | 5 |
| SER (Serine), CYS (Cysteine) | 6 |
| VAL (Valine), PRO (Proline), THR (Threonine) | 7 |
| LEU (Leucine), ILE (Isoleucine), MET (Methionine), ASP (Aspartic acid), ASN (Asparagine) | 8 |
| LYS (Lysine), GLU (Glutamic acid), GLN (Glutamine) | 9 |
| HIS (Histidine), SEP (Phosphoserine) | 10 |
| PHE (Phenylalanine), ARG (Arginine), TPO (Phosphothreonine) | 11 |
| TYR (Tyrosine) | 12 |
| TRP (Tryptophan) | 14 |
| PTR (Phosphotyrosine) | 16 |

Applying these conditions ensures only relevant residues are processed, which
supports identification of structural motifs and functional characteristics
within protein chains at triplet level.

### Publications

Amino Acid TSR was reported in the 2025 study of spike protein and monoclonal
antibody interactions:

Tarikul I. Milon, Titli Sarkar, Yixin Chen, Jordan M. Grider, Feng Chen,
Jun-Yuan Ji, Seetharama D. Jois, Konstantin G. Kousoulas, Vijay Raghavan and
Wu Xu.
[Development of the TSR-based computational method to investigate spike and monoclonal antibody interactions](https://doi.org/10.3389/fchem.2025.1395374).
*Frontiers in Chemistry*, 2025, 13, 1395374.

The paper linked at the top of this page, Chen et al. (2025), describes a
parallel implementation of TSR comparisons for proteins and amino acids.

## Run it with BioTSR

BioTSR's `amino_acid_atomic` method computes TSR keys from the heavy atoms of
one amino acid at a time, each atom labelled by its element. To compute them
for Leu15 of ubiquitin:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method amino_acid_atomic --pdb structures/1UBQ.pdb --chain A --residue 15 --residue-name LEU --output results
```

Leucine's 8 heavy atoms form 56 triangles, with 46 distinct keys, written under
the prefix `results/1UBQ_A_amino_acid_atomic_LEU_15`.

![](diagram:point-choice)

- **One residue, one type, or the whole chain:** give `--residue` with
  `--residue-name` for one residue, `--residue-name` alone for one calculation
  per residue of that name, or neither for one calculation per residue of the
  chain. Each residue gets its own files, and a sweep has one completion
  record.
- **The expected atom counts:** BioTSR keeps this method's rule that a residue
  is computed only when its heavy-atom count matches the table above. A residue
  that does not match is declined and the reason recorded; a C-terminal residue
  with its extra `OXT` oxygen is one example.
- **Related methods:** `aa_ind` and `aa_ind_mix` pool every atom of one or
  more residue types, `aa_ind_specific` pools named residues, and
  `amino_acid_atom_selection` uses atoms you name.
- **Options:** mirror images and size filtering. Amino acid grouping and SSE
  annotation are Cα options and are refused here.
- **From Python:** `biotsr.analyze(..., method="amino_acid_atomic",
  residue="15", residue_name="LEU")`.

The [user guide, §5](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#5-amino-acid-atomic-tsr)
covers every amino-acid method, and
[tutorial 02](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/02_atomic.md#one-amino-acid-residue)
runs one. For many structures, `biotsr batch` runs a CSV manifest
([tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md)),
and the
[command-line guide, §12](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc)
has example Slurm job scripts for an HPC cluster.

### Comparing with the earlier package

BioTSR's expected atom counts are the earlier package's own, transcribed
unchanged. BioTSR labels each atom from the element field of its PDB record
(columns 77–78) and has no option to reproduce the earlier package's output
files; the
[known limitations, §1](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/KNOWN_LIMITATIONS.md#1-the-standard-only)
explain where its standard definitions come from.
