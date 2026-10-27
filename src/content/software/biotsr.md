---
title: BioTSR
summary: BioTSR is the unified software implementation of the Triangular
  Spatial Relationship (TSR) methodology. Install BioTSR 1.0.0, see which TSR
  methods it runs, and find its documentation, tutorials and citation.
---
## Install

BioTSR 1.0.0 is on PyPI. In an existing Python environment:

```bash
python -m pip install "biotsr==1.0.0"
```

Parallel batch processing is part of this standard installation: joblib, the
one runtime dependency, is installed with it, so `--jobs` works without
anything extra.

The optional plotting extra adds matplotlib, which only the clustered heat-map
figure needs:

```bash
python -m pip install "biotsr[plot]==1.0.0"
```

BioTSR supports CPython 3.9–3.13 on Linux and macOS. Windows is not
supported. The commands are pinned to 1.0.0 so that what you install matches
the documentation linked on this page.

[Getting started](/software/get-started) sets up a virtual environment and
runs a first calculation. The
[user guide, §1](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#1-installation)
covers installation from the GitHub tag and offline installation.

## What BioTSR computes

BioTSR runs 20 TSR methods in four groups, all through one shared core for
geometry, vertex ordering, binning and key encoding. Each method runs under
one standard profile: the TSR science as set by the TSR Research Group.

| Method family | Points that form the triangles | Methods |
| --- | --- | --- |
| Protein Cα | one Cα atom per residue | 2 |
| Atomic — protein | the heavy atoms of amino-acid residues | 5 |
| Atomic — ligand, carbohydrate, nucleotide | the heavy atoms of a molecule, a glycan or a strand | 8 |
| Cross TSR | atoms or Cα atoms on two named sides; every triangle spans both | 5 |

The modifiers described on the method pages are options of these methods, not
separate programs:

- **amino-acid grouping** — the Cα methods;
- **SSE annotation** (SSE-TSR) — the Cα methods; it annotates triangles and
  changes no key;
- **mirror images** — the Cα and atomic methods, not the cross methods;
- **size filtering** — every method.

Not every TSR research method is part of BioTSR 1.0. The deep neural network
and the feature-selection options used in the hsp70/actin comparison, for
example, remain separate research code; see
[Earlier implementations](/research/earlier-implementations). Each
[method page](/research) says whether BioTSR runs that method, and how. The
[capability matrix](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CAPABILITY_MATRIX.md)
lists exactly what each method supports, and the
[reproducibility note](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/REPRODUCIBILITY_NOTE.md)
gives the command for each published method that BioTSR implements.

## Command line and Python

Both interfaces drive the same core. Similarity, clustering and plotting are
available from Python only in 1.0.

| Task | Command line | Python |
| --- | --- | --- |
| Compute TSR keys, any of the 20 methods | `biotsr run` | `biotsr.analyze`; `biotsr.analyze_cross` for cross methods |
| A dataset from a CSV manifest, in parallel | `biotsr batch --jobs` | `biotsr.batch.run` |
| Download PDB-format structures | `biotsr fetch` | `biotsr.fetch_structures` |
| Inspect a saved result | `biotsr describe` | `biotsr.load_result` |
| Keys shared by a set of samples | `biotsr analyze common-keys` | `biotsr.analysis` |
| Similarity measures and clustering | — | `biotsr.analysis` |
| The clustered heat map | — | `biotsr.analysis.render`, with the plotting extra |

## Documentation

All links point to the documentation released with version 1.0.0.

- [Tutorials](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/README.md)
  — eight short walk-throughs, from one protein to clustering; the test suite
  runs every command in them.
- [User guide](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md)
  — installation, every method with an example, and the dataset workflow.
- [Command-line guide](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md)
  — every command and option, batches, exit codes, and scripts for HPC
  clusters.
- [Python API guide](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/API_GUIDE.md)
  — running methods, loading results and analysis from Python.
- [Capability matrix](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CAPABILITY_MATRIX.md)
  — which method supports which modifier and arguments.
- [Reproducibility note](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/REPRODUCIBILITY_NOTE.md)
  — which command computes which published method.
- [Known limitations](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/KNOWN_LIMITATIONS.md)
  — what 1.0 does not do, and the input rules it enforces.
- [Release notes for 1.0.0](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/CHANGELOG.md)

BioTSR runs every method under one standard definition and has no option to
reproduce the output files of the earlier TSR programs. Where its definition
differs from an earlier program's, such as dividing angles by π rather than
3.14 or applying a contact cutoff to both sides of a cross, the method's page
says how, and the
[known limitations, §1](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/KNOWN_LIMITATIONS.md#1-the-standard-only)
give the general rule.
