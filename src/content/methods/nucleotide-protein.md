---
slug: nucleotide-protein
title: Nucleotide–Protein TSR
shortTitle: Nucleotide–Protein TSR
summary: >-
  Builds cross keys from the atoms where a nucleic acid and a protein are in
  contact, with triangles that span both molecules.
status: published
category: method
group: two-molecules
order: 2

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: Nucleotide-Protein
    url: https://github.com/KrishnaRauniyar/Nucleotide-Protein
    description: >-
      The method's first implementation, as two scripts: drug_protein_3A.py
      lists the contacts and cross_key.py builds the keys. The nucleotide
      occupies the "drug" position of a general drug–protein pipeline there,
      so their file and column names say "drug". The repository is kept
      unchanged for provenance and for work that depends on it; its README has
      its own instructions.
    language: Python
---

## Overview

Nucleotide–Protein TSR analyses contacts between nucleic acid and protein
residues, generating cross keys whose triangles span both molecules. It is
aimed at the biochemical detail of nucleotide–protein binding.

The method is a software implementation and has not been described in a
publication. It was first written as the scripts in the
[Nucleotide-Protein](https://github.com/KrishnaRauniyar/Nucleotide-Protein)
repository, and BioTSR now provides it as the `nucleotide_protein_cross`
method. Cross keys between two molecules have been published for other pairs:
a drug and its target protein in the [DrugTSR](/methods/drug-tsr) study
(Milon et al., 2024), and spike proteins and monoclonal antibodies
([Milon et al., 2025](https://doi.org/10.3389/fchem.2025.1395374)). The
nucleotide keys of [Nucleotide TSR](/methods/nucleotide) describe a nucleotide
on its own.

### Residues considered

Eight nucleotide residues, covering both RNA and DNA:

| Type | Residues |
| --- | --- |
| RNA | G (guanine), A (adenine), C (cytosine), U (uracil) |
| DNA | DG (deoxyguanine), DA (deoxyadenine), DC (deoxycytosine), DT (thymine) |

Twenty-three protein residues, spanning a range of chemical properties:

| Property | Residues |
| --- | --- |
| Nonpolar (hydrophobic) | GLY, ALA, VAL, LEU, ILE, PRO, PHE, TYR, TRP |
| Polar (uncharged) | SER, THR, MET, CYS, HIS, ASN, GLN |
| Positively charged (basic) | LYS, ARG |
| Negatively charged (acidic) | ASP, GLU |
| Modified, post-translational | TPO (phosphothreonine), SEP (phosphoserine), PTR (phosphotyrosine) |

## Which atoms are in contact

The DNA–p53 study, the earlier scripts and BioTSR all select atoms by the
distance between a nucleotide atom and a protein atom, with a cutoff.

- **The DNA–p53 study** (see [Related research](#related-research)) describes
  the amino acids surrounding a nucleotide as those with an atom within the
  cutoff of a DNA atom. Its Figure 8 used a cutoff of 3.0 Å and its Figures 9
  and 10 used 3.5 Å, as the figure legends state and the authors confirm. The
  authors also confirm that its raw data were generated with Krishna
  Rauniyar's cross-key code, with the cutoff given as an argument; which
  version of that code was used has not been identified.
- **The earlier scripts**, in
  [Nucleotide-Protein](https://github.com/KrishnaRauniyar/Nucleotide-Protein),
  list every pair of a nucleotide atom and a protein atom from the `ATOM`
  records of the file, hydrogens left out, that lie within the cutoff; in the
  repository's version it is fixed at 3 Å. Each nucleotide residue's cross keys
  are then built from its contacting atoms.
- **BioTSR** keeps a nucleotide heavy atom when a heavy atom of the named
  protein chain lies within the cutoff of it, and a protein heavy atom when a
  nucleotide heavy atom does, with the cutoff included. The reference cutoff is
  3.5 Å, set with `--contact-cutoff`, and the cutoff used is recorded with
  every result. It is the default for new calculations, not a record of the
  cutoff behind any earlier figure.

The selections differ in more than the number. The earlier scripts read every
chain of the file and identified a pooled protein atom by its name, so
same-named atoms of different residues became one; on 1KX5 that under-counts
the triangles of the affected contacts by 44%. BioTSR takes one nucleotide
chain and one protein chain, keeps every atom distinct, reads alternate
location blank or `A` only, and reads model 1. Setting `--contact-cutoff 3.0`
therefore does not by itself reproduce the earlier scripts' contacts or keys.
The
[cross-TSR record, §10](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/CROSS_TSR.md#10-relationship-to-the-historical-implementations)
lists every difference.

## Run it with BioTSR

BioTSR finds the contacts and builds the cross keys in one command,
`nucleotide_protein_cross`. For deoxyguanosine DG 8 of chain E, against protein
chain B, in PDB entry 2AC0 (p53 bound to DNA):

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 2AC0 --pdb-dir structures
biotsr run --method nucleotide_protein_cross --pdb structures/2AC0.pdb --chain E --chain-2 B --entity-name DG --entity-id 8 --output results
```

At the reference 3.5 Å, 4 nucleotide atoms and 7 protein atoms are in contact,
and they form 126 cross triangles with 117 distinct keys, written under the
prefix `results/2AC0_E_B_nucleotide_protein_cross_DG_8`. The triplets file
names every vertex atom, so no intermediate contact file is needed.

![](diagram:cross-triangles)

- **Choosing the nucleotide side:** `--chain` is the nucleotide's chain and
  `--chain-2` the protein's. `--entity-name` with `--entity-id` is one
  residue; `--entity-name` alone is every residue of that name on the chain;
  `--entity-names 'DA;DC;DG;DT'` is the whole strand.
- **The protein side** reads the 20 standard amino acids and TPO, SEP and PTR,
  the 23 residues in the table above.
- **Options:** size filtering. Mirror images are not available for cross
  methods.
- **From Python:** `biotsr.analyze_cross(..., method="nucleotide_protein_cross",
  ...)`.

The [user guide, §10](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#10-cross-tsr)
covers the cross methods,
[tutorial 04](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/04_cross.md)
runs one, and the
[cross-TSR record, §7](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/CROSS_TSR.md#7-cutoff-values)
gives the reference cutoffs. For many structures, `biotsr batch` runs a CSV
manifest
([tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md)),
and the
[command-line guide, §12](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc)
has example Slurm job scripts for an HPC cluster.

## Related research

The 2025 study of DNA–p53 interactions introduced the TSR representation of
nucleotides, which is described on [Nucleotide TSR](/methods/nucleotide), and
applied it to DNA bound to p53, p63 and p73. The paper does not describe cross
keys. The authors confirm that the study's raw data were generated with Krishna
Rauniyar's cross-key code, and that the nucleotide–protein cross-key method has
not been published. The study is therefore listed here as related research,
not as the method's publication; the software is cited through its
[repository](https://github.com/KrishnaRauniyar/Nucleotide-Protein).

Krishna Rauniyar, Tarikul I. Milon, Poorya Khajouie, Ramy Alabdulkarim, Yuwu
Chen, Sarika Kondra, Vijay Raghavan and Wu Xu.
[Development of a Novel Method for Representing 3D Structures of Nucleotides Using the Concept of the TSR Algorithm and Evaluation of the Method Through Studying Specific Interactions Between DNAs and p53](https://doi.org/10.1002/prot.70005).
*Proteins: Structure, Function, and Bioinformatics*, 2025, 93(11), 1988–2004.
