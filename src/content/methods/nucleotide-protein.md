---
slug: nucleotide-protein
title: Nucleotide–Protein TSR
shortTitle: Nucleotide–Protein TSR
summary: >-
  Finds nucleotide–protein contacts within 3 Å and builds cross keys whose
  triangles span both the nucleic acid and the protein.
status: published
category: method
group: nucleotide
order: 2

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
  - name: Nucleotide-Protein
    url: https://github.com/KrishnaRauniyar/Nucleotide-Protein
    description: >-
      Two command-line scripts: contact detection within 3 Å, then cross key
      generation from the resulting CSV.
    language: Python

slurm:
  intro: >-
    Both steps run in a single batch job, the contact detection feeding
    straight into cross key generation.
  script:
    filename: cross_key.sbatch
    code: |
      #!/bin/bash
      #SBATCH -p workq
      #SBATCH -N 1
      #SBATCH -n 64
      #SBATCH -t 72:00:00
      #SBATCH -A loni_tsr_4
      #SBATCH -J cross_key
      #SBATCH -o output_cross_key.out
      #SBATCH -e error_cross_key.err

      git clone https://github.com/KrishnaRauniyar/Nucleotide-Protein.git
      cd Nucleotide-Protein

      python3 -m venv myenv
      source myenv/bin/activate
      pip install --upgrade pip
      pip install -r requirements.txt

      python3 drug_protein_3A.py -p pdb_downloaded -c sample_details_p53_dna.csv \
        -l drug_atom_lexical_txt.csv -o drug_protein_cross.csv && \
      python3 cross_key.py -p drug_protein_cross.csv -o cross_key_results
  submit:
    code: sbatch cross_key.sbatch
  resources: >-
    Requests one node with 64 tasks for up to 72 hours on the `workq`
    partition, under the group's `loni_tsr_4` allocation. Substitute your own
    allocation, and scale the wall time to your dataset.
  notes: >-
    The two commands are chained with `&&`, so cross key generation only runs
    if contact detection succeeded.
---

## Overview

Nucleotide–Protein TSR analyses contacts between nucleic acid and protein
residues, generating cross keys whose triangles span both molecules. It is
aimed at the biochemical detail of nucleotide–protein binding, such as the
interactions between DNA and p53 studied in the accompanying paper.

> **A note on naming.** In this workflow the nucleotide occupies the "drug"
> position of a general drug–protein cross-key pipeline. The script is called
> `drug_protein_3A.py` and its output column is `drug`, but in this context
> those refer to the nucleotide. This is the upstream repository's own
> terminology, kept here so that the commands and column names on this page
> match what you will actually run and see.

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

## Installation

Clone the repository:

```bash
git clone https://github.com/KrishnaRauniyar/Nucleotide-Protein.git
cd Nucleotide-Protein
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows

pip install -r requirements.txt
```

This repository is a pair of command-line scripts rather than an installable
package, so there is no `pip install .` step.

## Usage

The workflow is two steps: find the contacts, then build keys from them.

### Step 1 — find contacts within 3 Å

```bash
python drug_protein_3A.py -p pdb_download_path -c input_file.csv \
  -l drug_atom_lexical_txt.csv -o drug_protein_cross.csv
```

| Option | Description |
| --- | --- |
| `-p`, `--input_path` | Directory to download PDB files into. Created if absent. |
| `-c`, `--csv_file` | Input CSV listing the protein names, for example `sample_details_p53_dna.csv`. |
| `-l`, `--lexical_file` | CSV of atom sequence numbers. |
| `-o`, `--output_csv` | Output CSV, the input to step 2. |

The script creates the download directory if needed, downloads the structures
from RCSB, calculates interactions within 3 Å, and writes the results.

### The intermediate CSV

`drug_protein_cross.csv` has one row per contact. The first three columns
describe the nucleotide atom, the next three the protein atom, and the last the
distance between them:

| drug | drug_seq | drug_coordinates | protein | protein_seq | protein_coordinates | distance (angstrom) |
| --- | --- | --- | --- | --- | --- | --- |
| 3D0A_E_DC_1_O5' | 109 | -3.283_17.038_0.965 | 3D0A_A_SER_121_O | 109 | -2.462_18.759_2.734 | 2.6 |
| 3D0A_E_DC_1_C5' | 106 | -3.710_17.876_-0.156 | 3D0A_A_SER_121_O | 109 | -2.462_18.759_2.734 | 3.3 |
| 3D0A_E_DG_2_OP2 | 109 | -5.794_20.820_2.780 | 3D0A_A_SER_121_N | 108 | -4.315_20.590_5.173 | 2.8 |

### Step 2 — generate cross keys

```bash
python cross_key.py -p drug_protein_cross.csv -o output_dir
```

| Option | Description |
| --- | --- |
| `-p`, `--input_path` | The CSV produced by step 1. |
| `-o`, `--output_path` | Directory for the generated key files. |

## Output

Cross keys are generated for triangles spanning both molecules, in two
arrangements:

- one nucleotide atom and two protein atoms
- two nucleotide atoms and one protein atom

Two files are written per structure into the output directory:

| File | Contents |
| --- | --- |
| `<name>.keys_theta29_dist18` | The keys themselves, e.g. `1_1TSR_E_DT.keys_theta29_dist18` |
| `<name>.keys_Freq_theta29_dist18` | Triplet frequencies |

> A triangle needs three atoms. Where fewer than three are available, no cross
> keys are produced and the run reports it, for example
> `Cannot make keys for 46_3TS8_L_DT having only 2 atoms.`
