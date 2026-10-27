"""Derive the atoms drawn in the "Cα or atoms" figure on the Amino Acid TSR page.

RUN BY HAND, NOT BY THE BUILD:

    python -m venv .venv && . .venv/bin/activate
    python -m pip install "biotsr==1.0.0"
    python scripts/figures/point-choice-example.py

It runs BioTSR 1.0.0's amino-acid atomic method on Leu15 of ubiquitin (1UBQ
chain A) and reads, from the triplet file BioTSR writes, the residue's heavy
atoms: their names, BioTSR's element labels and their coordinates. The
coordinates are projected onto the plane that keeps the atoms furthest apart,
so the figure can draw them flat without one hiding another; nothing else is
changed.
It writes src/components/figures/pointChoiceExample.json.
"""

import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "components" / "figures" / "pointChoiceExample.json"
EXPECTED_VERSION = "1.0.0"


def biotsr(*args, cwd):
    done = subprocess.run([sys.executable, "-m", "biotsr", *args],
                          cwd=cwd, capture_output=True, text=True)
    if done.returncode != 0:
        sys.exit(f"biotsr {' '.join(args)} failed:\n{done.stderr}")


def projection(points):
    """Project 3-D points onto the plane that keeps them furthest apart.

    Tries 2,000 viewing directions spread evenly over a sphere and keeps the
    one whose flat projection has the largest smallest distance between any
    two atoms, so no atom hides behind another; the result is then turned so
    its longer extent runs across. Distances in the plane are true distances
    shortened by foreshortening only; nothing is moved by hand.
    """
    from math import atan2, cos, pi, sin, sqrt

    n = len(points)
    mean = [sum(p[i] for p in points) / n for i in range(3)]
    centred = [[p[i] - mean[i] for i in range(3)] for p in points]

    def basis(view):
        helper = [1.0, 0.0, 0.0] if abs(view[0]) < 0.9 else [0.0, 1.0, 0.0]
        u = [view[1] * helper[2] - view[2] * helper[1],
             view[2] * helper[0] - view[0] * helper[2],
             view[0] * helper[1] - view[1] * helper[0]]
        norm = sqrt(sum(x * x for x in u))
        u = [x / norm for x in u]
        w = [view[1] * u[2] - view[2] * u[1],
             view[2] * u[0] - view[0] * u[2],
             view[0] * u[1] - view[1] * u[0]]
        return u, w

    def flat(view):
        u, w = basis(view)
        return [(sum(c[i] * u[i] for i in range(3)), sum(c[i] * w[i] for i in range(3)))
                for c in centred]

    def spread(xy):
        return min(((xy[i][0] - xy[j][0]) ** 2 + (xy[i][1] - xy[j][1]) ** 2) ** 0.5
                   for i in range(n) for j in range(i + 1, n))

    best, best_score = None, -1.0
    count = 2000
    for k in range(count):
        z = 1 - 2 * (k + 0.5) / count
        r = sqrt(1 - z * z)
        phi = k * pi * (3 - sqrt(5))
        xy = flat([r * cos(phi), r * sin(phi), z])
        score = spread(xy)
        if score > best_score:
            best, best_score = xy, score

    # Turn the drawing so its principal axis is horizontal.
    sxx = sum(x * x for x, _ in best)
    syy = sum(y * y for _, y in best)
    sxy = sum(x * y for x, y in best)
    angle = 0.5 * atan2(2 * sxy, sxx - syy)
    c, s_ = cos(-angle), sin(-angle)
    return [[round(x * c - y * s_, 3), round(x * s_ + y * c, 3)] for x, y in best]


def main():
    import biotsr as package

    if package.__version__ != EXPECTED_VERSION:
        sys.exit(f"needs biotsr {EXPECTED_VERSION}, found {package.__version__}")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        biotsr("fetch", "1UBQ", "--pdb-dir", "structures", cwd=work)
        biotsr("run", "--method", "amino_acid_atomic", "--pdb", "structures/1UBQ.pdb",
               "--chain", "A", "--residue", "15", "--residue-name", "LEU",
               "--output", "results", cwd=work)
        meta = json.loads((work / "results/1UBQ_A_amino_acid_atomic_LEU_15.meta.json").read_text())
        atoms = {}
        with open(work / "results/1UBQ_A_amino_acid_atomic_LEU_15.triplets", newline="") as handle:
            for row in csv.DictReader(handle, delimiter="\t"):
                for i in (1, 2, 3):
                    atoms[row[f"atom{i}"]] = {
                        "name": row[f"atom{i}"],
                        "element": row[f"label_name{i}"],
                        "label": int(row[f"label{i}"]),
                        "xyz": [float(row[f"{c}{i}"]) for c in "xyz"],
                    }

    names = sorted(atoms)
    flat = projection([atoms[n]["xyz"] for n in names])
    example = {
        "source": "BioTSR 1.0.0, biotsr run --method amino_acid_atomic --pdb 1UBQ.pdb --chain A --residue 15 --residue-name LEU",
        "structure": "1UBQ",
        "chain": "A",
        "residue": "LEU",
        "number": 15,
        "triangles": meta["counts"]["n_triangles"],
        "distinctKeys": meta["counts"]["n_unique_keys"],
        "atoms": [{**{k: atoms[n][k] for k in ("name", "element", "label")}, "xy": xy}
                  for n, xy in zip(names, flat)],
    }
    OUTPUT.write_text(json.dumps(example, indent=1) + "\n")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
