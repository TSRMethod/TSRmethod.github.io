---
slug: tsr
title: Triangular Spatial Relationship (TSR)
shortTitle: TSR Method
summary: An alignment-free method for comparing 3D protein structures. Every
  triangle formed by a structure's Cα atoms is encoded as an integer "key", and
  the structure is represented by its distinct keys and how often each occurs.
status: published
category: core
group: core
order: 1
figure:
  src: /images/methods/tsr-method.png
  alt: "Flowchart of the published TSR method. Three Cα atoms (Leu, Ile and Phe
    in PDB entry 2ZOQ) form a triangle and their amino acids are labelled l1,
    l2 and l3. Four rule-based cases order the labels, using the edge lengths
    d12, d13 and d23 to break ties. The angle θ1 and the distance d3 are
    computed from the median drawn from the midpoint of edge d12, θ is folded
    to at most 90 degrees, both are binned, and keys are calculated for all
    C(n,3) triplets."
  caption: "The key generation steps and label-assignment rules as published
    (Kondra et al., 2021)."
paper:
  title: Development of a TSR-Based Method for Protein 3-D Structural Comparison
    With Its Applications to Protein Classification and Motif Discovery
  authors: Sarika Kondra, Titli Sarkar, Vijay Raghavan, Wu Xu
  journal: Frontiers in Chemistry
  year: 2021
  doi: 10.3389/fchem.2020.602291
repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      The method's first implementation. It is kept unchanged for provenance
      and for work that depends on it; its README has its own installation
      instructions.
    language: Python
---
## Overview

The Triangular Spatial Relationship (TSR) method is an approach for comparing
3D protein structures, designed to overcome the limitations of existing
structural comparison techniques. Each triangle of Cα atoms receives an
integer "key" that encodes its three residue labels and the classes its angle
and longest edge fall into, so different triangles can share a key. By
representing a protein structure as its distinct keys and their frequencies,
TSR provides a comprehensive and efficient way to analyse structural
similarities and substructures without needing superimposition or complex
alignment.

### Key generation process

- **Cα atom selection.** TSR begins by selecting Cα atoms from the protein's
PDB file as vertices for triangle construction.
- **Triangle construction.** All possible triangles formed by these Cα atoms
are generated, with their edge lengths and internal angles calculated.
- **Label assignment.** Each Cα is assigned an integer identifier (ranging
from 4 to 23) which uniquely represents the amino acid. This ensures that
identical triangles across different proteins are assigned the same integer
identifiers.
- **Key calculation.** The identifiers for each triangle are transformed to
create labels (li1, li2, li3). Using a rule-based formula, distances and
specific angles are determined, which are then used in equations to generate
an integer key for each triangle. Triangles with the same labels and the same
angle and distance classes receive the same key.

> These steps describe the method as published in 2021. BioTSR keeps its
> labels for the 20 standard amino acids and extends them to some modified
> residues; see [Residue labels in BioTSR](#residue-labels-in-biotsr).

![](diagram:tsr-overview)

### Worked example

![](diagram:tsr-worked-example)

### Distinguishing features

- **No structural superimposition.** TSR avoids rotation and translation
issues, unlike RMSD-based methods, enabling more consistent structural
comparison.
- **Shape representation.** By using triangles — the simplest form to capture
shape — TSR effectively identifies local substructures.
- **Amino acid integration.** The inclusion of amino acid information ensures
that triangles with the same geometric properties but different amino acids
are assigned different keys.
- **Motif discovery.** TSR allows for the discovery of shared substructures,
from simple triangles to complex motifs, by identifying connected triangles
through shared vertices or edges.

### Applications

- **Structural comparison.** TSR quantifies protein similarity based on the
number of identical keys, providing insight into protein relationships.
- **Motif search.** Capable of identifying unique and conserved motifs across
protein families.
- **Conformational analysis.** TSR can capture protein conformational changes
and differentiate between homologous and non-homologous structures.

## Run it with BioTSR

BioTSR computes protein Cα TSR keys for one chain with one command. To install
it, download ubiquitin and compute the keys of its chain A:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ --pdb-dir structures
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --output results
```

This writes `results/1UBQ_A_protein.keys`, with every key of the chain and how
often it occurs, together with the list of triangles and two records of how the
result was computed. [Getting started](/software/get-started) explains each
file and sets up a virtual environment first.

Amino acid grouping, mirror images, size filtering and secondary structure
annotation are options of this same command rather than separate programs.
[Tutorial 01](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/01_protein_calpha.md)
shows the first three, and
[tutorial 03](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/03_sse.md)
the secondary-structure annotation. For many structures, `biotsr batch` runs a
CSV manifest
([tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md));
for an HPC cluster, the
[command-line guide, §12](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc)
has example Slurm job scripts.

### Residue labels in BioTSR

In the published method, each Cα is labelled with one of 20 codes, 4 to 23, one
for each standard amino acid. BioTSR keeps those 20 codes and adds codes 24 to
33 for ten modified residues, such as phosphothreonine (TPO) and
phosphoserine (SEP); selenomethionine (MSE) takes methionine's code. The three labels of a triangle are encoded at radix 30, so
two different combinations of residue labels never produce the same key. Keys computed under this scheme are
compared only with keys computed under the same scheme.

### How BioTSR differs from the earlier implementation

BioTSR has no option to reproduce the output of
[TSR-Package](https://github.com/pooryakhajouie/TSR-Package), the method's
first implementation. For protein Cα TSR its documentation lists four
differences from that program:

- angles are divided by π, where the earlier program used the literal 3.14,
  which moves some triangles across an angle-class boundary;
- the highest of the 35 distance classes can be reached, where the earlier
  program had 34 in effect;
- grouped labels are encoded at radix 30 rather than within the 20-label space;
- modified residues written as `HETATM` records, such as TPO and SEP, are
  read as points, where the earlier program read `ATOM` records only.

The
[SSE-TSR method record, §7](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/SSE_TSR.md#7-conventions-and-how-they-differ-from-the-original-program)
gives the details, and the
[known limitations, §1](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/KNOWN_LIMITATIONS.md#1-the-standard-only)
the general rule.
