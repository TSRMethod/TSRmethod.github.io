---
slug: drug-tsr
title: DrugTSR
shortTitle: DrugTSR
summary: >-
  Represents drug and ligand 3D structures as TSR keys, and builds cross keys
  spanning both the drug and its target so a complex can be compared as a whole.
status: published
category: method
group: two-molecules
order: 1

figure:
  src: /images/methods/drug-tsr.webp
  alt: >-
    Three schematic panels of a ligand bound in a protein pocket. The first
    labels CA TSR keys between Cα atoms, Ligand/Drug TSR keys inside the ligand
    and CABS TSR keys between the Cα atoms of binding-site residues. The second
    labels CATOM TSR keys, formed by triangles spanning ligand and protein
    atoms, and ATOMBS TSR keys between binding-site atoms.
    The third shows CATOM and CATOM2 keys across two overlapping structures.
  caption: >-
    The key types DrugTSR introduces: keys within the drug, keys within the
    target, and cross keys whose triangles span both.

paper:
  title: >-
    Development of a novel representation of drug 3D structures and enhancement
    of the TSR-based method for probing drug and target interactions
  authors: >-
    Tarikul I. Milon, Yuhong Wang, Ryan L. Fontenot, Poorya Khajouie,
    Francois Villinger, Vijay Raghavan, Wu Xu
  journal: Computational Biology and Chemistry
  year: 2024
  volume: '112'
  pages: '108117'
  doi: 10.1016/j.compbiolchem.2024.108117

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      DrugTSR was first implemented here, as the DrugTSR() function. It is
      kept unchanged for provenance and for work that depends on it; its
      README has its own installation instructions.
    language: Python
---

## Overview

DrugTSR extends the Triangular Spatial Relationship (TSR)-based approach to
drug–target interactions, introducing specialised TSR keys for both the drug
and the target structure. It makes three contributions.

- **3D structure representation for drugs and ligands.** DrugTSR uses TSR keys
  to represent the 3D structures of drugs, capturing the structural
  relationships within them. These keys allow common substructures to be
  searched for, so drug properties and interaction patterns can be compared.
- **Cross TSR keys for drug–target interactions.** By constructing triangles
  that span both drug and protein atoms, cross TSR keys quantify the structural
  relationship within a drug–target complex. They distinguish binding sites and
  reveal interactions specific to primary or off-target sites, supporting
  selective drug design.
- **Side chain representations for amino acids.** A refined representation of
  side-chain interactions, which matter for drug–target binding accuracy, aids
  identification of binding sites while limiting off-target effects.

Results indicate that DrugTSR can improve clustering accuracy for drug families
and predict interaction profiles across similar drugs, with applications
ranging from virtual screening to drug design.

## Run it with BioTSR

BioTSR computes the two kinds of key at the centre of DrugTSR: keys within a
ligand, and atomic cross keys whose triangles span a ligand and its protein.
For the benzamidine (BEN) bound to trypsin in PDB entry 3PTB:

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 3PTB --pdb-dir structures
biotsr run --method drug --pdb structures/3PTB.pdb --chain A --entity-name BEN --entity-id 1 --output results
biotsr run --method drug_protein_cross --pdb structures/3PTB.pdb --chain A --chain-2 A --entity-name BEN --entity-id 1 --output results
```

The first command gives the ligand's own keys (84 triangles, 38 distinct keys,
prefix `results/3PTB_A_drug_BEN_1`). The second gives the cross keys between
the ligand and the protein chain (84 triangles, 72 distinct keys, prefix
`results/3PTB_A_A_drug_protein_cross_BEN_1`). `--chain` is the ligand's chain
and `--chain-2` the protein's; both are always required.

![](diagram:cross-triangles?example=drug)

- **Which atoms take part in a cross:** a ligand atom is kept if a protein
  heavy atom lies within the contact cutoff of it, and a protein atom if a
  ligand heavy atom does. The reference cutoff is 3.5 Å, set with
  `--contact-cutoff`, and the cutoff used is recorded with every result.
- **One copy or every copy:** with `--entity-id` the ligand is that one copy;
  without it, every copy of that name on the chain is taken together.
  `biotsr.list_entity_targets` lists the ligands on a chain.
- **Other methods:** `drug_atom_selection` uses ligand atoms you name, and the
  protein's own keys come from the protein Cα and amino-acid methods. The
  paper's named key types (CA, CABS, ATOMBS, CATOM, CATOM2) are not BioTSR
  method names, and BioTSR's documentation does not map them to its methods.
- **Options:** the `drug` method takes mirror images and size filtering; the
  cross method takes size filtering only.
- **From Python:** `biotsr.analyze(..., method="drug", ...)` and
  `biotsr.analyze_cross(..., method="drug_protein_cross", ...)`.

The [user guide, §7](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#7-drug-ligand-tsr)
covers the ligand methods,
[tutorial 04](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/04_cross.md)
the cross methods, and the
[cross-TSR method record](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/CROSS_TSR.md)
defines them.

### How BioTSR's cross keys differ from the earlier programs

The earlier cross-key programs differ from BioTSR in ways its
[cross-TSR record, §10](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/CROSS_TSR.md#10-relationship-to-the-historical-implementations)
lists one by one, among them:

- **contact filtering:** one earlier program narrowed only the protein side by
  the cutoff and admitted the whole ligand; BioTSR narrows both sides. On 6G9M
  with ligand ESW 404 at 3.5 Å, that is 37 ligand atoms against 10, and 8,325
  triangles against 900;
- **atom identity:** two earlier programs identified pooled atoms by name, so
  two same-named atoms of different residues became one;
- **alternate locations, distance classes and the angle divisor:** BioTSR reads
  alternate location blank or `A` only, uses 18 atomic distance classes, and
  divides by π rather than 3.14.

Matching the cutoff alone therefore does not reproduce an earlier program's
selection.

### Earlier settings and BioTSR's

The DrugTSR study represented a binding site in two ways, both used in its
Figure 3:

- **Cα binding site (CABS keys):** one Cα atom from each binding-site residue,
  a residue with an atom within the cutoff of the drug. The Cα itself need not
  lie within the cutoff.
- **All-atom binding site (ATOMBS keys):** only the protein atoms within the
  cutoff of the drug, not every atom of the residues they belong to.

Contact cutoffs in the group's earlier work ranged from 3 to 5 Å, most often
3.5 Å. This page does not say which cutoff each published figure used or which
program produced it.

BioTSR 1.0.0's behaviour is its own, not a record of earlier work:

- `drug_protein_cross` applies the same atom-level rule as the all-atom binding
  site, and to both sides: a protein heavy atom is kept when a ligand heavy
  atom lies within the cutoff of it, and a ligand atom when a protein heavy
  atom does. It builds only cross triangles, with atoms on both sides, and
  computes no keys over the binding-site atoms alone.
- No BioTSR method selects a ligand's binding-site residues or atoms for keys
  of the protein alone. `aa_selection` and `amino_acid_atom_selection` compute
  Cα or atomic keys over residues or atoms you list, but choosing them by their
  distance from the ligand is left to you.
- The reference cutoff is 3.5 Å, changed with `--contact-cutoff`, and the
  cutoff used is recorded with every result.
