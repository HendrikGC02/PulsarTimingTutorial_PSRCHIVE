#!/usr/bin/env bash
# tools/gen/_common.sh — shared setup for the new generator scripts.
#
# Source this from each tools/gen/generate_*.sh.  It mirrors the prologue of
# tools/generate_plots.sh (module load, archive paths, geometry) and adds an
# append_manifest helper that appends one entry to plots/MANIFEST.json
# without rewriting the existing entries.

# --- module / environment setup (same as generate_plots.sh) ----------------
ml purge 2>/dev/null || true
module use /apps/users/pulsar/milan/gcc-11.3.0/modulefiles 2>/dev/null || true
module use /apps/users/pulsar/common/modulefiles 2>/dev/null || true
module load gcc/11.3.0 psrchive/b97dc74aa python/3.10.4 2>/dev/null || true
export TEMPO2="${TEMPO2:-$(dirname "$(dirname "$(which tempo2 2>/dev/null)")" 2>/dev/null)}"
[[ -d "${TEMPO2:-}" ]] && export LD_LIBRARY_PATH="$TEMPO2/lib:${LD_LIBRARY_PATH:-}"
# venv only needed for python helpers below (annotation extraction)
[[ -f /fred/oz005/users/hcombrin/psrpy/bin/activate ]] && source /fred/oz005/users/hcombrin/psrpy/bin/activate
export MPLBACKEND=Agg

set -o pipefail
exec </dev/null

# REPO points at the site root (parent of tools/).
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

# Where the real .ar files live.  Override via env if needed.
ARCH_DIR="${ARCH_DIR:-$REPO/../archives_PSRCHIVE_Tutorial}"
WORK="$ARCH_DIR/work"
OUT="plots"
mkdir -p "$WORK" "$OUT"

# Short-name → physical archive (cleaned + calibrated, single-file).
declare -A SRC
SRC[J0437-4715]="$ARCH_DIR/J0437-4715_2024-07-25-12:13:23_zap.ar"
SRC[J1909-3744]="$ARCH_DIR/J1909-3744_2024-07-25-00:04:55_zap.ar"

# Standard plot geometry — match the rest of the gallery.
GEOM="-g 1200x800"

# SKIPPED log.  Each script appends, the user pipes through `sort -u` later.
SKIPPED="$OUT/SKIPPED.md"
log_skip() {
    # log_skip <reason> <command>
    printf -- "- **%s** — \`%s\`\n" "$1" "$2" >> "$SKIPPED"
}

run() {
    # run "<label>" -- <command...>
    local label="$1"; shift
    [[ "${1-}" == "--" ]] && shift
    echo ">> $label"
    if ! "$@"; then
        log_skip "$label failed" "$*"
        return 1
    fi
}

# append_manifest <path> <archive> <source> <command>
# Adds a JSON entry to plots/MANIFEST.json's "entries" array.  Uses python so
# we don't shell-escape JSON ourselves.  Idempotent: replaces any existing
# entry with the same path.
append_manifest() {
    local path="$1" archive="$2" source="$3" command="$4"
    python3 - "$path" "$archive" "$source" "$command" <<'PY'
import json, os, sys, hashlib, datetime
path, archive, source, command = sys.argv[1:5]
abs_path = os.path.join("plots", path)
manifest_path = os.path.join("plots", "MANIFEST.json")
if os.path.exists(manifest_path):
    with open(manifest_path) as f: M = json.load(f)
else:
    M = {"generated_at": datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
         "psrchive_version": os.popen("vap --version 2>&1 | head -1").read().strip(),
         "entries": []}
if not os.path.exists(abs_path):
    print(f"  (skip manifest: file missing — {abs_path})", file=sys.stderr); sys.exit(0)
with open(abs_path, "rb") as f: data = f.read()
entry = {
    "path": path, "archive": archive, "source": source, "command": command,
    "sha256": hashlib.sha256(data).hexdigest(),
    "size_bytes": len(data),
    "generated_at": datetime.datetime.now().astimezone().isoformat(timespec='seconds'),
}
M["entries"] = [e for e in M["entries"] if e.get("path") != path]
M["entries"].append(entry)
M["entries"].sort(key=lambda e: e["path"])
with open(manifest_path, "w") as f: json.dump(M, f, indent=2)
print(f"  manifest: + {path}")
PY
}
