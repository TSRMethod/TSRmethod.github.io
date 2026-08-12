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
    and CABS TSR keys at the binding site. The second labels CATOM TSR keys,
    formed by triangles spanning ligand and protein atoms, and ATOMBS TSR keys.
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
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Python package for downloading PDB files and generating TSR keys and
      triplets. DrugTSR is provided by the `DrugTSR()` entry point.
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

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Usage

DrugTSR has its own entry point, `DrugTSR()`, which needs to know which drug
to look for in addition to the structure and chain.

### Retrieve PDB files

```python
from tsr_package import PDB_DL

# Retrieve PDB files for the specified PDB IDs
pdb_files = ['4CI2', '4ci1']
PDB_DL(pdb_files, 'Dataset')
```

This downloads the PDB files into the specified `Dataset/` directory, which is
also the default if no directory is given.

### Generate drug keys and triplets

```python
from tsr_package import DrugTSR

# Define the directory where PDB files are stored
data_dir = "Dataset"
pdb_files = ['4CI2', '4ci1']
chain = ['B', 'B']              # specify chains for each PDB file
drug_name = ['LVY', 'EF2']      # ligand code in the PDB entry
drug_id = ['1429', '21429']

# Process protein data to generate key files
DrugTSR(data_dir, input_files=pdb_files, chain=chain, drug_name=drug_name,
        drug_id=drug_id, output_option='both')
```

Protein chains are case-sensitive and must match the chain IDs in the PDB file.

### Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `data_dir` | `str` | — | Directory containing the downloaded PDB files. |
| `input_files` | `list[str]` or `str` | — | List of PDB IDs, or the path to a CSV file. |
| `chain` | `list[str]` | `None` | Chain ID for each input file. Case-sensitive. |
| `drug_name` | `list[str]` | `None` | Ligand code for each input file, as it appears in the PDB entry. |
| `drug_id` | `list[str]` | `None` | Identifier for each drug. |
| `output_option` | `str` | `'both'` | One of `'keys'`, `'triplets'` or `'both'`. |
| `output_subdir` | `str` | `'lexicographic'` | Subdirectory of `data_dir` for the generated files. |

### Using a CSV file as input

```python
from tsr_package import DrugTSR

# Define the directory and CSV file path
data_dir = "Dataset"
csv_file = "sample_details.csv"

# Process the CSV input
DrugTSR(data_dir, input_files=csv_file, output_option='both')
```

Unlike the core TSR method, the CSV needs four columns, because the drug has
to be identified as well as the chain:

| protein | chain | drug_name | drug_id |
| --- | --- | --- | --- |
| 5L2I | B | LVY | 1429 |
| 5XYZ | A | LQQ | 21429 |
