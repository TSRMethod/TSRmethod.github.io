---
slug: clustering
title: Hierarchical Clustering
shortTitle: Hierarchical Clustering
summary: >-
  Clusters structures by TSR key similarity, going from key frequencies through
  a Jaccard similarity matrix to an average-linkage tree and clustered heat map.
status: published
category: analysis
group: key-visualization
order: 1

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: Kinases-and-Phosphatases-Clustering
    url: https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering
    description: >-
      Research code for steps 1 and 3 of the published workflow. It is kept
      unchanged for provenance and for work that depends on it; its README has
      its own installation instructions.
    language: Python
  - name: hsp70_actin
    url: https://github.com/dbxmcf/hsp70_actin
    description: >-
      Research code for step 2 of the published workflow, with the
      feature-selection options of the hsp70/actin comparison. It is kept
      unchanged for provenance and for work that depends on it; its README has
      its own installation instructions.
    language: Python
---


## Overview

Clustering groups structures by how much of their TSR key content they share,
in three steps:

1. **Key frequencies:** each structure becomes a vector of how often each key
   occurs in it.
2. **Similarity:** every pair of structures is compared, with a Jaccard
   similarity over those vectors, giving a square matrix.
3. **Hierarchical clustering:** average linkage on the corresponding distances
   (one minus the similarity) builds a tree, drawn over the matrix as a
   clustered heat map.

The tree describes how the structures group at every distance. Reading off a
fixed number of clusters is a separate step, a cut of the tree by a rule that
has to be chosen.

## Run it with BioTSR

BioTSR 1.0.0 runs all three steps from Python, in `biotsr.analysis`; they are
not on the command line. Drawing the heat map needs the plotting extra:

```bash
python -m pip install "biotsr[plot]==1.0.0"
```

The example uses the three chains of the
[Common Keys example](/analysis/common-keys#1-compute-the-samples). If you have
not run it, compute them first, from the same `samples.csv`:

```csv
sample_id,pdb_id,method,chain,label
ubiquitin,1UBQ,protein,A,ubiquitin
barnase,1BRS,protein,A,barnase
barstar,1BRS,protein,D,barstar
```

```bash
biotsr fetch 1UBQ 1BRS --pdb-dir structures
biotsr batch --manifest samples.csv --pdb-dir structures --output batch --no-triplets
```

That writes `batch/ubiquitin.keys`, `batch/barnase.keys` and
`batch/barstar.keys`. Then, in Python from the same folder:

```python
import biotsr
from biotsr.analysis import (AnalysisSample, feature_matrix, similarity_matrix,
                             hierarchy, clustermap_spec)
from biotsr.analysis.render import render_clustermap

samples = [AnalysisSample.from_result(biotsr.load_result(path), sample_id=name)
           for name, path in [("ubiquitin", "batch/ubiquitin.keys"),
                              ("barnase", "batch/barnase.keys"),
                              ("barstar", "batch/barstar.keys")]]

fm = feature_matrix(samples)                    # step 1: one column per key
distance = similarity_matrix(fm, "generalized_jaccard").to_distance()  # step 2
tree = hierarchy(distance)                      # step 3: average linkage
render_clustermap(clustermap_spec(distance), "clustermap.png")
```

This writes the clustered heat map to `clustermap.png`.

![](diagram:clustering-example)

- **Similarity measures:** generalized Jaccard, which weighs each key by how
  often it occurs, is the default; binary Jaccard, which looks only at which
  keys are present, and three other measures are available. Every matrix
  exports as CSV with its sample ids.
- **Linkage:** average linkage (UPGMA).
- **No number of clusters by default.** The result is the tree and the heat map
  ordered by it. A flat partition is made only when you ask for one, with
  `cut_hierarchy(tree, height=…)` or `n_clusters=…`; BioTSR never chooses the
  rule. A number of clusters chosen to match known classes makes agreement
  with those classes partly a consequence of the choice.
- **What is compared:** samples are compared only when their keys share a key
  space, and samples computed with different settings only when you say so.

[Tutorial 08](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/08_similarity_clustering.md#5-the-tree)
runs the whole workflow on 1BNA, including the
[optional flat clusters](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/08_similarity_clustering.md#8-optional-flat-clusters-from-a-rule-you-state),
and the
[analysis method record, §5](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/ANALYSIS.md#5-clustering)
defines it.

### The published workflow

The papers ran these steps with scripts from two repositories, listed under
Source code below:

| Step | Script | Repository |
| --- | --- | --- |
| 1. Key frequencies | `key_frequency_drug.py` | [Kinases-and-Phosphatases-Clustering](https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering) |
| 2. Jaccard similarity | the Jaccard code | [hsp70_actin](https://github.com/dbxmcf/hsp70_actin) |
| 3. Clustermap | `clustermap_n.py` | [Kinases-and-Phosphatases-Clustering](https://github.com/KrishnaRauniyar/Kinases-and-Phosphatases-Clustering) |

Two of their options are not part of BioTSR 1.0: the feature selection and
adjacent-key summing of the hsp70_actin comparison, and the fixed number of
clusters `clustermap_n.py` cuts the tree into with its `-n` option. The earlier
pipeline also clustered a distance matrix rounded to three decimals.
