# PSRCHIVE tutorial — site audit (May 21 2026)

Audit run against the `main` branch on GitHub and the locally-imported copy.
Two-archive scope (J0437-4715 + J1909-3744); 407 precomputed artifacts in
`plots/MANIFEST.json`. The big finding: **330 of those 407 plots are
generated but have no UI to reach them.** Everything below is one of:

- a formatting bug on the landing or try-it page that needs a small fix,
- a gallery item the UI promises but the artifact is missing,
- a real artifact in `plots/` that the UI never exposes.

---

## A · Formatting / visual bugs

### A1 · Nav links read as one word — "Try it Reference"
- **Where:** Site header (every page), `scripts/diagrams.jsx::SiteHeader` + `styles/site.css::.sk-nav`
- **What:** The flex gap is correctly applied (16 px), but the nav inherits
  Caveat (handwritten font) from a legacy `.sk-nav { font-family: var(--font-hand) }`
  rule. At 17 px Caveat the visual gap looks like zero between adjacent
  short labels.
- **Fix:** Switch `.sk-nav` to `--font-display` (Space Grotesk), bump the
  gap to 22 px, raise font weight slightly. Also move the glossary +
  theme buttons into their own group with a little visual separation.

### A2 · Chips overflow when label wraps to multiple lines
- **Where:** Landing → "Polarisation calibration" (noise diode / MEM
  model), "Building a standard profile" (paas, psrsmooth), "Zapping
  RFI" (psrzap manual), Try-it argument inspector ("apply pac"),
  Adjacent tools block (pdmp / tempo2 / dspsr — *very* visible there).
- **What:** `.sk-chip` uses `border-radius: 999px` (a pill) and
  `padding: 2px 10px`. When the inner text wraps, the pill shape
  remains computed for a single line and the second line escapes the
  outline, then the next chip sits on top of it.
- **Fix:** `.sk-chip { white-space: nowrap; }` *or* relax to `border-radius:
  10px; padding: 4px 12px;` so multi-line content renders as a small
  rounded rectangle. I'll go with the second — the chips already mix
  one- and two-word labels.

### A3 · Folding animation runs outside the plot at N=1
- **Where:** Landing step 01 (folding), `scripts/animations.jsx::FoldingAnim`.
- **What:** The "cloud of individual rotations" behind the running
  average uses very large `noiseAmp * 0.7` (no clipping), so at low N
  the noisy paths shoot well above the top of the plot area.
- **Fix:** Wrap the cloud paths in `<clipPath>` matching the plot
  rectangle, and shrink the noise amplitude (× 0.35 instead of × 0.7)
  so the cloud reads as fuzz around the mean rather than as a forest
  of spikes.

### A4 · Dedispersion diagram clips right edge
- **Where:** Landing step 03 (dedisperse), `scripts/diagrams.jsx::DedispCurves`.
- **What:** The "peak × 0.1 after dedispersion" / "Δt ∝ DM · ν⁻²"
  annotations sit at the right of the SVG and are clipped on screens
  narrower than ~1240 px. The SVG itself fits, but the labels are
  drawn beyond the right edge.
- **Fix:** Move both annotations inside the viewBox; right-anchor with
  `textAnchor="end"` and `x={w - 12}`.

### A5 · Data cube "Stokes I,Q,U,V" chip wraps awkwardly
- **Where:** Landing step 02, the chip row below the cube.
- **What:** Two-line chip ("Stokes" / "I,Q,U,V") inside a pill. Caused
  by A2; the A2 fix resolves this too.

### A6 · Footer cite list is brittle on narrow viewports
- **Where:** `scripts/diagrams.jsx::SiteFooter`.
- **What:** The "cite" column lists two papers as a single block of
  italicised text. On phones it wraps oddly. Cosmetic, low priority.
- **Fix:** Render each paper as its own `<div>` with a small bottom
  margin. (Already low priority — flagged for completeness.)

### A7 · Header `📖 glossary` + `dark` buttons collide on phones
- **Where:** Mobile / narrow viewport.
- **What:** The narrow-viewport CSS hides `.sk-nav .item` but keeps the
  glossary + theme `<button>`s, which then float right of the brand.
  No issue in itself, but the brand row gets crowded.
- **Fix:** Below 760 px, drop the "pulsar timing tutorial" subtitle so
  the brand+buttons row has more breathing room.

---

## B · UI missing — artifacts exist but nothing to click

These are the 330 orphan plots, grouped by command.

### B1 · `pam` — full scrunch matrix (158 files)

`tools/gen/generate_pam_scrunches.sh` produced every cell of the
nchan × nsub grid for `-F / -T / -FT / -FTD`, on both **clean** and
**dirty** archives. The current catalog only exposes the flat
`fscrunch-N`, `tscrunch-N`, `bscrunch-N` variants.

| flag | files                                                                                                                | UI status |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------- |
| `-D` | `pam/<ar>/D.png` + `D__dirty.png` (+ meta)                                                                            | 🚫 absent |
| `-F` | `pam/<ar>/F__nchan{8,16,32,116}.png` + `__dirty` variants                                                             | 🚫 absent |
| `-T` | `pam/<ar>/T__nsub{1,2,4}.png` + `__dirty` variants                                                                   | 🚫 absent |
| `-FT`| `pam/<ar>/FT__nchan{8,16,32}__nsub{1,2,4}.png` + dirty                                                               | 🚫 absent |
| `-FTD`| same shape as `FT`                                                                                                  | 🚫 absent |
| `-P` | `pam/<ar>/P.png` + `__dirty`                                                                                          | 🚫 absent |
| `fscrunch-N` | shorthand wrappers (legacy, also still present)                                                              | ✅ present |
| `tscrunch-N` | shorthand wrappers                                                                                           | ✅ present |
| `bscrunch-N` | shorthand wrappers                                                                                           | ✅ present |

**Recommended fix:** Replace the three flat `pam-fscrunch / tscrunch /
bscrunch` catalog entries with a single `pam` entry that lets the user
pick the flag combo (`F / T / FT / FTD / D / P`) and the relevant
`nchan` / `nsub` grid axes. Also add a global "raw vs cleaned"
toggle (see B7).

### B2 · `pav` — full G/D/Y × scrunch matrix (106 files)

`plots-todo.md` defines this exhaustively: 3 modes × 10 scrunch
combos × 2 (clean+dirty) per archive = up to 60 files each.
Generators ran and produced 55 + 55. The current catalog
exposes exactly 2: `dynamic` (D-FTp) and `stack` (G-Tp).

Filenames on disk follow `pav/<ar>/<mode>_<ops>.png` and
`pav/<ar>/<mode>_<ops>__dirty.png`. e.g. `Y_FTpd`, `G_bare`,
`D_F__dirty`.

**Recommended fix:** Rewrite the `pav` catalog entry to expose the
full matrix as two radios (mode, ops). Use the **validity matrix**
from `plots-todo.md` so the UI greys out the ⚠ degenerate /
✗ rejected combinations and shows a banner explaining *why* they're
degenerate, rather than rendering a blank.

### B3 · `paz` — already wired

All four `paz/<ar>/{auto,manual-chans,freqrange,badsub}.png` files
exist and the UI hits them. **OK.** Could optionally surface the
dirty/clean toggle here too (some paz examples are most informative
on the dirty archive).

### B4 · `psrplot` extras: joy, polprof, polprof__dirty (6 files)

These are sitting in `plots/psrplot/<ar>/`:

- `joy__jdf.png` — joy-division-style time-stacked profile
- `polprof__jdft.png` — Stokes-cylinder polarisation profile
  (I/L/V with PA on top)
- `polprof__jdft__dirty.png` — same on the dirty archive

None of them are in the current `psrplot` plot-type radio. The
single-mode UI hardcodes `["flux","freq","time","stokes","pa"]` —
adding `pat`, `joy`, and `polprof` to that list (with `__dirty`
toggle on `polprof`) gets these into the gallery.

### B5 · `pdmp` — entirely missing (4 files)

`pdmp/<ar>/pdmp.png` + `pdmp/<ar>/pdmp.txt` for both archives.
`pdmp` isn't part of PSRCHIVE itself (sigproc / dspsr companion),
which is why it was deferred. Generators marked it `external: true`
in MANIFEST.

**Recommended fix:** New catalog entry **`pdmp` — DM / period search**
under a new gallery group `ADJACENT` (not part of `INSPECT` /
`PLOT` etc., to keep the boundary clear). Render the PNG plus the
text output. Manifest banner already supports `external: true`.

### B6 · Rotation animation — entirely missing (24 files)

`rotation/<ar>/phase_NN.png` for NN ∈ {00, 02, ..., 22} (12 frames
each archive). These are intended as a phase-rotation animation —
PNGs of `pam --rot <phase>` results, frame-by-frame.

**Recommended fix:** Dedicated catalog entry **`pam --rot` · rotate
phase** with a scrubbable slider (re-using `<ScrubBar>` from
`animations.jsx`) showing the current frame. No precomputed cache
miss possible — just `<img>` swap.

### B7 · `dynspec` — entirely missing (4 files)

`dynspec/<ar>/dynspec.png` + `dynspec__dirty.png` for both
archives. These are produced via `psrplot -p b` (bandpass / dynamic
spectrum); the manifest records the actual command.

**Recommended fix:** New catalog entry **`psrplot -p b` · dynamic
spectrum** in `PLOT` group, with a dirty/clean toggle.

### B8 · Pipelines `pam-pav` (20 files) and `pam-pat` (4 files)

Both are real chains that exercise the *combine commands* story from
`plots-todo.md`:

- `pipelines/pam-pav/<ar>/{D,G,Y}_*.png` — scrunch with `pam`, then
  plot with `pav`. 10 variants × 2 archives.
- `pipelines/pam-pat/<ar>/toas.tim` — build template from a
  pre-scrunched archive, then generate TOAs.

The current `PIPELINES` array has 4 entries; these two are absent.

**Recommended fix:** Two new pipeline entries with proper step
breakdowns:

```
pam-pav    →  pam -F (nchan)  →  pav -<G|D|Y><scrunch>
pam-pat    →  pam -FT          →  psrsmooth -W  →  pat
```

### B9 · `template+pat` pipeline has extras

`pipelines/template+pat/` also has `template.std`, `toa-text.txt`,
`toas.tim` — the actual template + TOA text are produced but the UI
only shows `template.png` / `residual.png`. Adding `toas.tim` as a
final annotated text step would let users see the actual TOA file
format with column tooltips (reusing the `pat` annotation viewer).

### B10 · Catalog `pat` view references a missing annot.json

`scripts/tryit.jsx::CATALOG.pat.artifact()` points the text viewer at
`pat/<ar>/toas.annot.json`, but no such file exists in the repo —
only `pat/<ar>/toas.tim`. As a result the `pat` view renders the
.tim file as plain text instead of with the column tooltips.

**Recommended fix:** Generate `toas.annot.json` next to each
`toas.tim` (one entry per line; spans for filename / frequency /
MJD / error / observatory / flags). I can write a small Python
sidecar generator since the .tim columns are deterministic.

---

## C · Reference page (data/commands.json)

- C1 · The seed banner ("Note: this is the seed data") is currently
  suppressed only when `_meta.source === "seed"`. The deployed
  `commands.json` was successfully scraped against a real PSRCHIVE
  install (407 plots in MANIFEST imply the rest of the toolchain is
  in good shape) — but the source field may still read "seed". Worth
  re-running `tools/scrape_help.py` after the next PSRCHIVE upgrade.

- C2 · A few command cards in the reference page point to example
  images via `e.img` — these are working when the example is one of
  the ones in `plots/`. Cards without thumbnails (`psrstat`, `pcm`,
  `paas`) could pick up thumbnails from the new artifacts (e.g.
  `psrstat/<ar>/snr.txt` could be shown as text, not image — needs a
  small change to support text examples).

---

## D · Suggested order of work

1. **Quick formatting wins** (A1, A2, A3, A4): one CSS pass + two SVG
   tweaks. Five minutes.
2. **Surface `pav` matrix + `pam` matrix** (B1, B2): biggest user-visible
   gap, two catalog entries refactored to be matrix-driven. Includes
   the **validity banner** for `pav` degenerate combos.
3. **Add `psrplot` extras** (B4): tiny — extend the plot-type radio.
4. **Add pipelines `pam-pav` + `pam-pat`** (B8): two new entries.
5. **Add new sections: pdmp (B5), rotation (B6), dynspec (B7).**
6. **Generate `toas.annot.json`** so `pat` view gets its tooltips back.
7. **Dirty/clean toggle (B3 generalised):** archive-level switch in
   the workspace bar.
8. **Reference cleanup** (C2) and final QA pass.

---

After this work the UI surface will reference roughly 380 of the 407
precomputed artifacts (the remaining ~25 are intermediate meta sidecars
that don't need their own surface). Anything still missing degrades to
the "not precomputed — copy this command" panel, which is the desired
behaviour for combinations the user invents.
