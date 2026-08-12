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
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Python package for downloading PDB files and generating TSR keys and
      triplets. Amino acid grouping is enabled with an argument to `TSR()`.
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

Amino acid grouping is produced by the same `TSR()` entry point as the core
method, with one extra argument.

### Retrieve PDB files

```python
from tsr_package.tsr.PDB_DL import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1LBE"]
PDB_DL(pdb_ids, 'Dataset')
```

This downloads the PDB files into the specified `Dataset/` directory, which is
also the default if no directory is given.

### Generate keys with amino acid grouping

```python
from tsr_package.tsr.TSR import TSR

# Define the directory where PDB files are stored
data_dir = "Dataset"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # choose 'keys', 'triplets', or 'both'

# Process protein data to generate key files
TSR(data_dir, input_files, chain=chain, output_option=output_option,
    aa_grouping=True)
```

Protein chains are case-sensitive and must match the chain IDs in the PDB file.

### Parameter

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `aa_grouping` | `bool` | `False` | When true, amino acids are grouped by structural similarity before keys are generated. |

### Using a CSV file as input

```python
from tsr_package.tsr.TSR import TSR

# Define the directory and CSV file path
data_dir = "Dataset"
csv_file = "sample_details.csv"

# Process the CSV input
TSR(data_dir, csv_file, output_option="keys", aa_grouping=True)
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
input_files = ["1GTA", "1gtb", "1lbe"]
chain = ["A", "A", "A"]
PDB_DL(input_files, data_dir)

# Step 2: generate key files
TSR(data_dir, input_files, chain=chain, output_option="keys",
    aa_grouping=True)
```

### Using a CSV file for input

```python
from tsr_package.tsr.PDB_DL import PDB_DL
from tsr_package.tsr.TSR import TSR

# Use CSV input
data_dir = "Dataset"
csv_file = "sample_details.csv"
PDB_DL(csv_file)
TSR(data_dir, csv_file, output_option="triplets", aa_grouping=True)
```
