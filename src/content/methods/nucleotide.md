---
slug: nucleotide
title: Nucleotide TSR
shortTitle: Nucleotide TSR
summary: >-
  Applies the TSR representation to nucleotide residues, filtering the eight
  RNA and DNA residue types by their expected length before generating keys.
status: published
category: method
group: nucleotide
order: 1

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
  - name: TSR_NUCLEOTIDE_PACKAGE
    url: https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE
    description: >-
      Standalone Python package for nucleotide TSR key and triplet generation.
      Separate from the core TSR-Package.
    language: Python

slurm:
  intro: >-
    Key generation over a large structure set is best run as a batch job. Put
    the Python from the Usage section into a script, then submit the job below.
  script:
    filename: nucleotide_keys.sbatch
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

      git clone https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE.git
      cd TSR_NUCLEOTIDE_PACKAGE

      python3 -m venv myenv
      source myenv/bin/activate
      pip install --upgrade pip
      pip install -e .
      pip install -r requirements.txt

      cd nucleotide_tsr_package
      python3 your_script.py
  submit:
    code: sbatch nucleotide_keys.sbatch
  resources: >-
    Requests one node with 64 tasks for up to 72 hours on the `workq`
    partition, under the group's `loni_tsr_4` allocation. Substitute your own
    allocation, and scale the wall time to your dataset.
  notes: >-
    Replace `your_script.py` with your own script containing the `PDB_DL` and
    `NucleotideTSR` calls from the Usage section.
---

## Overview

Nucleotides are the building blocks of DNA and RNA, each consisting of a sugar,
a phosphate group and a nitrogenous base. Nucleotide TSR applies the
Triangular Spatial Relationship representation to nucleotide residues, so that
the same alignment-free key comparison used for proteins can be applied to
nucleic acid structures.

The workflow filters residues so that only those matching the expected length
for their type are processed. Each of the eight supported residue types has its
own expected length, which is used as the filtering criterion:

| Code | Residue | Found in | Expected length |
| --- | --- | --- | --- |
| G | Guanine | RNA and DNA | 23 |
| A | Adenine | RNA and DNA | 22 |
| C | Cytosine | RNA and DNA | 20 |
| U | Uracil | RNA only | 20 |
| DG | Deoxyguanosine | DNA | 22 |
| DA | Deoxyadenosine | DNA | 21 |
| DC | Deoxycytosine | DNA | 19 |
| DT | Deoxythymidine | DNA | 20 |

Guanine and adenine are purine bases; cytosine, uracil and thymine are
pyrimidines. The deoxy- forms distinguish DNA from RNA during filtering.

Keys and triplets are generated for all eight residue types, and mirror-image
keys can be produced as well through an argument to the generation function.

## Installation

Clone the repository:

```bash
git clone https://github.com/KrishnaRauniyar/TSR_NUCLEOTIDE_PACKAGE.git
cd TSR_NUCLEOTIDE_PACKAGE
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
cd nucleotide_tsr_package
```

## Usage

### Retrieve PDB files

```python
from nucleotide_tsr_package.PDB_DL import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_ids = ["1GTA", "1GTB", "1lbe"]
PDB_DL(pdb_ids, 'Dataset/')
```

Protein IDs are not case-sensitive. A CSV file can be used instead of a list:

```python
from nucleotide_tsr_package.PDB_DL import PDB_DL

data_dir = "Dataset/"
csv_file = "sample_details.csv"
PDB_DL(csv_file, data_dir)
```

### Generate keys and triplets

```python
from nucleotide_tsr_package.Nucleotide import NucleotideTSR

# Define the directory where PDB files are stored
data_dir = "Dataset/"
input_files = ["1GTA", "1GTB", "1LBE"]
chain = ["A", "A", "A"]        # specify chains for each PDB file
output_option = "keys"          # 'keys', 'triplets', or 'both'

NucleotideTSR(data_dir, input_files, chain=chain,
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
| `output_subdir` | `str` | `'nucleotide_results'` | Subdirectory of `data_dir` for the generated files. |
| `mirror_image` | `bool` | `False` | Set true to distinguish mirror-image triangles. |

### Using a CSV file as input

```python
from nucleotide_tsr_package.Nucleotide import NucleotideTSR

data_dir = "Dataset/"
csv_file = "sample_details.csv"

NucleotideTSR(data_dir, csv_file, output_option="keys", mirror_image=True)
```

The CSV file should have two columns:

| protein | chain |
| --- | --- |
| 1GTA | A |
| 1GTB | A |
| 1LBE | A |

## Output

Keys and triplet frequency files are written to `nucleotide_results/`, a
directory created inside `data_dir`.
