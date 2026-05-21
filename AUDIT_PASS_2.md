# PSRCHIVE tutorial — audit pass 2  (post-deploy, 21 May 2026)

Run against the current `main` branch after the first audit landed.  The
big structural work is in (330 → 0 orphan plots, formatting fixes, pav
matrix wired) — what's left below is regressions, edge cases, and
new gaps the rewrite exposed.

---

## A · Mismatches between UI expectations and `plots/MANIFEST.json`

The catalog now references **100 filenames that don't exist on disk.**
Most of them are real bugs in the UI (it should never have generated
those paths); a handful are missing artifacts the generator simply
didn't produce.

### A1 · `.annot.json` sidecars don't exist for vap / psrstat / psradd / pat (10 files)

The catalog tells `TextOutput` to fetch:

```
vap/<ar>/{header,all}.annot.json
psrstat/<ar>/{snr,profile}.annot.json
psradd/<ar>/combine.meta.annot.json
pat/<ar>/toas.annot.json
```

…none of which are in the repo.  The text panels render fine without
them — the failed `fetch()` is silently swallowed — but the "what the
columns mean" legend block never appears.  These need to be authored
once (their format is column-stable per command) and committed.

**Fix:** I'll generate sensible defaults locally and include them in
the next push.

### A2 · `pav G_F*` doesn't exist on these archives (8 files)

Per `plots/SKIPPED.md`, `pav -G -F* <archive>` failed during generation
on the supplied MeerKAT archives.  The UI's `validityFor` *does* mark
G+F combinations as `unavailable` — but it then still tries to load
the file before checking validity in some code paths.  When the user
clicks `G` + `-F`, the page should:
1. Recognise the rejection before fetching anything.
2. Show the rejected/unavailable banner.
3. Not show "loading…".

This works — but only because `PAV_AVAILABLE_OPS` happens to include
`F`.  See A3 for the underlying bug.

### A3 · `PAV_AVAILABLE_OPS` is too narrow

The set in `scripts/tryit.jsx`:

```js
const PAV_AVAILABLE_OPS = new Set(["bare","F","T","p","d","FT","Fd","Td","pd","FTd"]);
```

doesn't include the 11th combination that actually exists on disk: **`Fpd`** (only
for `Y_Fpd.png` in both archives).  Net effect: ticking `Y` + `-F` + `-p` + `-d`
(a valid, generated combination) is incorrectly flagged as "not generated".

The set is also mode-agnostic.  In reality:
- **G** only has `{T, Td, bare, d, p, pd}`
- **D** only has `{F, FT, FTd, Fd, T, Td, bare, d, p, pd}`
- **Y** has `{F, FT, FTd, Fd, Fpd, T, Td, bare, d, p, pd}`

**Fix:** Replace the single set with a per-mode map.  The validity check then
becomes `if (!PAV_AVAILABLE_OPS[mode].has(ops)) → unavailable`.

### A4 · `pam -FT __dirty` and `-FTD __dirty` variants don't exist (36 files)

For every `nchan × nsub` cell of the `-FT` and `-FTD` grids, the catalog
expects a `__dirty` companion (e.g. `FT__nchan8__nsub1__dirty.png`).  None
of those were generated — the `_raw` archives only got the simpler `-D`,
`-F`, `-T`, `-P` runs.

Two options:
1. **Hide the workspace-bar dirty toggle when pam-FT / pam-FTD is active.**
   The toggle becomes meaningless for those entries; degrade to clean-only.
2. **Re-run the generators with the `_raw` archive for `-FT` / `-FTD`** to
   produce the missing 36 files.

I'll do (1) in code (drop `supportsDirty: true` for pam-FT/pam-FTD), since
the diff between clean and dirty after a `-FT` scrunch is barely visible
once both axes are summed — that view doesn't really need the toggle.

### A5 · `psradd/<ar>/combine.meta.annot.json` (2 files) — see A1

### A6 · `pat/<ar>/toas.annot.json` (2 files) — see A1

---

## B · Orphan files in MANIFEST that no UI surfaces (58 files)

These were generated but the new catalog doesn't reach them.  Two categories:

### B1 · Legacy filenames superseded by the rewrite

Old shorthand names that the previous version of `tryit.jsx` referenced:

```
pam/<ar>/fscrunch-{8,32,128}.{png,meta.txt}    ← now pam-F uses F__nchan{N}.png
pam/<ar>/tscrunch-{1,4,16}.{png,meta.txt}      ← now pam-T uses T__nsub{N}.png
pav/<ar>/dynamic__jd.png                       ← now pav uses D_FTd.png
pav/<ar>/stack__jd.png                         ← now pav uses G_Tpd.png
```

These are 26 files of dead weight.  Safe to delete them from the repo on
the next plot-generator run (or just leave them — they don't hurt
anything beyond a few MB).

### B2 · `pam-FD` is generated but no catalog entry exists (4 files)

`pam/<ar>/FD.meta.txt` and `FD__dirty.meta.txt` exist for both archives.
There are no `.png` companions — looks like the generator produced the
metadata text but skipped the plot (probably because `pam -FD` is
degenerate: it dedisperses and then summarises across all frequency, so
the result has no useful frequency information for `psrplot -p freq`).

Either drop the catalog entry idea (it's a known-degenerate combination)
or add a minimal text-only entry pointing at the `.meta.txt`.

I'll leave this alone — adding a degenerate-by-design entry just to clear
the orphan count is bad UX.

### B3 · `pav Y_Fpd.png` — see A3 (fixed by the per-mode availability map)

---

## C · Per-page regressions / smaller issues

### C1 · Landing — `RfiMorph` falls back when images don't load

`scripts/animations.jsx::RfiMorph` correctly renders a "real PSRCHIVE
before/after PNGs unavailable" fallback if `plots/landing/rfi-*.png` 404.
Both files exist in the live repo, so this is fine — but worth noting
that the fallback message refers to `tools/generate_plots.sh` which is
the right hint when something does go wrong.

### C2 · Reference page — `seed banner` may still fire

`scripts/reference.jsx` shows a yellow "Note: this is the seed data"
banner when `data._meta.source === "seed"`.  The repo's
`data/commands.json` `_meta.source` field probably reads `seed` (the
scraper hasn't run yet against a live PSRCHIVE install on the
supercomputer).  Run `tools/scrape_help.py` once and commit the updated
JSON; the banner disappears.

### C3 · Pipeline `pam-pav` exposes only one variant

The pipeline I added only shows `D_FTpd.png` from the 10 generated
`pipelines/pam-pav/<ar>/*.png` files.  This is fine for a "here's what
a chain looks like" demo but it doesn't actually let the user explore
the matrix.  A future improvement: convert this pipeline to a two-radio
step ("pam mode" + "pav scrunch ops") so users can try each.  Skipping
for now — it'd duplicate UI logic from the standalone `pav` entry.

### C4 · Pipeline `pam-pat` is a 3-step chain but step 1 image points
at an asymmetric `pam` file

```js
{ cmd: "pam", flags: "-FT -e FT ${ar}.ar", ...,  img: "pam/J0437-4715/FT__nchan16__nsub1.png" }
```

Hard-codes `J0437-4715` even when the user is viewing the chain for
J1909.  Cosmetic but worth fixing — should be `pam/${ar}/...` like the
catalog entries.  Same issue on the `pat` row of the `end-to-end`
pipeline.

---

## D · Suggested fix order

1. **A3** — per-mode `PAV_AVAILABLE_OPS` (4 LOC change, unlocks 2 plots).
2. **A4** — drop `supportsDirty` on pam-FT and pam-FTD entries.
3. **A1 + A5 + A6** — author the 10 missing `.annot.json` files.
4. **C4** — replace hard-coded archive IDs in pipeline step `img` paths
   with template substitution.

Once those four land, the catalog reaches every artifact the generators
have produced, the column legends render for text-output views, and
the cross-archive pipelines are honest about which archive they show.

---

After this pass the catalog will reference **0 missing files**.  Orphans
(B1) remain for archival reasons; B2 is intentionally not surfaced.
