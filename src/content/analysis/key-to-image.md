---
slug: key-to-image
title: Key to 2D Image
shortTitle: Key to 2D Image
summary: >-
  Turns a structure's TSR triplets into a fixed-size 2D image, so that key
  content can be fed to image-based models or compared visually.
# DRAFT — the workflow is verified against the source, but a required input
# file cannot be located. See item 10 in CONTENT-REVIEW.md.
status: draft
category: analysis
group: key-analysis
order: 2

review:
  note: >-
    This page is not yet published because the required grid file,
    35by44grid.csv, is not present in the TSR-Package repository and we have
    not been able to establish where users should obtain it. Everything else
    here was verified against Key_To_Image.py.

figure:
  src: /images/analysis/key-to-image.webp
  alt: >-
    A dense rectangular heat map generated from one structure's TSR triplets.
    Bright points scattered on a dark field mark triplet types that occur, laid
    out in a grid of blocks where position encodes the amino acid triplet and
    the distance and angle bins within it.
  caption: >-
    An example image produced from a structure's triplet file. The website does
    not generate these; they come from running the tool.

repositories:
  - name: TSR-Package
    url: https://github.com/pooryakhajouie/TSR-Package
    description: >-
      Provides `Key_To_Image.py`. Note this module is not re-exported from the
      package root, so it is imported by its full module path.
    language: Python
---

## Overview

Key to 2D Image converts the triplets of a structure into a single fixed-size
image. Each triplet is placed at a position determined by its amino acid
composition, and within that block by its distance and angle bins, so a
structure's whole key content becomes one picture that image-based models can
consume.

The layout is a 35 × 44 grid of blocks. Each block is 35 distance bins by 29
angle bins, giving an image of 1225 × 1276 cells. A triplet increments the cell
matching its distance and angle; the saved picture is log-scaled so that rare
and common triplets are both visible.

> **Input is triplet files, not key files.** The tool reads tab-separated
> triplet output — the sample uses the extension `.triplets_29_35` — and takes
> the triplet residue names, angle and distance from it. Generate triplets, not
> keys, before running it.

## Installation

```bash
git clone https://github.com/pooryakhajouie/TSR-Package.git
cd TSR-Package

python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows

pip install .
pip install -r requirements.txt
```

## Usage

```python
from tsr_package.Key_To_Image import KeyToImage

input_folder = "Dataset/lexicographic/"   # where the triplet files are
extension = ".triplets_29_35"             # triplet file extension
csv_location = "35by44grid.csv"           # the grid mapping file
output_folder = "images/"

KeyToImage(input_folder, extension, csv_location, output_folder)
```

`Key_To_Image` is **not** re-exported from `tsr_package/__init__.py`, so it is
imported by its full module path, unlike `TSR` and `PDB_DL`.

### Parameters

| Parameter | Description |
| --- | --- |
| `input_folder` | Directory containing the triplet files. |
| `extension` | Extension identifying those files, e.g. `.triplets_29_35`. |
| `csv_location` | Path to the grid mapping file, `35by44grid.csv`. |
| `output_folder` | Directory for the generated files. Created if absent. |

### The grid file

`35by44grid.csv` maps each amino acid triplet to a block in the image. It needs
columns `TripletName1`, `TripletName2`, `TripletName3`, `RowIndex` and
`ColIndex`. Triplets absent from the grid are skipped, and the histidine
variants `HIE` and `HID` are folded into `HIS` before lookup.

The file must be supplied by you — see the note at the top of this page.

## Full example

```python
from tsr_package import PDB_DL, TSR
from tsr_package.Key_To_Image import KeyToImage

# Step 1: retrieve PDB files
data_dir = "Dataset"
pdb_ids = ["1GTA", "1gtb", "1lbe"]
chain = ["A", "A", "A"]
PDB_DL(pdb_ids, data_dir)

# Step 2: generate TRIPLET files — the image step cannot use keys
TSR(data_dir, pdb_ids, chain=chain, output_option="triplets")

# Step 3: create the images
KeyToImage("Dataset/lexicographic/", ".triplets_29_35", "35by44grid.csv",
           "images/")
```

## Output

Two files per structure, written to `output_folder`:

| File | Contents |
| --- | --- |
| `<name>.image` | The raw matrix as space-separated text, two decimal places |
| `<name>.png` | The same matrix log-scaled and rendered as a picture |

Structures whose triplet file is empty are skipped, and a structure that
already has an `.image` file is not reprocessed.
