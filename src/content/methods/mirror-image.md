---
slug: mirror-image
title: Mirror-Image TSR
shortTitle: Mirror-Image TSR
summary: >-
  Extends TSR with keys that distinguish a triangle from its mirror image, so
  that stereochemistry is captured rather than lost.
status: published
category: method
group: one-molecule
order: 2

figure:
  src: /images/methods/mirror-image.webp
  alt: >-
    Two triangles either side of a mirror line, each with vertices labelled
    aa1, aa2 and aa3 and the same angle theta and MaxDist edge. The triangle on
    the left is marked "a positive key" and its reflection on the right is
    marked "a negative key".
  caption: >-
    A triangle and its reflection receive keys of equal magnitude and opposite
    sign, which is what allows the two to be told apart.

paper:
  title: >-
    Introducing mirror-image discrimination capability to the TSR-based method
    for capturing stereo geometry and understanding hierarchical structure
    relationships of protein receptor family
  authors: >-
    Titli Sarkar, Yuwu Chen, Yu Wang, Yixin Chen, Feng Chen, Camille R. Reaux,
    Laura E. Moore, Vijay Raghavan, Wu Xu
  journal: Computational Biology and Chemistry
  year: 2023
  doi: 10.1016/j.compbiolchem.2023.107824

repositories:
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Python package for downloading PDB files and generating TSR keys and
      triplets. Mirror-image keys are enabled with an argument to `TSR()`.
    language: Python
---

## Overview

Building on the Triangular Spatial Relationship (TSR) method, Mirror-Image TSR
addresses a key limitation: the inability to distinguish between triangles that
are mirror images of each other. This distinction is critical, as many
biological processes are stereospecific, with molecules such as enzymes and
receptors showing preferences for particular geometric arrangements of atoms.

Mirror-Image TSR extends the original approach by incorporating keys that
account for the chirality of protein structures. Chirality refers to the
geometric property where molecules, despite having the same atomic
connectivity, exist as non-superimposable mirror images. This is particularly
important in drug development, where enantioselectivity plays a crucial role in
determining the function of pharmaceuticals.

By modifying the key generation formula to include mirror-image recognition,
Mirror-Image TSR captures the stereochemical properties of protein structures,
enabling discrimination between enantiomers. This provides greater precision in
identifying dynamic structural changes and molecular recognition processes,
making it a useful tool for analysing stereochemistry in proteins and their
interactions with ligands and drugs.

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

Mirror-image keys are produced by the same `TSR()` entry point as the core
method, with one extra argument.

### Retrieve PDB files

```python
from tsr_package import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1LBE"]
PDB_DL(pdb_ids, 'Dataset')
```

This downloads the PDB files into the specified `Dataset/` directory, which is
also the default if no directory is given.

### Generate keys with mirror-image discrimination

```python
from tsr_package import TSR

# Define the directory where PDB files are stored
data_dir = "Dataset"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # choose 'keys', 'triplets', or 'both'

# Process protein data to generate key files
TSR(data_dir, input_files, chain=chain, output_option=output_option,
    mirror_image=True)
```

Protein chains are case-sensitive and must match the chain IDs in the PDB file.

> With `mirror_image=True`, the TSR method considers keys together with their
> mirror images, assigning a negative value to the mirror key.

### Parameter

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `mirror_image` | `bool` | `False` | When true, mirror-image triangles receive the negated key. |

### Using a CSV file as input

```python
from tsr_package import TSR

# Define the directory and CSV file path
data_dir = "Dataset"
csv_file = "sample_details.csv"

# Process the CSV input
TSR(data_dir, csv_file, output_option="keys", mirror_image=True)
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
TSR(data_dir, input_files, chain=chain, output_option="keys",
    mirror_image=True)
```

### Using a CSV file for input

```python
from tsr_package import PDB_DL, TSR

# Use CSV input
data_dir = "Dataset"
csv_file = "sample_details.csv"
PDB_DL(csv_file)
TSR(data_dir, csv_file, output_option="triplets", mirror_image=True)
```
