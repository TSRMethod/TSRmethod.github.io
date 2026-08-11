---
slug: tsr
title: Triangular Spatial Relationship (TSR)
shortTitle: TSR Method
summary: >-
  An alignment-free method for comparing 3D protein structures, representing
  each structure as a set of unique integer "keys" derived from triangles
  formed by its Cα atoms.
status: published
category: core
group: core
order: 1

figure:
  src: /images/methods/tsr-method.png
  alt: >-
    Diagram of the TSR method: triangles constructed between Cα atoms of a
    protein backbone, each labelled with the integer key computed from its
    side lengths, angles and vertex labels.

paper:
  title: >-
    Development of a TSR-Based Method for Protein 3-D Structural Comparison
    With Its Applications to Protein Classification and Motif Discovery
  authors: Sarika Kondra, Titli Sarkar, Vijay Raghavan, Wu Xu
  journal: Frontiers in Chemistry
  year: 2021
  doi: 10.3389/fchem.2020.602291

repositories:
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Python package for downloading PDB files and generating TSR keys and
      triplets.
    language: Python

slurm:
  intro: >-
    Generating keys for a large set of structures is best run as a batch job.
    The script below clones the package, builds an environment and runs the
    key generation in one job.
  script:
    filename: tsr_keys.sbatch
    code: |
      #!/bin/bash
      #SBATCH -p workq
      #SBATCH -N 1
      #SBATCH -n 64
      #SBATCH -t 72:00:00
      #SBATCH -A your_allocation
      #SBATCH -J tsr_keys
      #SBATCH -o output_tsr_keys.out
      #SBATCH -e error_tsr_keys.err

      git clone https://github.com/pooryakhajouie/TSR-Package.git
      cd TSR-Package

      python3 -m venv tsrenv
      source tsrenv/bin/activate
      pip install --upgrade pip
      pip install -r requirements.txt
      pip install .

      python3 generate_keys.py
  submit:
    code: sbatch tsr_keys.sbatch
  resources: >-
    Requests one node with 64 tasks for up to 72 hours on the `workq`
    partition. Replace `your_allocation` with your own project allocation, and
    scale the wall time to the size of your dataset.
  notes: >-
    **Needs verification.** This job script follows the pattern used by the
    other TSR packages rather than one published on the original site for
    TSR-Package specifically. Confirm the partition, allocation and entry
    point against your cluster before relying on it.
---

## Overview

The Triangular Spatial Relationship (TSR) method is an approach for comparing
3D protein structures, designed to overcome the limitations of existing
structural comparison techniques. By representing protein structures using a
set of unique integers called "keys", TSR provides a comprehensive and
efficient way to analyse structural similarities and substructures without
needing superimposition or complex alignment.

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
  the unique integer key for each triangle.

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

## Installation

Clone the repository:

```bash
git clone https://github.com/pooryakhajouie/TSR-Package.git
cd TSR-Package
```

Create a virtual environment and activate it:

```bash
python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows
```

Install the package:

```bash
pip install .
```

Alternatively you can install from a built wheel, but you must build the
distribution files first:

```bash
python setup.py sdist bdist_wheel
pip install dist/tsr_package-0.1.1-py3-none-any.whl
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Once installed, you can retrieve PDB files and generate key and triplet files.

### Retrieve PDB files

```python
from tsr_package.tsr.PDB_DL import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1LBE"]
PDB_DL(pdb_ids, 'Dataset')
```

This downloads the PDB files into the specified `Dataset/` directory, which is
also the default if no directory is given.

### Generate keys and triplets

```python
from tsr_package.tsr.TSR import TSR

# Define the directory where PDB files are stored
data_dir = "Dataset"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # choose 'keys', 'triplets', or 'both'

# Process protein data to generate key files
TSR(data_dir, input_files, chain=chain, output_option=output_option)
```

Protein chains are case-sensitive and must match the chain IDs in the PDB file.

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_dir` | `str` | — | Directory containing the downloaded PDB files. |
| `input_files` | `list[str]` or `str` | — | List of PDB IDs, or the path to a CSV file. |
| `chain` | `list[str]` | — | Chain ID for each input file. Case-sensitive. |
| `output_option` | `str` | `"keys"` | One of `"keys"`, `"triplets"` or `"both"`. |

### Using a CSV file as input

```python
from tsr_package.tsr.TSR import TSR

# Define the directory and CSV file path
data_dir = "Dataset"
csv_file = "sample_details.csv"

# Process the CSV input
TSR(data_dir, csv_file, output_option="keys")
```

The CSV file should have two columns, one for the protein IDs and one for the
corresponding chains:

| protein | chain |
| --- | --- |
| 1GTA | A |
| 1GTB | A |
| 1LBE | A |

## Examples

### Retrieving PDB files and generating keys

```python
from tsr_package.tsr.PDB_DL import PDB_DL
from tsr_package.tsr.TSR import TSR

# Step 1: retrieve PDB files
data_dir = "Dataset"
pdb_ids = ["1GTA", "1gtb", "1lbe"]
chain = ["A", "A", "A"]
PDB_DL(pdb_ids, data_dir)

# Step 2: generate key files
TSR(data_dir, pdb_ids, chain=chain, output_option="keys")
```

### Using a CSV file for input

```python
from tsr_package.tsr.PDB_DL import PDB_DL
from tsr_package.tsr.TSR import TSR

# Use CSV input for batch processing
data_dir = "Dataset"
csv_file = "sample_details.csv"
PDB_DL(csv_file)
TSR(data_dir, csv_file, output_option="triplets")
```
