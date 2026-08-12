---
slug: common-keys
title: Common Keys
shortTitle: Common Keys
summary: >-
  Finds the TSR keys shared across a set of structures, and reports how often
  each key occurs, per file, per chain, and as a percentage.
status: published
category: analysis
group: key-analysis
order: 1

figure:
  src: /images/analysis/common-keys.webp
  alt: >-
    Worked example over two protein classes X and Y. Panels show each
    protein's distinct key set, the key frequencies per protein, the specific
    keys of each class alongside the dataset's common keys, and how
    Distinct_Common, Total_Common, Distinct and Total counts are derived.
  caption: >-
    How common and specific keys are counted, worked through for two classes.

repositories:
  - name: Nucleotide_Analysis
    url: https://github.com/KrishnaRauniyar/Nucleotide_Analysis
    description: >-
      The common key scripts live in the `common_keys_analysis/` directory of
      this repository.
    language: Python
---

## Overview

Common keys analysis takes a directory of TSR **triplet** files and reports
which keys the structures share.

Consider a dataset with two protein classes, X and Y — three proteins in class
X and two in class Y. Each protein has a set of distinct TSR keys, and each key
has an occurrence count. From those, the analysis derives:

- **Specific keys** — keys belonging to one class only.
- **Common keys** — keys shared across the dataset. The dataset's common keys
  are the intersection of class X's common keys and class Y's common keys.
- **Distinct** and **Total** counts, and their `Distinct_Common` and
  `Total_Common` equivalents.

The specific keys of a class are a subset of that class's keys.

> **Input is triplet files, not key files.** The scripts read the triplet
> output of a TSR package, so generate triplets — for example with
> `output_option="triplets"` — before running them.

## Installation

```bash
git clone https://github.com/KrishnaRauniyar/Nucleotide_Analysis.git
cd Nucleotide_Analysis/common_keys_analysis
```

Create a virtual environment and install the dependencies:

```bash
python3 -m venv tsrenv
source tsrenv/bin/activate   # macOS / Linux
tsrenv\Scripts\activate      # Windows

pip install -r requirements.txt
```

These are standalone scripts rather than an installable package, so there is
no `pip install .` step.

## Usage

Four scripts, each taking the same `--path` argument: a directory of triplet
files.

### All common keys

```bash
python common_keys.py --path input_dir
```

### Per chain

```bash
python common_keys_chain.py --path input_dir
```

### Per chain, as a percentage

```bash
python common_keys_percent.py --path input_dir
```

### One chain against all others

```bash
python common_keys_percent_one_vs_all.py --path input_dir
```

`input_dir` holds the triplet files. Common keys are calculated across every
triplet file in that directory, so it can be pointed straight at the key
triplet output directory of a TSR package.

## Output

### `common_keys.csv` and `common_keys_chain.csv`

| fileName | total_keys | common_keys | sum_common_keys_freq |
| --- | --- | --- | --- |
| 1_1TSR_E_DT | 4 | 0 | 0 |
| 1_2AC0_E_DC | 1 | 0 | 0 |

One row per triplet file. `total_keys` is the number of keys in that file,
`common_keys` the number of those that are common to all the triplet files,
and `sum_common_keys_freq` the summed frequency of the common keys. The
`_chain` variant reports the same per individual chain.

### `common_keys_percent_chain.csv`

| key | key_occurance | total_files | key_percent |
| --- | --- | --- | --- |
| 45680161 | 1291 | 1492 | 86.52 |
| 46126751 | 820 | 1942 | 54.95 |

One row per key: the key itself, how many individual chains it occurs in, the
number of files in the directory, and the resulting percentage.

### `common_keys_percent_one_vs_all.csv`

| key | chain1% | chain2% | chain3% |
| --- | --- | --- | --- |
| 45680161 | 86.52 | 87.88 | 86.52 |
| 46126751 | 82.55 | 19.42 | 0 |

One row per key, giving the percentage occurrence of that key in each chain.
