---
slug: common-keys
title: Common Keys
shortTitle: Common Keys
summary: >-
  Finds the TSR keys that every structure in a set shares, overall and within
  groups, and the percentage of structures each key occurs in. BioTSR computes
  common keys from the command line and the percentages from Python.
status: published
category: analysis
group: key-analysis
order: 1

figure:
  src: /images/analysis/common-keys.webp
  alt: >-
    Worked example over two protein classes X and Y. Panels show each
    protein's distinct key set, the key frequencies per protein, the Specific
    keys of each class alongside the Common keys of the dataset, the common
    keys of each class and of the dataset, the specific keys of each class,
    and how Distinct_Common, Total_Common, Distinct and Total counts are
    derived.
  caption: >-
    The common-key terms of the group's earlier analysis, worked through for
    two classes of proteins.
  credit:
    use: reproduced
    source: Milon et al., Kinases and Phosphatases 2024, 2(4), 315–339, Figure 13
    url: https://doi.org/10.3390/kinasesphosphatases2040021
    copyright: © 2024 the authors
    licence: CC BY 4.0
    licenceUrl: https://creativecommons.org/licenses/by/4.0/
    changes: Resized for the web; otherwise unchanged.

repositories:
  - name: BioTSR
    url: https://github.com/TSRMethod/BioTSR
    description: >-
      Used by the examples on this page.
    language: Python
  - name: Nucleotide_Analysis
    url: https://github.com/KrishnaRauniyar/Nucleotide_Analysis
    description: >-
      The earlier common-key scripts, in its common_keys_analysis/ directory.
      They read a directory of triplet files and write common_keys.csv,
      common_keys_chain.csv, common_keys_percent_chain.csv and
      common_keys_percent_one_vs_all.csv. They are kept unchanged for
      provenance and for work that depends on their output files; the README
      has their instructions.
    language: Python
---

## Overview

Common-key analysis takes the TSR keys of a set of structures and reports
which keys they share.

The figure is the worked example in which
[Milon et al. (2024)](https://doi.org/10.3390/kinasesphosphatases2040021),
§4.6, define the terms of the group's earlier common-key analysis. A dataset
has two classes of proteins, X and Y: three proteins in class X and two in
class Y. Each protein has a set of distinct TSR keys (panel a) and a count for
each key (panel b). The capital letter matters:

| Term | Keys it names | In the figure |
| --- | --- | --- |
| **Common** keys of the dataset | present in at least one protein of each class | c: {A, B, C, G, H, I} |
| **Specific** keys of a class | present in at least one protein of that class and in no protein of the other | c: {D, E} for X, {F, J} for Y |
| **common** keys of a class | present in every protein of that class | d: {A, E} for X; e: {A, F} for Y |
| **common** keys of the dataset | present in every protein of the dataset | f: {A} |
| **specific** keys of a class | present in every protein of that class and in no protein of the other | h: {E} for X, {F} for Y |

A class's specific keys are therefore among its Specific keys. Panel g
averages four counts over the proteins of each class and of the whole
dataset: `Distinct` (distinct keys), `Total` (all key occurrences),
`Distinct_Common` (common keys) and `Total_Common` (occurrences of the common
keys).

BioTSR 1.0.0 defines four common-key quantities of its own, listed below. Its
global common keys are the dataset's common keys in the sense of panel f, and
its group-wise common keys a class's, as in panels d and e. It does not
compute Common, Specific or specific keys.

## Run it with BioTSR

| Quantity | What it is | In BioTSR 1.0.0 | Written to |
| --- | --- | --- | --- |
| Global common keys | the keys present in every sample | command line: `biotsr analyze common-keys` | `all_samples.csv` and `all_samples.json` |
| Group-wise common keys | the same, within each group of samples sharing a label | command line: `--group-by label` | one `LABEL.csv` and `LABEL.json` per label |
| Key occurrence percentage | for each key, the percentage of samples it occurs in | Python: `biotsr.analysis.key_occurrence_percent` | a table in Python; no file |
| One-versus-all occurrence | that percentage within each group, one column per group | Python: `biotsr.analysis.key_occurrence_percent_one_vs_all` | a table in Python; no file |

The
[analysis method record, §3](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/methods/ANALYSIS.md#3-common-key-analysis)
defines the four.

### Before you start

- BioTSR 1.0.0, installed as in [Getting started](/software/get-started). The
  plotting extra is not needed.
- Network access the first time, to download two entries from the RCSB.
- The analysis reads saved BioTSR results — each sample's `.keys` file and its
  completion record — not triplet files, so the samples can be computed with
  `--no-triplets`.

### 1. Compute the samples

Save this manifest as `samples.csv`. Each row is one chain; `label` names its
group:

```csv
sample_id,pdb_id,method,chain,label
ubiquitin,1UBQ,protein,A,ubiquitin
barnase,1BRS,protein,A,barnase
barstar,1BRS,protein,D,barstar
```

```bash
python -m pip install "biotsr==1.0.0"
biotsr fetch 1UBQ 1BRS --pdb-dir structures
biotsr batch --manifest samples.csv --pdb-dir structures --output batch --no-triplets
```

This writes `batch/ubiquitin.keys`, `batch/barnase.keys` and
`batch/barstar.keys`, each with its completion record (`.run.json`), and
`batch/batch_summary.csv`.

### 2. Common keys, from the command line

```bash
biotsr analyze common-keys --from-results batch --output analysis_out
```

The three chains share 9,523 keys. The command always writes into
`analysis/common_keys/` under `--output`:

- `analysis_out/analysis/common_keys/all_samples.csv` has one row per sample:
  `sample_id`, `method`, `total_keys` (its distinct keys), `common_keys`,
  `sum_common_keys_freq` (how often the common keys occur in that sample) and
  three fingerprints. `total_keys`, `common_keys` and `sum_common_keys_freq`
  are the columns of the earlier scripts' `common_keys.csv`.
- `all_samples.json` holds the common keys themselves and each sample's
  settings.

With `--group-by label` the intersection is taken within each label instead,
written as one CSV and one JSON file per label. In this manifest every sample
has a label of its own, so each group is a single chain; give samples the same
label to group them.

### 3. Occurrence percentages, from Python

```python
import biotsr
from biotsr.analysis import (AnalysisSample, key_occurrence_percent,
                             key_occurrence_percent_one_vs_all)

names = ("ubiquitin", "barnase", "barstar")
samples = [AnalysisSample.from_result(biotsr.load_result(f"batch/{name}.keys"), name)
           for name in names]

# For every key, the percentage of the three samples it occurs in.
occurrence = key_occurrence_percent(samples)
print(occurrence.rows[0])

# The same percentage within each group, one column per group.
group = {"ubiquitin": "ubiquitin", "barnase": "complex", "barstar": "complex"}
by_group = key_occurrence_percent_one_vs_all(samples, lambda s: group[s.sample_id])
print(by_group.groups)
```

`occurrence.rows` has one row per key, with the number of samples it occurs in
and the percentage. BioTSR 1.0 returns both tables in Python and does not write
them as files.

Samples are compared only when their keys share a key space, and samples
computed with different settings, such as a size filter, only when you say so.
[Tutorial 07](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/07_analysis.md#common-keys-from-the-command-line)
runs the same samples, and the
[command-line guide, §8](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#8-analysis-the-keys-a-set-of-samples-shares)
gives every option.
