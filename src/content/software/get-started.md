---
title: Getting started with BioTSR
summary: Install BioTSR 1.0.0, download a public structure, compute its TSR
  keys, and find the guide for your next step.
---
## Before you start

You need Linux or macOS, Python 3.9–3.13 and a terminal. Windows is not
supported. Every command on this page is pinned to BioTSR 1.0.0, so it matches
the documentation it links to.

If you already work in a Python environment, this is the only install command
you need:

```bash
python -m pip install "biotsr==1.0.0"
```

## 1. Install BioTSR

A virtual environment keeps BioTSR and its dependency separate from the rest of
your system. Create one, activate it and install:

```bash
python3 -m venv biotsr-env
source biotsr-env/bin/activate
python -m pip install "biotsr==1.0.0"
biotsr --version
```

The last command prints `biotsr 1.0.0`. In a new terminal, run
`source biotsr-env/bin/activate` again before using BioTSR. Parallel batch
processing is included in this installation; nothing else is needed for it.

## 2. Download an example structure

BioTSR reads structure files in PDB format. Your own `.pdb` files work as they
are; to follow this page, download ubiquitin (PDB entry 1UBQ) from the RCSB:

```bash
biotsr fetch 1UBQ --pdb-dir structures
```

This writes `structures/1UBQ.pdb` and `structures/fetch_report.csv`, which
records the download and its checksum. BioTSR checks each file before keeping
it, and running the command again reuses the file already there. Nothing is
downloaded unless you ask, and entries that RCSB provides only as mmCIF are not
downloaded.

## 3. Run a protein calculation

Compute protein Cα TSR keys for chain A:

```bash
biotsr run --method protein --pdb structures/1UBQ.pdb --chain A --output results
```

```text
method     protein
profile    standard_protein_calpha_v1
triangles  70300
keys       45349 distinct
output     results/1UBQ_A_protein (4 files, completion record 1UBQ_A_protein.run.json)
results/1UBQ_A_protein.run.json
```

The summary is for you to read. The last line, the path of the completion
record, is the command's standard output, so a script can capture it.

Chain A has 76 residues, so its 76 Cα atoms form every possible triangle:
70,300 of them. They share 45,349 distinct keys, because triangles with the
same vertex labels whose angle and longest edge fall in the same bins receive
the same key.

Every calculation names its chain: BioTSR never chooses one for you. If you run
the same command again, BioTSR leaves the existing result untouched and stops
with a message. Add `--if-exists skip` to keep a verified existing result and
continue, or `--if-exists overwrite` to replace it.

## 4. Understand the output

The four files share the prefix `1UBQ_A_protein`, built from the structure,
the chain and the method:

| File | What it holds |
| --- | --- |
| `1UBQ_A_protein.keys` | every key and how often it occurs: the representation of the structure |
| `1UBQ_A_protein.triplets` | one row per triangle: its three vertices, angle, longest edge and key. Optional, and by far the largest file |
| `1UBQ_A_protein.meta.json` | what the keys mean and how the triangles were drawn, with a fingerprint of each |
| `1UBQ_A_protein.run.json` | the completion record: the exact command and every file written, saved last |

The completion record is written last, so an interrupted run never looks
complete. To see how a result was produced:

```bash
biotsr describe results/1UBQ_A_protein
```

Next,
[tutorial 01](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/01_protein_calpha.md)
adds the Cα modifiers (amino-acid grouping, mirror images and size filtering)
to this same calculation, and
[tutorial 06](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/06_load_result.md)
reads a saved result back into Python.

## Next steps

### Choosing a method

BioTSR's 20 methods cover protein Cα, atomic, ligand, carbohydrate, nucleotide
and cross (two-sided) TSR. The [BioTSR page](/software#what-biotsr-computes)
summarises the families, each page under
[Methods & research](/research) explains one method and gives its BioTSR
command, and the
[user guide](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md)
has a worked example of every method. `biotsr methods` lists them, and
`biotsr methods protein` describes one.

### Chains, residues, atoms and molecule copies

Every calculation names its chain, and only that chain is searched. Residues and
atoms are chosen with options such as `--residue`, `--residues` and `--atoms`;
the [capability matrix](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CAPABILITY_MATRIX.md)
lists which method takes which.

For a ligand, sugar or nucleotide, two choices give different calculations:

- `--entity-name NAG --entity-id 1` selects one copy: the residue whose PDB
  residue identifier is 1. The output prefix ends in `NAG_1`.
- `--entity-name NAG` alone selects every NAG on the chain you named, combined
  in one calculation, even when the chain holds only one. The prefix ends in
  `NAG_allcopies`.

The entity ID is the residue identifier written in the file, such as `404`,
`52A` or `-5`. It is not a copy number: "the second copy" cannot be asked for.
Every copy of one sugar is not the whole glycan either; for that, use
`carbohydrate_chain`. The cross methods select their molecule side the same
way. See the
[user guide, §12.3](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#123-molecules-one-copy-or-every-copy-on-the-chain)
and tutorials
[02](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/02_atomic.md)
and [04](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/04_cross.md).

### Datasets: CSV manifests, downloads, parallel runs and resuming

`biotsr batch` runs a CSV manifest, one row per calculation, with columns named
after the `biotsr run` options. Every row needs a chain, either in its own
column or as a default given with `--chain`.

- `--dry-run` shows every calculation before anything runs.
- `--download-missing` fetches structures that are not yet in `--pdb-dir`.
- `--jobs 4` or `--jobs auto` runs rows in parallel, with the same results as
  one process.
- `--if-exists skip` resumes a batch and keeps only results it can verify as
  complete.
- `batch_summary.csv` lists every request and its status.

### Example: a batch from a CSV file

This computes protein Cα keys for one chain of each of three public PDB
entries. It writes into its own folder, `batch_example`, so the results of
step 3 are not touched.

Save the manifest as `example_batch.csv`. This command writes it in the
current folder; a text editor works as well:

```bash
cat > example_batch.csv <<'EOF'
sample_id,pdb_id,chain
crambin_A,1CRN,A
ubiquitin_A,1UBQ,A
barstar_D,1BRS,D
EOF
```

Each row is one calculation: `sample_id` names its output files, `pdb_id` is
the structure and `chain` the chain. The method is not a column. It is given
once, on the command line, with `--method protein`.

Check the plan first. `--dry-run` lists every calculation and which structures
would be downloaded, and downloads, computes and writes nothing:

```bash
biotsr batch --manifest example_batch.csv --method protein \
  --pdb-dir structures --download-missing --jobs 2 \
  --output batch_example --dry-run
```

How many structures are downloaded depends on what is already in
`structures/`. If you followed step 2, 1UBQ is there, so the plan downloads
only 1CRN and 1BRS. In a new, empty folder it downloads all three.

> [!DETAILS] Example output of the dry run, after step 2
>
> ```text
> manifest   example_batch.csv (3 source rows, 3 requests)
> dry run    nothing will be computed, downloaded or written
> requests   3 from 3 source row(s)
> chains     3 from the row, 0 from --chain
> structures 1 present, 2 distinct would be downloaded
> outcome    1 would run, 2 would be downloaded then run, 0 would be skipped (verified), 0 inapplicable, 0 chain not specified, 0 would fail
>   req  rows     method                       pt  chains  selection                          prefix / outcome
>   1    2        protein                      -   A       -                                  crambin_A  [would download, run]
>          chain A: whole chain
>   2    3        protein                      -   A       -                                  ubiquitin_A  [would run]
>          chain A: whole chain
>   3    4        protein                      -   D       -                                  barstar_D  [would download, run]
>          chain D: whole chain
> deferred   checked when each structure is read: that the chains exist in it and that every selection matches its residues, molecules or atoms; for structures not yet downloaded, also their content and whether existing outputs can be reused
> ```
>
> In an empty folder, the `structures` line reads
> `0 present, 3 distinct would be downloaded`.

Then run it. `--download-missing` fetches the missing structures into
`structures/`, and `--jobs 2` computes two rows at a time:

```bash
biotsr batch --manifest example_batch.csv --method protein \
  --pdb-dir structures --download-missing --jobs 2 \
  --output batch_example
```

> [!DETAILS] Example output of the batch, after step 2
>
> ```text
> manifest   example_batch.csv (3 source rows, 3 requests)
> download   2 structure(s) into structures (2 at a time)
> download   2 downloaded; report batch_example/fetch_report.csv
> workers    2 processes
>
> requests   3 ok, 0 skipped, 0 failed
> summary    batch_example/batch_summary.csv
> downloads  batch_example/fetch_report.csv
> batch_example
> ```
>
> In an empty folder, the two `download` lines report 3 structures, not 2.

`batch_example/` now holds the four files of step 4 for each row, named by its
`sample_id`: `crambin_A.keys`, `crambin_A.triplets`, `crambin_A.meta.json`
and `crambin_A.run.json`, and the same for `ubiquitin_A` and `barstar_D`.
`fetch_report.csv` records the downloads, and `batch_summary.csv` has one row
per calculation. Some of its columns:

| sample_id | status | structure_id | chain | n_triangles | n_unique_keys |
| --- | --- | --- | --- | --- | --- |
| crambin_A | ok | 1CRN | A | 15180 | 12120 |
| ubiquitin_A | ok | 1UBQ | A | 70300 | 45349 |
| barstar_D | ok | 1BRS | D | 105995 | 62559 |

`n_unique_keys` is the number of distinct keys. The other columns give each
calculation's manifest row, method, output prefix and, for a failure, the
reason. A failed row is also listed in `batch_failures.csv`, and the other rows
still run.

To resume a batch that was interrupted, or that you have added rows to, run
the same command with `--if-exists skip`:

```bash
biotsr batch --manifest example_batch.csv --method protein \
  --pdb-dir structures --download-missing --jobs 2 \
  --output batch_example --if-exists skip
```

Every row of this example already has its result, so all three are skipped:

```text
requests   0 ok, 3 skipped, 0 failed
```

A result is kept only if its completion record shows exactly the same request
(structure, method, chain, selection and settings) and every file it lists is
there at the size it was written; rows with no result yet are computed. An
existing result that is damaged, or was made by a different request, is not
silently accepted: its row fails with the reason, its files are left as they
are, and the batch ends with an error. Without `--if-exists`, a batch never
replaces existing results.

> [!DETAILS] Optional: your CSV uses other column names
>
> A table you already have may name its columns differently and carry extra
> ones. Give every column a role: read it as a manifest field with
> `--column FIELD=HEADER`, carry it along as metadata with `--keep-column`, or
> drop it with `--ignore-column`. Any other unrecognised column stops the
> batch before anything runs, with a message that names it and lists the
> accepted fields, so a misspelt column is never silently ignored. Columns
> whose names begin with `comment` are always ignored.
>
> ```bash
> cat > my_dataset.csv <<'EOF'
> name,pdb_code,chain_id,group,split,notes
> crambin_A,1CRN,A,small,train,plant seed protein
> ubiquitin_A,1UBQ,A,small,train,
> barstar_D,1BRS,D,inhibitor,test,bound to barnase
> EOF
> biotsr batch --manifest my_dataset.csv --method protein \
>   --column sample_id=name --column pdb_id=pdb_code \
>   --column chain=chain_id --column label=group \
>   --keep-column split --ignore-column notes \
>   --pdb-dir structures --download-missing --output batch_custom
> ```
>
> `label` is the manifest's grouping field, used later by analysis; it never
> changes a calculation. The kept `split` column is copied into
> `batch_summary.csv` and each completion record. A column can be mapped to
> `sample_id`, `pdb_id`, `pdb_path`, `structure_id`, `label`, `chain` or any
> other `biotsr run` option without its dashes.

For wide dataset sheets, cross methods and several methods per row, see
[tutorial 05](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/05_batch_manifest.md)
and the
[user guide, §13](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#13-datasets-manifests-sheets-and-batches).

### Keys, triplets and metadata

The [user guide, §15](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#15-output-files)
describes every column of the output files, including the 47 columns of a
triplet file.
[Tutorial 06](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/06_load_result.md)
loads a result with `biotsr.load_result` and checks its fingerprints.

### Common keys, similarity, clustering and visualization

From the command line, `biotsr analyze common-keys` finds the keys a set of
samples shares. Similarity measures (generalized Jaccard is the primary one),
average-linkage clustering and the clustered heat map run from Python. The heat
map also needs the plotting extra:

```bash
python -m pip install "biotsr[plot]==1.0.0"
```

BioTSR refuses to combine results whose keys mean different things. The
[Common Keys](/analysis/common-keys) and
[Hierarchical Clustering](/analysis/clustering) pages show each step. See
[tutorial 07](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/07_analysis.md)
for common keys and what has to match, and
[tutorial 08](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/08_similarity_clustering.md)
for similarity, clustering and the figure.

### Large datasets and HPC

The triangle files dominate both memory and disk. `biotsr run` and
`biotsr batch` write them as they go, so a large structure's triangles are not
all held in memory at once. The exception is `amino_acid_atomic` run over every
residue, which holds them until it finishes. Three things still use memory:

- each calculation's key counts;
- each parallel worker, which holds one calculation;
- analysis, which holds every sample's key counts at once.

Streaming does not make a triangle file any smaller. Triangle counts grow with
the cube of the number of points, so if you need keys only, add `--no-triplets`
and the file is never written. See the
[user guide, §14](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/USER_GUIDE.md#14-memory-and-disk)
and the
[known limitations, §5](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/KNOWN_LIMITATIONS.md#5-memory-not-every-run-streams).

On a cluster, `--jobs auto` uses the CPUs your job was allocated. Download
structures on a node with network access first, and call BioTSR as
`python -m biotsr`. The
[command-line guide, §12](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/CLI_GUIDE.md#12-scripts-and-hpc)
has example Slurm scripts.

### Following the package tutorials exactly

The
[eight tutorials](https://github.com/TSRMethod/BioTSR/blob/v1.0.0/docs/tutorials/README.md)
take their example structures from the BioTSR repository. You do not need a
clone to use BioTSR: `biotsr fetch` downloads the same public entries. Only
tutorial 05's synthetic test structure, `SYNPHOS.pdb`, needs a clone of the
release:

```bash
git clone --branch v1.0.0 https://github.com/TSRMethod/BioTSR
```
