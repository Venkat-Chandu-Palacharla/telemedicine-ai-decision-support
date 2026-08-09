"""Pipeline orchestrator.

Runs the full ML training pipeline for all configured diseases, aggregates
results, and writes a combined report. Also serves as a single entry point.

Usage:
    python run_all.py [disease_id]
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from config import DATASETS, MODELS_DIR, OUTPUTS_DIR
from train import train_disease
from ablation import run_all_ablations


def main():
    results = []
    diseases = list(DATASETS.keys())

    disease_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if disease_arg:
        if disease_arg not in DATASETS:
            print(f"Unknown disease '{disease_arg}'. Available: {diseases}")
            sys.exit(1)
        diseases = [disease_arg]

    for did in diseases:
        try:
            summary = train_disease(did, DATASETS[did])
            results.append(summary)
        except Exception as exc:  # pragma: no cover
            print(f"[ERROR] Failed {did}: {exc}")
            results.append({"disease_id": did, "status": "error", "reason": str(exc)})

    # Write combined report
    report_path = OUTPUTS_DIR / "combined_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)

    # Run the ablation study to isolate the effect of each preprocessing step.
    try:
        run_all_ablations()
    except Exception as exc:  # pragma: no cover
        print(f"[ERROR] Ablation study failed: {exc}")

    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print(f"Combined report: {report_path}")
    print(f"Artifacts: {MODELS_DIR}")
    print(f"Plots: {OUTPUTS_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    main()
