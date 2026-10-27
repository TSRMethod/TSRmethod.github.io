"""Derive the clustering example on the Hierarchical Clustering page.

RUN BY HAND, NOT BY THE BUILD:

    python -m venv .venv && . .venv/bin/activate
    python -m pip install "biotsr==1.0.0"
    python scripts/figures/clustering-example.py

It repeats sections 1-5 of BioTSR 1.0.0's tutorial 08 (similarity and
clustering) on PDB entry 1BNA: one `nucleotide` sample per residue of both
strands, generalized Jaccard distances, and average-linkage clustering. It
writes src/components/figures/clusteringExample.json, which holds the samples
in the dendrogram's leaf order, their observed bases, the distance matrix in
that order, and the 21 merges of the tree.

Nothing is clustered here. The tree, its heights and its leaf order are
BioTSR's own; this script only reorders the matrix to the leaf order so the
page can draw it, and checks the tutorial's stated results so a different
release cannot slip in unnoticed. No flat partition is made, and the JSON says
so: BioTSR's result is the tree, which needs no number of clusters.
"""

import csv
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "src" / "components" / "figures" / "clusteringExample.json"
EXPECTED_VERSION = "1.0.0"

# Tutorial 08, section 1: every residue of both strands except the 5' ends,
# which have no phosphate and fail the method's completeness rule.
RESIDUES = [("A", "DG", 2), ("A", "DC", 3), ("A", "DG", 4), ("A", "DA", 5), ("A", "DA", 6),
            ("A", "DT", 7), ("A", "DT", 8), ("A", "DC", 9), ("A", "DG", 10), ("A", "DC", 11),
            ("A", "DG", 12), ("B", "DG", 14), ("B", "DC", 15), ("B", "DG", 16), ("B", "DA", 17),
            ("B", "DA", 18), ("B", "DT", 19), ("B", "DT", 20), ("B", "DC", 21), ("B", "DG", 22),
            ("B", "DC", 23), ("B", "DG", 24)]


def main():
    import biotsr
    from biotsr.analysis import AnalysisSample, feature_matrix, similarity_matrix, hierarchy

    if biotsr.__version__ != EXPECTED_VERSION:
        sys.exit(f"needs biotsr {EXPECTED_VERSION}, found {biotsr.__version__}")

    with tempfile.TemporaryDirectory() as tmp:
        work = Path(tmp)
        with open(work / "nucleotides.csv", "w", newline="") as handle:
            writer = csv.writer(handle)
            writer.writerow(["sample_id", "pdb_id", "method", "chain", "entity_name", "entity_id"])
            for chain, name, number in RESIDUES:
                writer.writerow([f"1BNA_{chain}_{number}", "1BNA", "nucleotide", chain, name, number])
        for args in (["fetch", "1BNA", "--pdb-dir", "pdb"],
                     ["batch", "--manifest", "nucleotides.csv", "--pdb-dir", "pdb",
                      "--output", "nt", "--no-triplets"]):
            done = subprocess.run([sys.executable, "-m", "biotsr", *args],
                                  cwd=work, capture_output=True, text=True)
            if done.returncode != 0:
                sys.exit(f"biotsr {' '.join(args)} failed:\n{done.stderr}")
        with open(work / "nt" / "batch_summary.csv", newline="") as handle:
            rows = list(csv.DictReader(handle))
        assert {r["status"] for r in rows} == {"ok"}
        base = {f"1BNA_{c}_{n}": name for c, name, n in RESIDUES}
        samples = [
            AnalysisSample.from_result(biotsr.load_result(str(work / r["output"]) + ".keys"),
                                       sample_id=r["sample_id"], label=base[r["sample_id"]])
            for r in rows
        ]

    fm = feature_matrix(samples)
    distance = similarity_matrix(fm, "generalized_jaccard").to_distance()
    tree = hierarchy(distance)

    # The tutorial's own checks (section 5).
    heights = tree.linkage.heights
    assert len(heights) == 21 and tree.linkage.is_monotonic
    assert (round(min(heights), 3), round(max(heights), 3)) == (0.419, 0.761)
    assert tree.provenance()["flat_partition"] is None

    ids = list(distance.sample_ids)
    order = list(tree.ordered_sample_ids())
    position = {sample: ids.index(sample) for sample in order}

    example = {
        "source": "BioTSR 1.0.0, tutorial 08 sections 1-5: 1BNA, method nucleotide, one sample per residue",
        "structure": "1BNA",
        "samples": len(ids),
        "distinctKeys": fm.shape[1],
        "measure": "generalized Jaccard distance",
        "linkage": "average (UPGMA)",
        "flatPartition": None,
        # In leaf order, top to bottom.
        "leaves": [{"id": s, "base": base[s]} for s in order],
        "distance": [[round(distance.value(position[a], position[b]), 3) for b in order] for a in order],
        # BioTSR's linkage rows: indices below n are samples in the matrix's
        # own order (`sampleOrder`), index n + k is the group made at step k.
        "sampleOrder": ids,
        "merges": [
            {"left": int(left), "right": int(right), "height": round(height, 3), "size": int(size)}
            for left, right, height, size in tree.linkage.rows
        ],
    }

    OUTPUT.write_text(json.dumps(example, indent=1) + "\n")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
