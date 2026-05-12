"""tools/gen/_annot_helpers.py — build .annot.json sidecars by column-counting
real PSRCHIVE stdout.

The website's TextOutput component (scripts/tryit.jsx) loads `<file>.txt` and
`<file>.annot.json` in parallel and uses the JSON to draw per-column tooltips.

The JSON schema is intentionally simple:

    {
      "version": 1,
      "spans": [
        {"line": 0, "start": 0,  "end": 24, "label": "...", "kind": "filename"},
        {"line": 0, "start": 25, "end": 32, "label": "...", "kind": "frequency"},
        ...
      ]
    }

- `line` is 0-indexed; spans on the same line must not overlap.
- `kind` drives the colour swatch in the legend and groups duplicate entries.
- `label` is the human-readable tooltip.

Recognised kinds (the website renders these with distinct colours):

    filename, frequency, mjd, error, observatory, flag, field

Add new kinds freely — they'll fall back to a neutral colour client-side.

This module exposes three building blocks:

    span(line, start, end, label, kind)            -> dict
    by_columns(text, line_idx, spec)               -> list[span]
    by_regex(text, line_idx, pattern, label, kind) -> list[span]

plus convenience builders for the formats PSRCHIVE actually emits:

    annot_tempo2_tim_line(text, line_idx) -> list[span]   # pat → tempo2 IPTA
    annot_vap_table(text)                  -> list[span]   # vap header table
    annot_psrstat(text)                    -> list[span]   # psrstat key=val
"""

from __future__ import annotations
import json, re, sys
from pathlib import Path

# --- primitives ---------------------------------------------------------------

def span(line: int, start: int, end: int, label: str, kind: str = "field") -> dict:
    """One span entry."""
    return {"line": line, "start": int(start), "end": int(end),
            "label": label, "kind": kind}


def by_columns(line: str, line_idx: int, spec: list[tuple[str, str]]) -> list[dict]:
    """Split `line` on whitespace and tag the resulting tokens.

    `spec` is a list of (label, kind) tuples — one per *token* in column order.
    Tokens beyond the spec are left unannotated.  Returns spans pinned to
    `line_idx`.
    """
    out, i = [], 0
    for (lbl, knd), m in zip(spec, re.finditer(r"\S+", line)):
        out.append(span(line_idx, m.start(), m.end(), lbl, knd))
    return out


def by_regex(line: str, line_idx: int, pattern: str, label: str, kind: str = "field") -> list[dict]:
    """Annotate every match of `pattern` in `line` with the same label."""
    return [span(line_idx, m.start(), m.end(), label, kind)
            for m in re.finditer(pattern, line)]


# --- convenience builders -----------------------------------------------------

# Tempo2 IPTA TOA line looks like:
#   filename.ar  1284.000  60451.123456789012  0.84  meerkat   -fe UHF -be ...
#   ^----------^  ^------^  ^------------------^  ^--^  ^------^
#   filename      freqMHz   MJD                   err   site

_TIM_TOKEN_SPEC = [
    ("archive (path or filename) the TOA was generated from", "filename"),
    ("centre frequency of this TOA in MHz",                   "frequency"),
    ("Modified Julian Date — integer days + fractional day",  "mjd"),
    ("1-sigma TOA uncertainty in microseconds",               "error"),
    ("observatory code (telescope where this TOA was taken)", "observatory"),
]


def annot_tempo2_tim_line(line: str, line_idx: int) -> list[dict]:
    """Annotate one TOA line in tempo2 IPTA format.

    The first 5 tokens are the fixed columns; anything after them is a flag
    pair (`-key value`) which we annotate generically.
    """
    if not line.strip() or line.lstrip().startswith(("FORMAT", "C ", "#")):
        return []
    out = by_columns(line, line_idx, _TIM_TOKEN_SPEC)
    # find -flag VALUE pairs after the 5th token
    flag_re = re.compile(r"-(\w+)\s+(\S+)")
    # find the end of the 5th column to know where flags start
    consumed = 0
    for n, m in enumerate(re.finditer(r"\S+", line)):
        if n == 5: consumed = m.start(); break
    else:
        consumed = len(line)
    for m in flag_re.finditer(line, pos=consumed):
        out.append(span(line_idx, m.start(1) - 1, m.end(2),
                        f"-{m.group(1)} flag — value: {m.group(2)}", "flag"))
    return out


def annot_vap_table(text: str) -> list[dict]:
    """Annotate a vap table.  Header row drives the column labels."""
    lines = text.splitlines()
    if not lines: return []
    # vap header row is usually a left-aligned series of field names
    header_idx = next((i for i, ln in enumerate(lines)
                       if re.search(r"\b(NAME|name)\b", ln)), 0)
    header = lines[header_idx]
    # column starts = positions of non-space runs in header
    cols = [(m.group(), m.start(), m.end()) for m in re.finditer(r"\S+", header)]
    out = []
    for li, ln in enumerate(lines):
        if li == header_idx or not ln.strip(): continue
        for (cname, cstart, cend), m in zip(cols, re.finditer(r"\S+", ln)):
            out.append(span(li, m.start(), m.end(),
                            f"{cname} — column from vap header", "field"))
    return out


def annot_psrstat(text: str) -> list[dict]:
    """Annotate `psrstat -c "..."` output (key=value pairs)."""
    out = []
    for li, ln in enumerate(text.splitlines()):
        for m in re.finditer(r"(\w[\w:]*)\s*=\s*(\S+)", ln):
            out.append(span(li, m.start(1), m.end(1),
                            f"metric name — value is {m.group(2)}", "field"))
            out.append(span(li, m.start(2), m.end(2),
                            f"value of {m.group(1)}", "field"))
    return out


# --- file IO ------------------------------------------------------------------

def write_annot(path: str | Path, spans: list[dict]) -> None:
    """Write spans to <path> with the standard envelope."""
    Path(path).write_text(json.dumps(
        {"version": 1, "spans": spans}, indent=2))


# --- CLI ----------------------------------------------------------------------
# Allow `python _annot_helpers.py tim path/to/toas.tim path/to/toas.annot.json`
# so the bash scripts can stay simple.

def main(argv):
    if len(argv) != 4:
        print("usage: _annot_helpers.py {tim|vap|psrstat} <input.txt> <output.annot.json>",
              file=sys.stderr)
        return 2
    kind, in_path, out_path = argv[1], argv[2], argv[3]
    text = Path(in_path).read_text()
    if kind == "tim":
        # The website only renders the first ~8 lines, and pat output is one
        # TOA per (subint × channel) — hundreds of thousands of spans bloat
        # the sidecar to >100MB.  Cap to the first N annotated rows.
        TIM_ANNOT_LINES = 12
        spans, kept = [], 0
        for li, ln in enumerate(text.splitlines()):
            row = annot_tempo2_tim_line(ln, li)
            if row:
                spans.extend(row)
                kept += 1
                if kept >= TIM_ANNOT_LINES:
                    break
    elif kind == "vap":
        spans = annot_vap_table(text)
    elif kind == "psrstat":
        spans = annot_psrstat(text)
    else:
        print(f"unknown kind: {kind}", file=sys.stderr); return 2
    write_annot(out_path, spans)
    print(f"wrote {len(spans)} spans -> {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
