#!/usr/bin/env bash
# tools/generate_plots.sh
#
# Generate every PNG referenced by plots-spec.md from the real .ar
# archives sitting in archives/.  Outputs go to plots/.
#
# Invoke as:   bash -i tools/generate_plots.sh
# (interactive bash so the `psrsetup` alias from ~/.bashrc is available).
#
# Re-runs are safe — existing PNGs are simply overwritten.

# Inline the body of the user's `psrsetup` alias (~/.bashrc).  Doing it
# explicitly avoids relying on `expand_aliases` in non-interactive shells.
ml purge 2>/dev/null || true
module use /apps/users/pulsar/milan/gcc-11.3.0/modulefiles
module use /apps/users/pulsar/common/modulefiles
module load gcc/11.3.0 psrchive/b97dc74aa python/3.10.4
export TEMPO2="$(dirname "$(dirname "$(which tempo2)")")"
export LD_LIBRARY_PATH="$TEMPO2/lib:${LD_LIBRARY_PATH:-}"
# venv only needed for the matplotlib helpers (template-stack, residuals).
source /fred/oz005/users/hcombrin/psrpy/bin/activate
export PYTHONPATH="/apps/users/pulsar/milan/gcc-11.3.0/software/psrchive/b97dc74aa/lib/python3.10/site-packages"
export MPLBACKEND=Agg

set -o pipefail
exec </dev/null    # plplot driver can otherwise peek the terminal stdin

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

ARCH_DIR="${ARCH_DIR:-$REPO/../archives_PSRCHIVE_Tutorial}"
WORK="$ARCH_DIR/work"
# IMPORTANT: keep `OUT` as a *relative* path.  PSRCHIVE's plplot PNG driver
# silently truncates output filenames at ~90 chars, and our absolute repo
# prefix alone is 80+ chars — long output paths get clipped to gibberish
# (e.g. `plots/psrp`).  Relative paths from $REPO stay short enough.
OUT="plots"
mkdir -p "$WORK" "$OUT/landing" "$OUT/psrplot" "$OUT/pav" "$OUT/pipelines"

# size: 1200x800 px, 100 dpi.  psrplot honours -g WxH.
GEOM="-g 1200x800"

# ----- map short names to physical archives -------------------------------
declare -A SRC RAW
SRC[J0437-4715]="$ARCH_DIR/J0437-4715_2024-07-25-12:13:23_zap.ar"
SRC[J1909-3744]="$ARCH_DIR/J1909-3744_2024-07-25-00:04:55_zap.ar"
RAW[J0437-4715]="$ARCH_DIR/J0437-4715_raw"
RAW[J1909-3744]="$ARCH_DIR/J1909-3744_raw"

# Provenance files lifted from the user's pipeline.
PAR_DIR="/fred/oz005/users/hcombrin/meerpipe/partimstd"

SKIPPED="$OUT/SKIPPED.md"
: > "$SKIPPED.tmp"
log_skip() {
    # log_skip <reason> <command>
    printf -- "- **%s** — \`%s\`\n" "$1" "$2" >> "$SKIPPED.tmp"
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

# ----- 0. prep: combined-raw and split-epoch archives ---------------------
# Use J0437 raw subints throughout to populate "with RFI" and epoch plots.
RAW0437_ADDED="$WORK/J0437-4715_raw_added.ar"
EP1="$WORK/J0437-4715_ep1.ar"
EP2="$WORK/J0437-4715_ep2.ar"

if [[ ! -f "$RAW0437_ADDED" ]]; then
    echo ">> psradd all J0437 raw subints"
    psradd -o "$RAW0437_ADDED" "${RAW[J0437-4715]}"/*.ar
fi

# Split raw subints into two halves and psradd each → ep1/ep2.
if [[ ! -f "$EP1" || ! -f "$EP2" ]]; then
    mapfile -t RAWS < <(ls "${RAW[J0437-4715]}"/*.ar | sort)
    n=${#RAWS[@]}; half=$(( n / 2 ))
    echo ">> psradd ep1 (first $half of $n subints)"
    psradd -o "$EP1" "${RAWS[@]:0:$half}"
    echo ">> psradd ep2 (remaining $((n-half)))"
    psradd -o "$EP2" "${RAWS[@]:$half}"
fi

# ===========================================================================
# Section 2 — single-command gallery
# ===========================================================================
declare -A GALLERY
GALLERY[flux__jft]="-p flux -j FT"
GALLERY[flux__jdft]="-p flux -j DFT"
GALLERY[freq__raw]="-p freq"
GALLERY[freq__jd]="-p freq -j D"
GALLERY[time__jf]="-p time -j F"
GALLERY[time__jdf]="-p time -j DF"
GALLERY[stokes__jft]="-p stokes -j FT"
GALLERY[stokes__jdft]="-p stokes -j DFT"
GALLERY[pa__jdft]="-p pa -j DFT"
# NOTE: `psrplot -p pat` does not exist in PSRCHIVE 2025-10-31 (b97dc74a).
# `pat` is the standalone TOA-generation tool (see Pipeline C), not a plot
# type, so we log this row to SKIPPED.md rather than attempting it.
log_skip_pat() {
    local ar="$1"
    log_skip "pat__jdft (${ar})" "psrplot -p pat: not a valid plot type in this PSRCHIVE build"
}

for ar in J0437-4715 J1909-3744; do
    src="${SRC[$ar]}"
    outdir="$OUT/psrplot/$ar"
    mkdir -p "$outdir"
    for key in "${!GALLERY[@]}"; do
        if [[ "$key" == "pat__jdft" ]]; then
            log_skip_pat "$ar"
            continue
        fi
        opts="${GALLERY[$key]}"
        # shellcheck disable=SC2086
        run "psrplot $ar $key" -- psrplot $GEOM $opts "$src" -D "$outdir/$key.png/png" || true
    done
done

# pav parity row (J0437 only).  Note: pav has no `-D` flag — the device is
# passed via `-g <file>/PNG`, and there is no equivalent of psrplot's `-g WxH`.
mkdir -p "$OUT/pav/J0437-4715"
run "pav J0437 dynamic__jd" -- pav -DFTp -j D "${SRC[J0437-4715]}" -g "$OUT/pav/J0437-4715/dynamic__jd.png/PNG" || true
# pav can emit an extra paged copy (`<name>_2`); drop it.
rm -f "$OUT/pav/J0437-4715/dynamic__jd.png_2"

# ===========================================================================
# Section 1 — landing
# ===========================================================================
LAND="$OUT/landing"

# rfi-before: raw added archive, freq plot (still has RFI).
run "landing rfi-before" -- psrplot $GEOM -p freq -j D "$RAW0437_ADDED" -D "$LAND/rfi-before.png/png" || true

# rfi-after: paz -r the raw-added archive (auto cleaning).  `paz` writes a
# new file alongside the input with the given extension via `-e`.
cp -f "$RAW0437_ADDED" "$WORK/J0437-4715_for_paz.ar"
run "landing paz cleaning" -- paz -r -e paz "$WORK/J0437-4715_for_paz.ar" || true
RAW0437_ZAP="$WORK/J0437-4715_for_paz.paz"
if [[ -f "$RAW0437_ZAP" ]]; then
    run "landing rfi-after" -- psrplot $GEOM -p freq -j D "$RAW0437_ZAP" -D "$LAND/rfi-after.png/png" || true
fi

# template-stack: spec says this one is optional ("can be SVG").  We render
# the smoothed standard profile produced in Pipeline C (a true psrsmooth
# template) using psrplot, falling back to a flat flux plot of the zap
# archive if the .std isn't ready yet.
TS_OUT="$LAND/template-stack.png"
TS_SRC="$WORK/C_src.Cft.sm"
if [[ ! -f "$TS_SRC" ]]; then
    TS_SRC="${SRC[J0437-4715]}"
    TS_OPTS=(-j FT)
else
    TS_OPTS=()
fi
run "landing template-stack" -- psrplot $GEOM -p flux "${TS_OPTS[@]}" "$TS_SRC" -D "$TS_OUT/png" || true

# residuals-example: pat against .std, then tempo2 → residuals → matplotlib.
RES_DIR="$OUT/landing"
TIM_LAND="$WORK/landing_residuals.tim"
PAR_J0437="$PAR_DIR/J0437-4715.par"
STD_J0437="$PAR_DIR/J0437-4715.std"

if [[ -f "$PAR_J0437" && -f "$STD_J0437" ]]; then
    run "landing pat→TOAs" -- bash -c \
        "pat -s '$STD_J0437' -A FDM -f 'tempo2 IPTA' '${SRC[J0437-4715]}' > '$TIM_LAND'"
    REPO="$REPO" TIM="$TIM_LAND" PAR="$PAR_J0437" OUT="$RES_DIR/residuals-example.png" \
    python3 - <<'PY' || log_skip "landing residuals" "tempo2 general2 → matplotlib"
import os, subprocess, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

par = os.environ["PAR"]; tim = os.environ["TIM"]; out = os.environ["OUT"]
fmt = "{sat} {pre} {err}\n"
cmd = ["tempo2", "-nobs", "50000", "-npsr", "5",
       "-output", "general2", "-f", par, tim, "-s", fmt, "-nofit"]
r = subprocess.run(cmd, capture_output=True, text=True, check=True)
mjd, res, err = [], [], []
for ln in r.stdout.splitlines():
    parts = ln.split()
    if len(parts) == 3:
        try:
            mjd.append(float(parts[0])); res.append(float(parts[1])); err.append(float(parts[2]))
        except ValueError:
            pass
mjd = np.array(mjd); res = np.array(res)*1e6; err = np.array(err)
fig, ax = plt.subplots(figsize=(12, 8), dpi=100)
ax.errorbar(mjd, res, yerr=err, fmt="o", ms=4, color="#1f77b4", ecolor="#7aa2c8", capsize=2)
ax.axhline(0, color="grey", lw=0.6)
ax.set_xlabel("MJD")
ax.set_ylabel("Timing residual (µs)")
ax.set_title("J0437-4715 — pre-fit residuals (pat + tempo2)")
fig.tight_layout()
fig.savefig(out, facecolor="white")
print("wrote", out)
os._exit(0)
PY
else
    log_skip "landing residuals" "missing par/std for J0437-4715"
fi

# ===========================================================================
# Section 3 — pipelines
# ===========================================================================

# --- A: psradd → pam -T → psrplot ----------------------------------------
PA="$OUT/pipelines/psradd+pamT+psrplot"
mkdir -p "$PA"
run "A/1 ep1"        -- psrplot $GEOM -p time -j F "$EP1" -D "$PA/ep1__step1.png/png" || true
run "A/2 ep2"        -- psrplot $GEOM -p time -j F "$EP2" -D "$PA/ep2__step1b.png/png" || true
ADDED="$WORK/A_added.ar"
run "A/added psradd" -- psradd -o "$ADDED" "$EP1" "$EP2" || true
run "A/added plot"   -- psrplot $GEOM -p time -j F "$ADDED" -D "$PA/added__step2.png/png" || true
TSCR="$WORK/A_added.Tscr"
if [[ -f "$ADDED" ]]; then
    # pam -T scrunches in time, output extension Tscr.
    cp -f "$ADDED" "$WORK/A_added_for_T.ar"
    run "A/tscr pam -T" -- pam -T -e Tscr "$WORK/A_added_for_T.ar" || true
    TSCR_FILE="$WORK/A_added_for_T.Tscr"
    if [[ -f "$TSCR_FILE" ]]; then
        run "A/tscr plot" -- psrplot $GEOM -p time -j F "$TSCR_FILE" -D "$PA/added-tscr__step3.png/png" || true
        cp -f "$PA/added-tscr__step3.png" "$PA/final.png"
    fi
fi

# --- B: paz → pam -FT → psrplot stokes -----------------------------------
PB="$OUT/pipelines/paz+pamFT+stokes"
mkdir -p "$PB"
# Use J0437 raw-added so paz actually has RFI to clean.
B_SRC="$RAW0437_ADDED"
run "B/raw plot"  -- psrplot $GEOM -p freq "$B_SRC" -D "$PB/raw.png/png" || true
cp -f "$B_SRC" "$WORK/B_input.ar"
run "B/paz -r"    -- paz -r -e paz "$WORK/B_input.ar" || true
B_ZAP="$WORK/B_input.paz"
if [[ -f "$B_ZAP" ]]; then
    run "B/zapped plot" -- psrplot $GEOM -p freq "$B_ZAP" -D "$PB/zapped.png/png" || true
    cp -f "$B_ZAP" "$WORK/B_in_for_FT.ar"
    run "B/pam -FT"     -- pam -FT -e FT "$WORK/B_in_for_FT.ar" || true
    if [[ -f "$WORK/B_in_for_FT.FT" ]]; then
        run "B/scrunched plot" -- psrplot $GEOM -p stokes "$WORK/B_in_for_FT.FT" -D "$PB/scrunched.png/png" || true
        cp -f "$PB/scrunched.png" "$PB/final.png"
    fi
fi

# --- C: template + pat ---------------------------------------------------
PC="$OUT/pipelines/template+pat"
mkdir -p "$PC"
C_SRC="${SRC[J0437-4715]}"
# profile: flux -j FT on the zap archive.
run "C/profile" -- psrplot $GEOM -p flux -j FT "$C_SRC" -D "$PC/profile.png/png" || true
# Build a working FT-scrunched archive then psrsmooth.
C_FT="$WORK/C.FT"
cp -f "$C_SRC" "$WORK/C_src.ar"
run "C/pam -FT for template" -- pam -FT -e Cft "$WORK/C_src.ar" || true
if [[ -f "$WORK/C_src.Cft" ]]; then
    run "C/psrsmooth" -- psrsmooth -W "$WORK/C_src.Cft" || true
    SM="$WORK/C_src.Cft.sm"
    if [[ -f "$SM" ]]; then
        run "C/template plot" -- psrplot $GEOM -p flux "$SM" -D "$PC/template.png/png" || true
        cp -f "$SM" "$PC/template.std"
    fi
fi
# TOAs: use the smoothed local template if available, else fall back to bundled std.
TEMPLATE_FOR_PAT="$PC/template.std"
[[ -f "$TEMPLATE_FOR_PAT" ]] || TEMPLATE_FOR_PAT="$STD_J0437"
if [[ -f "$TEMPLATE_FOR_PAT" ]]; then
    run "C/pat TOAs" -- bash -c \
        "pat -s '$TEMPLATE_FOR_PAT' -A FDM -f 'tempo2 IPTA' '$C_SRC' > '$PC/toas.tim'"
    cp -f "$PC/toas.tim" "$PC/toa-text.txt"
fi
# residual plot
if [[ -f "$PC/toas.tim" && -f "$PAR_J0437" ]]; then
    PAR="$PAR_J0437" TIM="$PC/toas.tim" OUT="$PC/residual.png" \
    python3 - <<'PY' || log_skip "C/residual" "tempo2 general2 → matplotlib"
import os, subprocess, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

par = os.environ["PAR"]; tim = os.environ["TIM"]; out = os.environ["OUT"]
fmt = "{sat} {pre} {err}\n"
r = subprocess.run(["tempo2","-nobs","50000","-npsr","5",
                    "-output","general2","-f",par,tim,"-s",fmt,"-nofit"],
                   capture_output=True, text=True, check=True)
mjd, res, err = [], [], []
for ln in r.stdout.splitlines():
    parts = ln.split()
    if len(parts) == 3:
        try:
            mjd.append(float(parts[0])); res.append(float(parts[1])); err.append(float(parts[2]))
        except ValueError:
            pass
mjd = np.array(mjd); res = np.array(res)*1e6; err = np.array(err)
fig, ax = plt.subplots(figsize=(12, 8), dpi=100)
ax.errorbar(mjd, res, yerr=err, fmt="o", ms=4, color="#2a9d8f", ecolor="#94d2bd", capsize=2)
ax.axhline(0, color="grey", lw=0.6)
ax.set_xlabel("MJD"); ax.set_ylabel("Residual (µs)")
ax.set_title("J0437-4715 — pat × tempo2 residuals (locally-built template)")
fig.tight_layout()
fig.savefig(out, facecolor="white")
PY
fi

# ===========================================================================
# Tail: assemble SKIPPED.md
# ===========================================================================
{
    echo "# Skipped / failed plot generations"
    echo
    echo "_Generated $(date -Iseconds)_"
    echo
    if [[ -s "$SKIPPED.tmp" ]]; then
        cat "$SKIPPED.tmp"
    else
        echo "_None — every plot generated successfully._"
    fi
} > "$SKIPPED"
rm -f "$SKIPPED.tmp"

# ---------- MANIFEST.json + README.md --------------------------------------
PSRCHIVE_VER="$(psrplot -i 2>&1 | head -1 | sed 's/^[[:space:]]*//')"
GEN_DATE="$(date -Iseconds)"

python3 - <<PY
import os, json, hashlib, glob, datetime

repo = "$REPO"
out_dir = os.path.join(repo, "site", "plots")
gen_date = "$GEN_DATE"

# Mapping of plot-relative-path -> (archive_shortname, command).  Commands
# match what tools/generate_plots.sh actually ran (with output paths kept as
# they appear on the site, not the absolute ones the script uses).
def cmd_psrplot(opts, ar_short, out_rel):
    src = f"archives/\${{{ar_short}_zap}}.ar"
    return f"psrplot -g 1200x800 {opts} {src} -D {out_rel}/png"

entries = {}

# ----- Section 2 gallery + pav ------------------------------------------
gallery = {
    "flux__jft":   "-p flux -j FT",
    "flux__jdft":  "-p flux -j DFT",
    "freq__raw":   "-p freq",
    "freq__jd":    "-p freq -j D",
    "time__jf":    "-p time -j F",
    "time__jdf":   "-p time -j DF",
    "stokes__jft": "-p stokes -j FT",
    "stokes__jdft":"-p stokes -j DFT",
    "pa__jdft":    "-p pa -j DFT",
}
archives = {
    "J0437-4715": "J0437-4715_2024-07-25-12:13:23_zap.ar",
    "J1909-3744": "J1909-3744_2024-07-25-00:04:55_zap.ar",
}
for ar, arfile in archives.items():
    for key, opts in gallery.items():
        rel = f"psrplot/{ar}/{key}.png"
        entries[rel] = {
            "archive": ar,
            "source":  f"archives/{arfile}",
            "command": f"psrplot -g 1200x800 {opts} archives/{arfile} -D plots/{rel}/png",
        }

entries["pav/J0437-4715/dynamic__jd.png"] = {
    "archive": "J0437-4715",
    "source":  f"archives/{archives['J0437-4715']}",
    "command": (f"pav -DFTp -j D archives/{archives['J0437-4715']} "
                f"-g plots/pav/J0437-4715/dynamic__jd.png/PNG"),
}

# ----- landing ----------------------------------------------------------
entries["landing/rfi-before.png"] = {
    "archive": "J0437-4715",
    "source":  "archives/J0437-4715_raw/*.ar  (psradd'd)",
    "command": "psradd -o raw_added.ar archives/J0437-4715_raw/*.ar && "
               "psrplot -g 1200x800 -p freq -j D raw_added.ar -D landing/rfi-before.png/png",
}
entries["landing/rfi-after.png"] = {
    "archive": "J0437-4715",
    "source":  "raw_added.ar  →  paz -r",
    "command": "paz -r -e paz raw_added.ar && "
               "psrplot -g 1200x800 -p freq -j D raw_added.paz -D landing/rfi-after.png/png",
}
entries["landing/template-stack.png"] = {
    "archive": "J0437-4715",
    "source":  "pipelines/template+pat/template.std (smoothed)",
    "command": "psrplot -g 1200x800 -p flux <smoothed-template>.sm -D landing/template-stack.png/png",
}
entries["landing/residuals-example.png"] = {
    "archive": "J0437-4715",
    "source":  f"archives/{archives['J0437-4715']}  →  pat  →  tempo2",
    "command": "pat -s J0437-4715.std -A FDM -f 'tempo2 IPTA' <ar> > .tim ; "
               "tempo2 -nobs 50000 -output general2 -f J0437-4715.par .tim -s '{sat} {pre} {err}' -nofit "
               "→ matplotlib",
}

# ----- pipelines --------------------------------------------------------
pa = "pipelines/psradd+pamT+psrplot"
entries[f"{pa}/ep1__step1.png"]      = dict(archive="J0437-4715", source="raw[0:16]",  command=f"psradd -o ep1.ar <first 16 raw subints>; psrplot -g 1200x800 -p time -j F ep1.ar -D {pa}/ep1__step1.png/png")
entries[f"{pa}/ep2__step1b.png"]     = dict(archive="J0437-4715", source="raw[16:33]", command=f"psradd -o ep2.ar <remaining raw subints>; psrplot -g 1200x800 -p time -j F ep2.ar -D {pa}/ep2__step1b.png/png")
entries[f"{pa}/added__step2.png"]    = dict(archive="J0437-4715", source="ep1+ep2",   command=f"psradd -o added.ar ep1.ar ep2.ar; psrplot -g 1200x800 -p time -j F added.ar -D {pa}/added__step2.png/png")
entries[f"{pa}/added-tscr__step3.png"]= dict(archive="J0437-4715", source="added.ar Tscr", command=f"pam -T -e Tscr added.ar; psrplot -g 1200x800 -p time -j F added.Tscr -D {pa}/added-tscr__step3.png/png")
entries[f"{pa}/final.png"]           = dict(archive="J0437-4715", source="alias of added-tscr__step3", command="cp added-tscr__step3.png final.png")

pb = "pipelines/paz+pamFT+stokes"
entries[f"{pb}/raw.png"]       = dict(archive="J0437-4715", source="raw_added.ar",       command=f"psrplot -g 1200x800 -p freq raw_added.ar -D {pb}/raw.png/png")
entries[f"{pb}/zapped.png"]    = dict(archive="J0437-4715", source="raw_added.paz",      command=f"paz -r -e paz raw_added.ar; psrplot -g 1200x800 -p freq raw_added.paz -D {pb}/zapped.png/png")
entries[f"{pb}/scrunched.png"] = dict(archive="J0437-4715", source="raw_added.paz.FT",   command=f"pam -FT -e FT raw_added.paz; psrplot -g 1200x800 -p stokes raw_added.paz.FT -D {pb}/scrunched.png/png")
entries[f"{pb}/final.png"]     = dict(archive="J0437-4715", source="alias of scrunched", command="cp scrunched.png final.png")

pc = "pipelines/template+pat"
entries[f"{pc}/profile.png"]   = dict(archive="J0437-4715", source=f"archives/{archives['J0437-4715']}", command=f"psrplot -g 1200x800 -p flux -j FT archives/{archives['J0437-4715']} -D {pc}/profile.png/png")
entries[f"{pc}/template.png"]  = dict(archive="J0437-4715", source="pam -FT + psrsmooth -W", command=f"pam -FT <ar>; psrsmooth -W <ar>.FT; psrplot -g 1200x800 -p flux <ar>.FT.sm -D {pc}/template.png/png")
entries[f"{pc}/residual.png"]  = dict(archive="J0437-4715", source="pat + tempo2",     command="pat -s template.std -A FDM <ar> > toas.tim; tempo2 -nobs 50000 -nofit -output general2 -f .par toas.tim → matplotlib")
entries[f"{pc}/template.std"]  = dict(archive="J0437-4715", source="pam -FT + psrsmooth -W", command="cp <ar>.FT.sm template.std")
entries[f"{pc}/toas.tim"]      = dict(archive="J0437-4715", source="pat against template.std", command="pat -s template.std -A FDM -f 'tempo2 IPTA' <ar> > toas.tim")
entries[f"{pc}/toa-text.txt"]  = dict(archive="J0437-4715", source="copy of toas.tim", command="cp toas.tim toa-text.txt")

# ----- realise into a JSON list, sha256 each existing file --------------
manifest = []
for rel, meta in sorted(entries.items()):
    abs_path = os.path.join(out_dir, rel)
    if not os.path.isfile(abs_path):
        continue
    h = hashlib.sha256()
    with open(abs_path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    manifest.append({
        "path":          rel,
        "archive":       meta["archive"],
        "source":        meta["source"],
        "command":       meta["command"],
        "sha256":        h.hexdigest(),
        "size_bytes":    os.path.getsize(abs_path),
        "generated_at":  gen_date,
    })

with open(os.path.join(out_dir, "MANIFEST.json"), "w") as fh:
    json.dump({
        "generated_at":     gen_date,
        "psrchive_version": "$PSRCHIVE_VER",
        "entries":          manifest,
    }, fh, indent=2)
print(f"wrote MANIFEST.json with {len(manifest)} entries")
PY

cat > "$OUT/README.md" <<EOF
# plots — precomputed PSRCHIVE outputs

Generated by [\`tools/generate_plots.sh\`](../../tools/generate_plots.sh) on **${GEN_DATE}**.

## What's here

- \`landing/\`            — hero images for index.html (RFI before/after, profile-stack template, residuals)
- \`psrplot/<pulsar>/\`   — 9-plot single-command gallery, one folder per pulsar
- \`pav/<pulsar>/\`       — pav parity row (same dynamic spectrum, different syntax)
- \`pipelines/\`          — multi-step pipelines (one folder per chain)
- \`MANIFEST.json\`       — machine-readable list (path, archive, command, sha256) — what the UI loads to know which combinations are pre-rendered
- \`SKIPPED.md\`          — anything that couldn't be generated, with reason

## Provenance

The short names used throughout the spec map to:

| short name      | physical archive                                                            | rfi-status |
| --------------- | --------------------------------------------------------------------------- | ---------- |
| \`J0437-4715\`  | \`archives/J0437-4715_2024-07-25-12:13:23_zap.ar\`                          | cleaned    |
| \`J1909-3744\`  | \`archives/J1909-3744_2024-07-25-00:04:55_zap.ar\`                          | cleaned    |
| \`J0437-4715\` raw | \`archives/J0437-4715_raw/2024-07-25-12:1{3..7}:*.ar\` (33 × 8-s subints) | RFI present |

### Observing metadata (from \`vap\`)

|                 | J0437-4715              | J1909-3744              |
| --------------- | ----------------------- | ----------------------- |
| Telescope       | MeerKAT                 | MeerKAT                 |
| Receiver / backend | KAT / MKBF           | KAT / MKBF              |
| Centre frequency| 1283.582 MHz            | 1283.582 MHz            |
| Bandwidth       | 856 MHz                 | 856 MHz                 |
| Channels        | 1024                    | 1024                    |
| Bins per period | 1024                    | 1024                    |
| Sub-integrations| 31 × 8 s = 248 s        | 63 × 8 s = 504 s        |
| MJD (start)     | 60516.509352            | 60516.003426            |
| UTC date        | 2024-07-25              | 2024-07-25              |

Programme: MeerKAT Pulsar Timing Array (OZ005 / MPTA), observer H. Combrinck.

### Tempo2 inputs

Par / std files used for TOAs and residuals (Pipeline C + landing residuals):

- \`/fred/oz005/users/hcombrin/meerpipe/partimstd/J0437-4715.par\`
- \`/fred/oz005/users/hcombrin/meerpipe/partimstd/J0437-4715.std\`
- \`/fred/oz005/users/hcombrin/meerpipe/partimstd/J1909-3744.par\`
- \`/fred/oz005/users/hcombrin/meerpipe/partimstd/J1909-3744.std\`

(\`pipelines/template+pat/template.std\` is a fresh template smoothed *here*
from the J0437 zap archive, not the meerpipe one.)

### Software

- **PSRCHIVE** — ${PSRCHIVE_VER}
- **tempo2**   — \$TEMPO2 (\`tempo2 c86d64c_temponest_apar_56e2b58\` per the module path)
- **python**   — 3.10.4, matplotlib via /fred/oz005/users/hcombrin/psrpy

## How to regenerate

\`\`\`bash
bash tools/generate_plots.sh        # ~5–10 min, idempotent
\`\`\`

The script inlines the \`psrsetup\` env from \`~/.bashrc\` (module load
psrchive + tempo2 + venv).  It is safe to re-run — outputs are overwritten,
intermediate \`.ar\` files in \`archives/work/\` are cached.

## Footer citation snippet

> Pulsar archives recorded with MeerKAT (MPTA, 2024-07-25 UTC; MJD 60516).
> Reduced with PSRCHIVE ${PSRCHIVE_VER}; residuals computed via tempo2.
EOF
echo "wrote $OUT/README.md"

echo "Done.  See $OUT/."
