"""Derive the worked example shown in the TSR overview figure.

RUN BY HAND, NOT BY THE BUILD:

    python -m venv .venv && . .venv/bin/activate
    python -m pip install "biotsr==1.0.0"
    python scripts/figures/tsr-overview-example.py

It downloads PDB entry 1UBQ, computes protein Ca TSR keys for chain A with
BioTSR's own command line, finds one triangle in the triplet file -- the Ca
atoms of Val70, Ile44 and Leu8, the residues of ubiquitin's hydrophobic patch
-- and writes src/components/figures/tsrOverviewExample.json. Every number the
figure prints comes from that file, and the file comes from this calculation,
so the figure cannot disagree with the software.

Nothing here reimplements TSR. The distances are recomputed from the three
coordinates in the triplet row only so the figure can draw the triangle to
scale; the key, the bins, the angle and the longest edge are BioTSR's, and so
are the bin boundaries, read from the schemes the run reports in its key
space.

It also records every other triangle with the same key, with its own angle
and edges. The figure says what those have in common -- the labels and the two
classes -- and what they do not: a key fixes one angle class and the class of
the longest edge, not the whole triangle.
"""

import csv
import json
import math
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "components" / "figures" / "tsrOverviewExample.json"
RESIDUES = {"70", "44", "8"}
EXPECTED_VERSION = "1.0.0"


def biotsr(*args, cwd):
    return subprocess.run(
        [sys.executable, "-m", "biotsr", *args],
        cwd=cwd, check=True, capture_output=True, text=True,
    )


def main():
    import biotsr as package

    if package.__version__ != EXPECTED_VERSION:
        sys.exit(f"needs biotsr {EXPECTED_VERSION}, found {package.__version__}")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        biotsr("fetch", "1UBQ", "--pdb-dir", "structures", cwd=work)
        biotsr(
            "run", "--method", "protein", "--pdb", "structures/1UBQ.pdb",
            "--chain", "A", "--output", "results", cwd=work,
        )

        meta = json.loads((work / "results/1UBQ_A_protein.meta.json").read_text())
        with open(work / "results/1UBQ_A_protein.triplets", newline="") as handle:
            rows = list(csv.DictReader(handle, delimiter="\t"))
        with open(work / "results/1UBQ_A_protein.keys", newline="") as handle:
            frequency = {row["key"]: int(row["frequency"])
                         for row in csv.DictReader(handle, delimiter="\t")}

    [row] = [r for r in rows if {r["seq1"], r["seq2"], r["seq3"]} == RESIDUES]

    vertices = []
    for i in (1, 2, 3):
        vertices.append({
            "residue": row[f"residue{i}"],
            "number": int(row[f"seq{i}"]),
            "label": int(row[f"label{i}"]),
            "xyz": [float(row[f"x{i}"]), float(row[f"y{i}"]), float(row[f"z{i}"])],
        })

    def dist(a, b):
        return math.dist(vertices[a]["xyz"], vertices[b]["xyz"])

    def edges(r):
        xyz = [[float(r[f"{c}{i}"]) for c in "xyz"] for i in (1, 2, 3)]
        return [round(math.dist(xyz[0], xyz[1]), 2), round(math.dist(xyz[0], xyz[2]), 2),
                round(math.dist(xyz[1], xyz[2]), 2)]

    # The boundaries of the two classes this triangle fell in, from the
    # schemes the run itself names (checked by name, so a different scheme
    # cannot be read by mistake).
    from biotsr.binning.distance import DISTANCE_SCHEME_CALPHA_35 as distance_scheme
    from biotsr.binning.theta import THETA_SCHEME_29 as theta_scheme
    assert meta["key_space"]["distance_scheme"]["name"] == distance_scheme.name
    assert meta["key_space"]["theta_scheme"]["name"] == theta_scheme.name

    def bounds(scheme, cls):
        lower = 0.0 if cls == 1 else scheme.boundaries[cls - 2]
        return [lower, scheme.boundaries[cls - 1]]

    key_space = meta["key_space"]
    counts = meta["counts"]
    key = row["key"]
    same_key = [
        {
            "residues": [f'{r["residue1"]}{r["seq1"]}', f'{r["residue2"]}{r["seq2"]}',
                         f'{r["residue3"]}{r["seq3"]}'],
            # Base (L1-L2), L1-L3, L2-L3, in the canonical order.
            "edges": edges(r),
            "maxDistance": round(float(r["max_distance"]), 2),
            "theta": round(float(r["theta"]), 1),
        }
        for r in rows if r["key"] == key
    ]

    example = {
        "source": "BioTSR 1.0.0, biotsr run --method protein --pdb 1UBQ.pdb --chain A",
        "structure": "1UBQ",
        "chain": "A",
        "points": counts["n_points"],
        "triangles": counts["n_triangles"],
        "distinctKeys": counts["n_unique_keys"],
        "labelRadix": key_space["label_scheme"]["radix"],
        "thetaClasses": key_space["theta_scheme"]["radix"],
        "distanceClasses": key_space["distance_scheme"]["radix"],
        # Canonical order: vertex 1 and 2 form the base edge, vertex 3 the apex.
        "vertices": [{k: v[k] for k in ("residue", "number", "label")} for v in vertices],
        "base": round(dist(0, 1), 2),
        "edge13": round(dist(0, 2), 2),
        "edge23": round(dist(1, 2), 2),
        "maxDistance": round(float(row["max_distance"]), 2),
        "thetaRaw": round(float(row["theta_raw"]), 1),
        "theta": round(float(row["theta"]), 1),
        "thetaClass": int(row["theta_class"]),
        "distanceClass": int(row["distance_class"]),
        "thetaClassRange": bounds(theta_scheme, int(row["theta_class"])),
        "distanceClassRange": bounds(distance_scheme, int(row["distance_class"])),
        "key": int(key),
        "keyFrequency": frequency[key],
        "sameKey": same_key,
    }

    OUTPUT.write_text(json.dumps(example, indent=2) + "\n")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
