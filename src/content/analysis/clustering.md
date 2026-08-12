---
slug: clustering
title: Hierarchical Clustering
shortTitle: Hierarchical Clustering
summary: >-
  Clusters structures by TSR key similarity, going from key frequencies through
  a Jaccard similarity matrix to an average-linkage clustermap.
status: published
category: analysis
group: key-visualization
order: 1

repositories:
  - name: Kinases-and-Phosphatases-Clustering
    url: https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering
    description: >-
      Steps 1 and 3 — key frequency generation and the hierarchical clustermap.
    language: Python
  - name: hsp70_actin
    url: https://github.com/dbxmcf/hsp70_actin
    description: >-
      Step 2 — Jaccard similarity calculation over the key frequency vectors.
    language: Python
---

## Overview

Clustering groups structures by how much of their TSR key content they share.
The workflow runs in three steps and spans **two separate repositories** — it
is not a single package:

| Step | Produces | Where it comes from |
| --- | --- | --- |
| 1. Key frequencies | A frequency vector per structure | `Kinases-and-Phosphatases-Clustering` |
| 2. Jaccard similarity | A pairwise similarity matrix | `hsp70_actin` |
| 3. Hierarchical clustering | A clustermap and cluster memberships | `Kinases-and-Phosphatases-Clustering` |

The steps must run in that order: each one consumes the previous one's output.

## Installation

```bash
git clone https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering.git
cd Kinases-and-Phosphatases-Clustering
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows

pip install -r requirements.txt
```

Step 2 uses a different repository — see below.

## Step 1 — generate key frequencies

```bash
python key_frequency_drug.py -p triplets_directory -H no
```

| Option | Description |
| --- | --- |
| `-p` | Directory containing the triplet files. |
| `-H` | Whether to write a header row. Use `no` here. |

> `-H no` matters. The Jaccard step in step 2 expects a headerless file, so
> asking for headers here will break the next step. The same script is used
> with `-H yes` for [Deep Neural Network](/analysis/dnn), which does want them.

The result is one line per structure: the structure name, then its key
frequencies, semicolon-separated from the name and comma-separated among
themselves.

```text
4NGF_H_15_U;3,2,4,0,6,0,10,7...
5VM9_D_3_A;5,6,7,5,6,0,1,10,...
```

## Step 2 — Jaccard similarity

Jaccard similarity is calculated with the code in the
[hsp70_actin](https://github.com/dbxmcf/hsp70_actin) repository, which is
separate from the clustering scripts.

It must produce a square matrix in this form — one row per structure, the name
first and then that structure's distance to every structure in the set:

```text
2R92_P_10_A; 0.000, 0.704, 0.740, 0.555, ...
2R92_P_11_C; 0.704, 0.000, 0.668, 0.719, ...
2R92_P_12_C; 0.740, 0.668, 0.000, 0.757, ...
2R92_P_13_A; 0.555, 0.719, 0.757, 0.000, ...
```

## Step 3 — hierarchical clustering

```bash
python clustermap_n.py -p jaccard.csv -n 5
```

| Option | Description |
| --- | --- |
| `-p` | The similarity matrix from step 2. |
| `-n` | Number of clusters to form. |

Clustering uses **average linkage** on the squareform of the distance matrix,
and cluster membership is cut with the `maxclust` criterion at the requested
number of clusters. The same linkage is applied to both rows and columns of
the resulting clustermap.

## Output

| File | Contents |
| --- | --- |
| `clustermap.png` | The clustermap, with row colours marking the clusters |
| `clustermap.csv` | Cluster assignments, each row listing the structures in a cluster |
