#!/usr/bin/env python3
"""Validates benchmark results against numerical tolerances."""

import argparse
import json
import sys


def verify(report_path, tolerance=1e-6):
    print(f"[*] Verifying benchmark report: {report_path} with tolerance {tolerance}")
    with open(report_path, "r") as f:
        data = json.load(f)

    for item in data:
        err = item.get("error_abs", 0.0)
        status = item.get("status")
        if status != "optimal" or err > tolerance:
            print(f"[!] FAILED: Instance {item.get('instance')} status={status}, error={err}")
            sys.exit(1)

    print("[+] All benchmark instances verified within tolerance.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", required=True)
    parser.add_argument("--tolerance", type=float, default=1e-6)
    args = parser.parse_args()
    verify(args.report, args.tolerance)
