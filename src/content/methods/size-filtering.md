---
slug: size-filtering
title: Size-Filtering TSR
shortTitle: Size-Filtering TSR
summary: >-
  Compares proteins of very different sizes fairly, by discarding triangles
  from the larger structure that the smaller one could not possibly contain.
status: published
category: method
group: one-molecule
order: 3

figure:
  src: /images/methods/size-filtering.webp
  alt: >-
    Two clustered heatmaps of receptor structures side by side, labelled
    "applying size filtering". Before filtering, one glucocorticoid receptor
    (5UC1) is boxed separately from the other seven glucocorticoids. After
    filtering, all eight glucocorticoid receptors fall inside a single box.
  caption: >-
    Size filtering brings a glucocorticoid receptor that had been separated by
    size back together with the rest of its family.

paper:
  title: >-
    A study of a hierarchical structure of proteins and ligand binding sites of
    receptors using the triangular spatial relationship-based structure
    comparison method and development of a size-filtering feature designed for
    comparing different sizes of protein structures
  authors: >-
    Sarika Kondra, Feng Chen, Yixin Chen, Yuwu Chen, Caleb J. Collette, Wu Xu
  journal: Proteins
  year: 2021
  doi: 10.1002/prot.26215

repositories:
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Python package for downloading PDB files and generating TSR keys and
      triplets. Size filtering is enabled with an argument to `TSR()`.
    language: Python
---

## Overview

Protein comparison often encounters difficulties when analysing proteins of
vastly different sizes. Smaller proteins may appear structurally dissimilar to
larger ones simply because of the size difference, leading to underestimation
of structural similarities. The size-filtering algorithm is an enhancement to
the Triangular Spatial Relationship (TSR)-based method designed to address
this.

Size filtering works by calculating the MaxDist — the maximum distance between
Cα atoms — for all triangles in the proteins being compared. Triangles from the
larger protein that exceed the MaxDist of the smaller one are filtered out,
removing outliers that skew the similarity calculation. After filtering, the
comparison is performed using Jaccard similarity, resulting in improved
clustering of proteins.

Studies demonstrated the effectiveness of this method across several protein
families. Applying size filtering to glucocorticoid receptors led to improved
clustering results, grouping proteins that had previously been separated
because of size differences. Similar improvements were observed with other
protein families, including phosphatases and GPCRs.

By refining structural similarity measurements, size filtering enables more
accurate comparisons between proteins of different sizes and helps uncover
their functional relationships.

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

Size filtering is produced by the same `TSR()` entry point as the core method,
with one extra argument.

### Retrieve PDB files

```python
from tsr_package import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1LBE"]
PDB_DL(pdb_ids, 'Dataset')
```

This downloads the PDB files into the specified `Dataset/` directory, which is
also the default if no directory is given.

### Generate keys with size filtering

```python
from tsr_package import TSR

# Define the directory where PDB files are stored
data_dir = "Dataset"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # choose 'keys', 'triplets', or 'both'

# Process protein data to generate key files
TSR(data_dir, input_files, chain=chain, output_option=output_option,
    size_filter=500)
```

Protein chains are case-sensitive and must match the chain IDs in the PDB file.

> With the `size_filter` argument, TSR discards keys whose MaxDist is greater
> than the given value.

### Parameter

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `size_filter` | `int` | `10000` | Upper bound on a triangle's MaxDist. Triangles above it are discarded. The default is high enough that no filtering occurs. |

### Using a CSV file as input

```python
from tsr_package import TSR

# Define the directory and CSV file path
data_dir = "Dataset"
csv_file = "sample_details.csv"

# Process the CSV input
TSR(data_dir, csv_file, output_option="keys", size_filter=500)
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
from tsr_package import PDB_DL, TSR

# Step 1: retrieve PDB files
data_dir = "Dataset"
input_files = ["1GTA", "1gtb", "1lbe"]
chain = ["A", "A", "A"]
PDB_DL(input_files, data_dir)

# Step 2: generate key files
TSR(data_dir, input_files, chain=chain, output_option="keys", size_filter=500)
```

### Using a CSV file for input

```python
from tsr_package import PDB_DL, TSR

# Use CSV input
data_dir = "Dataset"
csv_file = "sample_details.csv"
PDB_DL(csv_file)
TSR(data_dir, csv_file, output_option="triplets", size_filter=500)
```
