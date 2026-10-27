"""Derive the numbers in the cross-TSR figure.

RUN BY HAND, NOT BY THE BUILD:

    python -m venv .venv && . .venv/bin/activate
    python -m pip install "biotsr==1.0.0"
    python scripts/figures/cross-example.py

It runs two of BioTSR 1.0.0's cross methods on public structures -- the
nucleotide-protein example of BioTSR's user guide (2AC0, DG 8 of chain E
against protein chain B), at the reference 3.5 A cutoff and at 3.0 A, and the
ligand-protein example used on the DrugTSR page (3PTB, benzamidine BEN 1
against chain A) -- and writes src/components/figures/crossExample.json: for
each run, how many atoms each side offered, how many were in contact, which
atoms those were, and how many triangles and keys resulted.

The figure draws the atoms schematically; only the counts and the atom names
are data. The script checks that the triangle count is exactly the number of
mixed-side triples, a*C(b,2) + b*C(a,2), so the formula the figure prints is
the one the software used.
"""

import csv
import json
import subprocess
import sys
import tempfile
from math import comb
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "components" / "figures" / "crossExample.json"
EXPECTED_VERSION = "1.0.0"

RUNS = [
    {
        "id": "nucleotide",
        "label": "DG 8 of 2AC0 chain E against protein chain B",
        "pdb": "2AC0",
        "args": ["--method", "nucleotide_protein_cross", "--chain", "E", "--chain-2", "B",
                 "--entity-name", "DG", "--entity-id", "8"],
        "cutoffs": [3.5, 3.0],
    },
    {
        "id": "drug",
        "label": "benzamidine BEN 1 of 3PTB against chain A",
        "pdb": "3PTB",
        "args": ["--method", "drug_protein_cross", "--chain", "A", "--chain-2", "A",
                 "--entity-name", "BEN", "--entity-id", "1"],
        "cutoffs": [3.5],
    },
]


def biotsr(*args, cwd):
    done = subprocess.run([sys.executable, "-m", "biotsr", *args],
                          cwd=cwd, capture_output=True, text=True)
    if done.returncode != 0:
        sys.exit(f"biotsr {' '.join(args)} failed:\n{done.stderr}")
    return done


def main():
    import biotsr as package

    if package.__version__ != EXPECTED_VERSION:
        sys.exit(f"needs biotsr {EXPECTED_VERSION}, found {package.__version__}")

    examples = {}
    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        biotsr("fetch", *sorted({r["pdb"] for r in RUNS}), "--pdb-dir", "structures", cwd=work)
        for run in RUNS:
            results = []
            for cutoff in run["cutoffs"]:
                out = work / f"{run['id']}-{cutoff}"
                biotsr("run", *run["args"], "--pdb", f"structures/{run['pdb']}.pdb",
                       "--contact-cutoff", str(cutoff), "--output", str(out), cwd=work)
                [meta_path] = out.glob("*.meta.json")
                meta = json.loads(meta_path.read_text())
                pools = meta["provenance"]["cross"]["cross_pools"]
                counts = meta["counts"]
                atoms = {"a": set(), "b": set()}
                with open(meta_path.with_name(meta_path.name.replace(".meta.json", ".triplets")),
                          newline="") as handle:
                    for row in csv.DictReader(handle, delimiter="\t"):
                        for i in (1, 2, 3):
                            side = row[f"side{i}"].lower()
                            atoms[side].add(f'{row[f"residue{i}"]} {row[f"seq{i}"]} {row[f"atom{i}"]}')
                a, b = pools["side_a_pool"], pools["side_b_pool"]
                assert counts["n_triangles"] == a * comb(b, 2) + b * comb(a, 2)
                roles = {side["side"]: side["role"]
                         for side in meta["provenance"]["selection_request"]["sides"]}
                results.append({
                    "cutoff": pools["contact_cutoff"],
                    "roleA": roles["a"],
                    "roleB": roles["b"],
                    "offeredA": pools["side_a_offered"],
                    "offeredB": pools["side_b_offered"],
                    "poolA": a,
                    "poolB": b,
                    "contactPairs": pools["n_contact_pairs"],
                    "atomsA": sorted(atoms["a"]),
                    "atomsB": sorted(atoms["b"]),
                    "triangles": counts["n_triangles"],
                    "distinctKeys": counts["n_unique_keys"],
                })
            examples[run["id"]] = {"label": run["label"], "structure": run["pdb"], "runs": results}

    OUTPUT.write_text(json.dumps({"source": "BioTSR 1.0.0", "examples": examples}, indent=1) + "\n")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
