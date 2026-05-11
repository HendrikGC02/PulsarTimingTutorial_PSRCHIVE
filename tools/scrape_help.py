#!/usr/bin/env python3
"""
Scrape `<command> --help` output from a live PSRCHIVE install and merge it into
site/data/commands.json, preserving the hand-written `desc`, `long`,
`examples`, and `related` fields.

Run inside a container/environment where PSRCHIVE binaries are on $PATH.

Usage:
    python3 tools/scrape_help.py [--out site/data/commands.json]
"""
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "data" / "commands.json"

# Where the prose/examples/related fields are authored. The parser preserves
# everything in `commands[].{desc, long, examples, related}` exactly, and
# rewrites `flags`, `usage`, and `help_raw` from the live --help output.
HAND_FIELDS = ("desc", "long", "examples", "related")


def psrchive_version() -> str:
    try:
        out = subprocess.run(
            ["vap", "--version"], capture_output=True, text=True, timeout=10
        )
        return (out.stdout + out.stderr).strip().splitlines()[0]
    except Exception:
        return "unknown"


def help_text(cmd: str) -> str:
    """Try -h then --help then -help. Returns raw text or '' on failure."""
    if not shutil.which(cmd):
        return ""
    for flag in ("-h", "--help", "-help"):
        try:
            r = subprocess.run([cmd, flag], capture_output=True, text=True, timeout=10)
            text = (r.stdout or "") + "\n" + (r.stderr or "")
            if text.strip():
                return text
        except Exception:
            continue
    return ""


FLAG_RE = re.compile(
    r"""^\s+                  # leading whitespace
        (-{1,2}[A-Za-z][\w-]*) # the flag itself
        (?:\s+[A-Za-z<\[][^\s]*)?  # optional metavar
        \s{2,}                # 2+ spaces separates flag from description
        (.+)$                 # description
    """,
    re.VERBOSE,
)


def parse_flags(text: str) -> list[dict]:
    """
    Very forgiving flag-line parser. PSRCHIVE help output is not uniform —
    some commands use getopt-style, some hand-roll their own table.
    We look for lines beginning with whitespace and a `-x` or `--xxx`.
    """
    flags = []
    seen = set()
    for line in text.splitlines():
        m = FLAG_RE.match(line)
        if not m:
            continue
        k, v = m.group(1).strip(), m.group(2).strip()
        if k in seen:
            continue
        seen.add(k)
        flags.append({"k": k, "v": v})
    return flags


def parse_usage(text: str, cmd: str) -> str:
    """Find a `Usage:` line, fall back to first line that starts with the cmd."""
    for line in text.splitlines():
        s = line.strip()
        if s.lower().startswith("usage:"):
            return s.split(":", 1)[1].strip()
    for line in text.splitlines():
        s = line.strip()
        if s.startswith(cmd + " "):
            return s
    return cmd


def merge(seed: dict) -> dict:
    out = dict(seed)
    meta = dict(out.get("_meta", {}))
    meta["source"] = "scrape_help.py"
    meta["generated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    meta["psrchive_version"] = psrchive_version()
    out["_meta"] = meta

    new_cmds = []
    for cmd in out.get("commands", []):
        name = cmd["name"]
        live = help_text(name)
        merged = {k: cmd.get(k) for k in HAND_FIELDS if cmd.get(k) is not None}
        merged["name"] = name
        merged["cat"] = cmd["cat"]
        if live:
            merged["usage"] = parse_usage(live, name)
            merged["flags"] = parse_flags(live) or cmd.get("flags", [])
            merged["help_raw"] = live
            merged["help_available"] = True
        else:
            # binary not installed in this environment — keep seed fields
            merged["usage"] = cmd.get("usage", name)
            merged["flags"] = cmd.get("flags", [])
            merged["help_available"] = False
        new_cmds.append(merged)
    out["commands"] = new_cmds
    return out


def main() -> int:
    out_path = DEFAULT_OUT
    if "--out" in sys.argv:
        out_path = Path(sys.argv[sys.argv.index("--out") + 1])

    with open(out_path, "r", encoding="utf-8") as f:
        seed = json.load(f)

    merged = merge(seed)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2)
        f.write("\n")

    installed = sum(1 for c in merged["commands"] if c.get("help_available"))
    total = len(merged["commands"])
    print(
        f"Wrote {out_path} · {installed}/{total} commands had a live --help in this env"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
