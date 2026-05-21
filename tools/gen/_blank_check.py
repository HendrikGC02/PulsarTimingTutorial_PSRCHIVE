#!/usr/bin/env python3
"""Blank / degenerate PNG detector and MANIFEST validator.

Scans every PNG entry in plots/MANIFEST.json (or a passed-in list) and
classifies it:
    valid  = True   — plot has meaningful content (variation in the
                      data region above an empirical threshold)
    valid  = False  — plot is empty / degenerate (only axes, or
                      uniform fill).  The website renders a banner.

Writes the `valid` flag back into MANIFEST.json so the UI can read it.
Optionally also writes `external` and `dirty` flags driven by the path
prefix:
    * external=True   if path starts with pdmp/ , scintools/ , clfd/
    * dirty=True      if filename ends with "__dirty.png"

Heuristic
---------
Convert PNG → grayscale, crop the central 70 % (drops axis labels &
ticks), compute the per-pixel standard deviation of intensities relative
to the median.  Pulsar plots have non-trivial dynamic range; a blank
plot's central area is essentially one colour.

Threshold tuned against a hand-labelled batch of existing pav outputs
(see tools/gen/_blank_check_calibration.md if present).
"""
from __future__ import annotations
import argparse
import json
import os
import sys
from pathlib import Path
from typing import Iterable

from PIL import Image
import numpy as np

REPO = Path(__file__).resolve().parents[2]
PLOTS = REPO / "plots"
MANIFEST = PLOTS / "MANIFEST.json"

# Multi-signal classifier.  A plot is flagged "valid:false" (degenerate /
# blank) ONLY if *all* the following agree it has no data content — that
# way real-but-sparse plots (e.g. a single S-curve on a black background)
# stay marked valid.  Tuned against a hand-labelled batch of pav outputs
# so blank pav -DT / pav -YT / pav -DF (which produce axes-only PNGs of
# ~6–8 KB) get flagged, while real psrplot -p Scyl polprof / pdmp / joy
# / dynspec / rotation profile outputs (all 8–20 KB, low entropy on a
# black background but containing thin coloured lines) stay valid.
SIZE_KB_BLANK   = 8.0     # under this AND
ENTROPY_BLANK   = 0.20    # under this  AND
INNER_PCT_BLANK = 0.20    # under this  → blank

# Path prefixes that are KNOWN VALID by construction — even if the
# classifier flags them, leave them alone.  Use sparingly.
EXEMPT_PREFIXES = (
    "rotation/",           # pam -r N output — thin 1D flux profile
    "pdmp/",               # pdmp diagnostic page — external
    "dynspec/",            # dynamic spectrum — heatmap on black
    "psrplot/.+/joy__",    # joy-division stacked
    "psrplot/.+/polprof_", # literature polarisation profile
)
import re as _re
_EXEMPT_RE = _re.compile("|".join(EXEMPT_PREFIXES))


def classify(png_path: Path) -> tuple[bool, dict]:
    """Return (valid, debug_info)."""
    try:
        img = Image.open(png_path).convert("RGB")
    except Exception as e:
        return False, {"error": str(e)}
    arr = np.asarray(img, dtype=np.float32)
    h, w, _ = arr.shape
    if h < 50 or w < 50:
        return False, {"reason": "tiny", "shape": (h, w)}
    cy0, cy1 = int(h * 0.15), int(h * 0.85)
    cx0, cx1 = int(w * 0.15), int(w * 0.85)
    crop = arr[cy0:cy1, cx0:cx1]
    g = crop.mean(axis=2)
    inner_pct = 100.0 * float(((g > 20) & (g < 235)).sum()) / g.size
    hist, _ = np.histogram(g, bins=16, range=(0, 256))
    p = hist / hist.sum()
    p = p[p > 0]
    entropy = float(-(p * np.log2(p)).sum()) if len(p) else 0.0
    size_kb = png_path.stat().st_size / 1024.0
    blank = (size_kb < SIZE_KB_BLANK
             and entropy < ENTROPY_BLANK
             and inner_pct < INNER_PCT_BLANK)
    return (not blank), {
        "size_kb": round(size_kb, 1),
        "entropy": round(entropy, 2),
        "inner_pct": round(inner_pct, 2),
    }


def is_external(path: str) -> bool:
    return path.startswith(("pdmp/", "scintools/", "clfd/", "external/"))


def is_dirty(path: str) -> bool:
    # filename suffix convention used by the extended generators
    stem = path.rsplit("/", 1)[-1]
    return "__dirty" in stem or stem.endswith("_dirty.png")


def annotate_manifest(*, verbose: bool = False) -> dict:
    with open(MANIFEST) as f:
        M = json.load(f)
    by_path = {}
    n_total = n_png = n_valid = n_invalid = n_missing = 0
    for e in M["entries"]:
        n_total += 1
        p = e["path"]
        ext = is_external(p)
        dirty = is_dirty(p)
        if ext: e["external"] = True
        else:   e.pop("external", None)
        if dirty: e["dirty"] = True
        else:     e.pop("dirty", None)
        if not p.endswith(".png"):
            # text outputs are always 'valid' if present; we don't check
            continue
        n_png += 1
        png = PLOTS / p
        if not png.exists():
            n_missing += 1
            e["valid"] = False
            e.setdefault("notes", []).append("file missing")
            continue
        valid, dbg = classify(png)
        # exempt paths we know are valid by construction
        if not valid and _EXEMPT_RE.match(p):
            valid = True
            dbg["exempt"] = True
        e["valid"] = bool(valid)
        e["blank_metrics"] = dbg
        if valid: n_valid += 1
        else:     n_invalid += 1
        if verbose:
            tag = "OK   " if valid else "BLANK"
            print(f"  {tag} {p}  std={dbg.get('std')} range={dbg.get('range')}")
    with open(MANIFEST, "w") as f:
        json.dump(M, f, indent=2)
    return dict(total=n_total, png=n_png, valid=n_valid, invalid=n_invalid, missing=n_missing)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", "-v", action="store_true")
    ap.add_argument("--quiet",   "-q", action="store_true")
    args = ap.parse_args()
    stats = annotate_manifest(verbose=args.verbose)
    if not args.quiet:
        print(f"[blank-check] png={stats['png']} valid={stats['valid']} "
              f"invalid={stats['invalid']} missing={stats['missing']}")


if __name__ == "__main__":
    main()
