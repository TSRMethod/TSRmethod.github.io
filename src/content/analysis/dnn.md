---
slug: dnn
title: Deep Neural Network
shortTitle: Deep Neural Network
summary: >-
  Classifies structures from their TSR key frequencies using a feed-forward
  network, reporting accuracy, loss and a confusion matrix.
status: published
category: analysis
group: key-visualization
order: 2

repositories:
  - name: Nucleotide_Analysis
    url: https://github.com/KrishnaRauniyar/Nucleotide_Analysis
    description: >-
      The model and its input preparation live in the `dnn/` directory of this
      repository.
    language: Python
---

## Overview

This tool treats TSR key frequencies as a feature vector and trains a
feed-forward neural network to classify structures from them.

It runs in two steps: build the feature table from triplet files, then train
on it.

## Installation

```bash
git clone https://github.com/KrishnaRauniyar/Nucleotide_Analysis.git
cd Nucleotide_Analysis/dnn
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows

pip install -r requirements.txt
```

## Step 1 — build the feature table

```bash
python key_frequency_drug.py -p triplets_directory -H yes
```

| Option | Description |
| --- | --- |
| `-p` | Directory containing the triplet files. |
| `-H` | Whether to write a header row. Use `yes` here. |

> `-H yes` matters. The model reads a headed CSV, whereas
> [Hierarchical Clustering](/analysis/clustering) uses the same script with
> `-H no` because its Jaccard step needs a headerless file.

The result is one row per structure, one column per key:

| Protein | key1 | key2 | key3 |
| --- | --- | --- | --- |
| 4NGF_H_15_U | 4 | 0 | 0 |
| 5VM9_D_3_A | 1 | 5 | 9 |

Each cell is how often that triplet key occurs in that structure.

## Step 2 — train the model

```bash
python drug_model.py -p input_csv_file
```

## Architecture

Five hidden layers, each ReLU, narrowing 128 → 64 → 32 → 16 → 8, with L2
regularisation on all but the first. The output is a softmax layer.

| Layer | Units | Activation | Notes |
| --- | --- | --- | --- |
| Hidden 1 | 128 | ReLU | Input dimension is the number of key columns |
| Hidden 2 | 64 | ReLU | L2 regularisation |
| Hidden 3 | 32 | ReLU | L2 regularisation |
| Hidden 4 | 16 | ReLU | L2 regularisation |
| Hidden 5 | 8 | ReLU | L2 regularisation |
| Output | one per class | softmax | Sized from the data, not fixed |

> **The output layer is not a fixed size.** It is created with one unit per
> class found in the `residue_type` column of the input, so it follows the
> dataset. The 8 units in the table above are the last *hidden* layer, which
> is a different thing.

Categorical columns are label-encoded and features are standardised before
training. The model uses the Adam optimiser with sparse categorical
cross-entropy, trains for up to 50 epochs at batch size 32 against a held-out
split, and stops early when validation stops improving.

## Output

Three image files:

| File | Contents |
| --- | --- |
| `accuracy_plot.png` | Training and validation accuracy per epoch |
| `loss_plot.png` | Training and validation loss per epoch |
| `confusion_matrix.png` | Confusion matrix for the held-out data |

> All three are plots saved as PNG images. The repository's README lists two of
> them with a `.csv` extension, but the code writes PNGs in every case.
