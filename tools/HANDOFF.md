# Handoff to the Claude Code agent with PSRCHIVE access

You are picking up where the previous Claude Code session left off.  That
session expanded the tutorial's interactive playground (`try-it.html`) to
cover **many more PSRCHIVE commands**, including text-output ones (`vap`,
`psrstat`, `pat`).  It could not run PSRCHIVE itself — that's your job.

Your goal: run the seven small generator scripts under `tools/gen/` against
a real PSRCHIVE install + the two reference archives, fix anything that
breaks, and confirm the playground stops saying "not precomputed" for the
new commands.

## TL;DR — happy path

```bash
cd PulsarTimingTutorial_PSRCHIVE
bash -i tools/gen/generate_pav.sh
bash -i tools/gen/generate_pam_scrunches.sh
bash -i tools/gen/generate_paz_variants.sh
bash -i tools/gen/generate_vap_outputs.sh
bash -i tools/gen/generate_psrstat_outputs.sh
bash -i tools/gen/generate_psradd_meta.sh
bash -i tools/gen/generate_pat_tim.sh
python -m json.tool plots/MANIFEST.json > /dev/null    # sanity
python -m http.server 8000                              # open try-it.html
```

The scripts are **idempotent** — re-running is safe.  Each appends entries
to `plots/MANIFEST.json` and logs anything it had to skip into
`plots/SKIPPED.md`.

## Prerequisites

- PSRCHIVE binaries on `$PATH`: `pav`, `pam`, `paz`, `psradd`, `psrplot`,
  `psrsmooth`, `psrstat`, `vap`, `psredit`, `pat`.
- The two reference archives reachable from `$ARCH_DIR` (defaults to
  `../archives_PSRCHIVE_Tutorial/`, override via env var):
  - `J0437-4715_2024-07-25-12:13:23_zap.ar`
  - `J1909-3744_2024-07-25-00:04:55_zap.ar`
- Python 3.10+ (already on `$PATH` via the module load in `_common.sh`).
- tempo2 is **not** required — none of the new artifacts produce residual
  plots.  The existing `pipelines/template+pat/residual.png` was generated
  by `tools/generate_plots.sh` and is left untouched.

`tools/gen/_common.sh` handles module load, archive paths, and the
manifest-append helper.  All seven scripts source it.

## What each script produces

| Script | Artifacts | Filename pattern under `plots/` |
| --- | --- | --- |
| `generate_pav.sh` | 4 PNGs × 2 archives | `pav/<ar>/{profile,dynamic,stack,stokes}__j*.png` |
| `generate_pam_scrunches.sh` | 8 PNGs + 8 .meta.txt + .meta.annot.json each, × 2 archives | `pam/<ar>/{fscrunch,tscrunch,bscrunch}-<N>.{png,meta.txt,meta.annot.json}` |
| `generate_paz_variants.sh` | 4 PNGs × 2 archives | `paz/<ar>/{auto,manual-chans,freqrange,badsub}.png` |
| `generate_vap_outputs.sh` | 2 .txt + .annot.json × 2 archives | `vap/<ar>/{header,all}.{txt,annot.json}` |
| `generate_psrstat_outputs.sh` | 2 .txt + .annot.json × 2 archives | `psrstat/<ar>/{snr,profile}.{txt,annot.json}` |
| `generate_psradd_meta.sh` | 1 .meta.txt + .annot.json × 2 archives | `psradd/<ar>/combine.meta.{txt,annot.json}` |
| `generate_pat_tim.sh` | 1 .tim + .annot.json × 2 archives | `pat/<ar>/toas.{tim,annot.json}` |

**These exact filenames are what the website asks for.**  The UI builds
them from `scripts/tryit.jsx`'s `CATALOG` — search for the artifact `path`
field in that file to see the calling code.

## Filename schema (extension of `plots-spec.md`)

```
plots/<command>/<archive>/<descriptor>.{png,txt}
plots/<command>/<archive>/<descriptor>.annot.json   ← sidecar for .txt
plots/<command>/<archive>/<descriptor>.meta.txt     ← post-op vap summary
plots/<command>/<archive>/<descriptor>.meta.annot.json
plots/pipelines/<chain-id>/...                       ← unchanged
```

Rules from `plots-spec.md` still apply: PNGs are 1200×800, archives use
short-name (`J0437-4715`, not full filename), no `plots/` prefix in
manifest entries.

## .annot.json format

```json
{
  "version": 1,
  "spans": [
    {"line": 0, "start": 0,  "end": 24, "label": "archive filename", "kind": "filename"},
    {"line": 0, "start": 25, "end": 32, "label": "centre freq (MHz)", "kind": "frequency"},
    {"line": 0, "start": 33, "end": 51, "label": "MJD of TOA",        "kind": "mjd"},
    {"line": 0, "start": 52, "end": 56, "label": "1σ TOA error (μs)", "kind": "error"},
    {"line": 0, "start": 57, "end": 64, "label": "observatory code",  "kind": "observatory"}
  ]
}
```

- `line` is 0-indexed.
- `start`/`end` are byte offsets into the corresponding line in the .txt
  file.  Get them by running the real command and **column-counting** —
  do not hand-author.
- `kind` drives a colour swatch and group in the website's tooltip
  legend.  Recognised: `filename`, `frequency`, `mjd`, `error`,
  `observatory`, `flag`, `field`.  New kinds fall back to a neutral
  colour.

The Python helper at `tools/gen/_annot_helpers.py` does all the
column-counting for the three formats that matter — `tim`, `vap`,
`psrstat`.  The scripts already call it.

## When something fails

1. The bad command is appended to `plots/SKIPPED.md` with the exact
   invocation.  Look there first.
2. Common failure modes:
   - **plplot PNG truncates the filename** — the existing
     `generate_plots.sh` explains this (long absolute paths get clipped to
     ~90 chars).  Run from the repo root and use the relative `plots/`
     prefix, exactly like `_common.sh` does.
   - **`vap -c "..."` field unknown** — the field list changes between
     PSRCHIVE versions.  Run `vap -h` to see the supported keys and adjust
     the script's `-c "..."` strings (the website pulls the column labels
     from the header row, so it will adapt automatically).
   - **`psredit -c "sub:start=..."` not supported** — `generate_psradd_meta.sh`
     uses this to fake two epochs from a single archive.  If your build
     doesn't support sub-range editing, just `cp $src $WORK/<ar>.ep1.ar`
     and `cp $src $WORK/<ar>.ep2.ar` to produce a trivial demo (the
     output is the metadata, not the data, so identical inputs are fine
     for teaching).
   - **`pat` template missing** — `generate_pat_tim.sh` falls back to
     building one on the fly from the J0437 archive.  If even that fails,
     point `TEMPLATE` at an existing `.std` you have access to.
3. If a script fails *partway*, you can re-run it — every step is
   guarded by `[[ -f ... ]]` and the manifest helper overwrites in-place.

## Verification

After each script, the playground should stop showing "not precomputed"
banners for the corresponding catalog entry.  Step-by-step:

1. `python -m http.server 8000` from the repo root.
2. Open `http://localhost:8000/try-it.html`.
3. In the workspace bar, click **mode: other cmd** to enter catalog mode.
4. Click each sidebar entry under INSPECT / PLOT / CLEAN / SCRUNCH /
   TIMING and confirm the output panel renders:
   - **Image artifacts** (pav, paz, pam) — the PNG appears.
   - **Text artifacts** (vap, psrstat, psradd-meta) — monospace text
     appears with column underlines on hover.
   - **Annotated artifacts** (pat .tim) — same, plus a "what the columns
     mean" panel below the text.
5. Click the **pipeline** mode → "vap → paz → pam → psrsmooth → pat"
   and walk through its 5 steps; the first and last are text-output
   (vap header, .tim) and the middle three are images.

### Eyeball the annotations

For each `.annot.json` you wrote, open the corresponding `.txt` and slice
it with the first span's `start`/`end` — the result should make obvious
sense (e.g. "the frequency span really is the frequency column").  The
helper does this correctly by construction but a quick spot-check guards
against PSRCHIVE-version-specific column-width drift.

```bash
python3 - <<'PY'
import json
spans = json.load(open("plots/pat/J0437-4715/toas.annot.json"))["spans"]
tim   = open("plots/pat/J0437-4715/toas.tim").readlines()
for s in spans[:6]:
    print(f"{s['kind']:14}  {tim[s['line']][s['start']:s['end']]!r}")
PY
```

## What you must NOT do

- **Do not stub missing files.**  If `pav` segfaults on `J1909-3744`, log
  to `SKIPPED.md` and move on — the UI handles missing files gracefully
  by showing the copyable command.  Stubs corrupt the gallery.
- **Do not hand-edit `plots/MANIFEST.json`.**  Use `append_manifest` in
  `_common.sh`; it computes the sha256 from the actual file on disk so the
  manifest can never lie about what was generated.
- **Do not change the filename schema.**  The UI requests these paths
  by-name; renaming silently breaks the integration.

## Where to add new commands later

1. Add a new catalog entry to `CATALOG` in `scripts/tryit.jsx` (mirror
   the existing entries — id, group, options, defaults, artifact builder).
2. Add a `tools/gen/generate_<thing>.sh` that produces the file(s) the
   `artifact()` function asks for.  Source `_common.sh` for environment +
   `append_manifest`.
3. Document it in this file's table.

## Filename builder, for grep

The UI's filename builder is `scripts/tryit.jsx` line ~135 (`CATALOG[*].artifact`).
Each artifact returns `{ path, command, annot?, metaPath?, metaAnnot? }`
where `path` is **relative to `plots/`** (no prefix).  The output panel
prefixes `plots/` exactly once when fetching.  If the website ever
requests a file that doesn't exist, that means:

- the corresponding `tools/gen/generate_*.sh` either hasn't been run, or
- the script ran but `psrchive` failed for that combination (see
  `SKIPPED.md`), or
- the script's filename doesn't match the catalog's `artifact()` return.

In the last case, fix the script — not the catalog.
