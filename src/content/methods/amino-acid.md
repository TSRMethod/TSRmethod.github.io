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
  - name: TSR_AMINOACID_PACKAGE
    url: https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE
    description: >-
      Standalone Python package for amino-acid-level TSR key and triplet
      generation. Separate from the core TSR-Package.
    language: Python

slurm:
  intro: >-
    Key generation over a large structure set is best run as a batch job. Put
    the Python from the Usage section into a script, then submit the job below.
  script:
    filename: aminoacid_keys.sbatch
    code: |
      #!/bin/bash
      #SBATCH -p workq
      #SBATCH -N 1
      #SBATCH -n 64
      #SBATCH -t 72:00:00
      #SBATCH -A loni_tsr_4
      #SBATCH -J pdb
      #SBATCH -o output_pdb.out
      #SBATCH -e error_pdb.err

      git clone https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE.git
      cd TSR_AMINOACID_PACKAGE

      python3 -m venv myenv
      source myenv/bin/activate
      pip install --upgrade pip
      pip install -e .
      pip install -r requirements.txt

      cd aminoacid_tsr_package
      python3 your_script.py
  submit:
    code: sbatch aminoacid_keys.sbatch
  resources: >-
    Requests one node with 64 tasks for up to 72 hours on the `workq`
    partition, under the group's `loni_tsr_4` allocation. Substitute your own
    allocation, and scale the wall time to your dataset.
  notes: >-
    Replace `your_script.py` with your own script containing the `PDB_DL` and
    `AminoAcidProteinTSR` calls from the Usage section.
---

## Overview

Amino Acid TSR generates TSR keys and triplets at the level of individual amino
acids rather than whole protein chains, using a separate package from the core
TSR method.

> **Not the same as [Amino Acid Grouping TSR](/methods/amino-acid-grouping).**
> That method groups amino acids by structural similarity before generating
> whole-protein keys, and is an argument to the core `TSR()` function. This
> method represents each amino acid itself, and lives in its own package.

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

## Installation

Clone the repository:

```bash
git clone https://github.com/KrishnaRauniyar/TSR_AMINOACID_PACKAGE.git
cd TSR_AMINOACID_PACKAGE
```

Create a virtual environment and activate it:

```bash
python -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows
```

Install the package and its dependencies:

```bash
pip install -e .
pip install -r requirements.txt
```

Then change into the package directory to run the commands below:

```bash
cd aminoacid_tsr_package
```

## Usage

### Retrieve PDB files

```python
from aminoacid_tsr_package.PDB_DL import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1lbe"]
PDB_DL(pdb_ids, 'Dataset/')
```

Protein IDs are not case-sensitive. A CSV file can be used instead of a list:

```python
from aminoacid_tsr_package.PDB_DL import PDB_DL

data_dir = "Dataset/"
csv_file = "sample_details.csv"
PDB_DL(csv_file, data_dir)
```

### Generate keys and triplets

```python
from aminoacid_tsr_package.AminoAcid import AminoAcidProteinTSR

# Define the directory where PDB files are stored
data_dir = "Dataset/"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # 'keys', 'triplets', or 'both'

AminoAcidProteinTSR(data_dir, input_files, chain=chain,
                    output_option=output_option, mirror_image=True)
```

Chains are case-sensitive, since chain IDs may be upper or lower case.

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_dir` | `str` | — | Directory where the PDB files are, or will be downloaded to. |
| `input_files` | `list[str]` or `str` | — | List of PDB IDs, or the path to a CSV file. |
| `chain` | `list[str]` | `None` | Chain for each input file. Optional when a CSV is used. |
| `output_option` | `str` | `'both'` | One of `'keys'`, `'triplets'` or `'both'`. |
| `output_subdir` | `str` | `'aminoacid_results'` | Subdirectory of `data_dir` for the generated files. |
| `mirror_image` | `bool` | `False` | Set true to distinguish mirror-image triangles. |

### Using a CSV file as input

```python
from aminoacid_tsr_package.AminoAcid import AminoAcidProteinTSR

data_dir = "Dataset/"
csv_file = "sample_details.csv"

AminoAcidProteinTSR(data_dir, csv_file, output_option="keys",
                    mirror_image=True)
```

The CSV file should have two columns:

| protein | chain |
| --- | --- |
| 1GTA | A |
| 1GTB | A |
| 1LBE | A |

## Output

Keys and triplet frequency files are written to `aminoacid_results/`, a
directory created inside `data_dir`.

## Examples

### Retrieving PDB files and generating keys

```python
from aminoacid_tsr_package.PDB_DL import PDB_DL
from aminoacid_tsr_package.AminoAcid import AminoAcidProteinTSR

# Step 1: retrieve PDB files
data_dir = "Dataset/"
pdb_ids = ["1GTA", "1gtb", "1lbe"]   # not case-sensitive
chain = ["A", "A", "A"]              # case-sensitive
PDB_DL(pdb_ids, data_dir)

# Step 2: generate key files
AminoAcidProteinTSR(data_dir, pdb_ids, chain=chain, output_option="keys",
                    mirror_image=True)
```

### Using a CSV file for input

```python
from aminoacid_tsr_package.PDB_DL import PDB_DL
from aminoacid_tsr_package.AminoAcid import AminoAcidProteinTSR

data_dir = "Dataset/"
csv_file = "sample_details.csv"
PDB_DL(csv_file, data_dir)
AminoAcidProteinTSR(data_dir, csv_file, output_option="triplets",
                    mirror_image=True)
```
