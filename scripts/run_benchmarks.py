#!/usr/bin/env python3
"""Run benchmark suite wrapper script."""

import argparse
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "benchmarks", "runners"))
from run_netlib import run_benchmarks

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--suite", default="netlib")
    parser.add_argument("--output", default="benchmark_report.json")
    args = parser.parse_args()
    run_benchmarks(suite=args.suite, output_file=args.output)
