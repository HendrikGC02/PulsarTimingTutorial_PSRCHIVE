# Plot generation — outstanding work

A running list of artifacts the website expects but that have not yet been
generated against a real PSRCHIVE install. The website renders graceful
"this combination isn't precomputed" placeholders for anything missing,
but the playground is much more useful once these are in place.

Companion to [`plots-spec.md`](plots-spec.md). All filenames follow the
same `plots/<command>/<archive>/<descriptor>.png` schema.

Two archives are used throughout:
- `J0437-4715` — MeerKAT, raw + cleaned (`J0437-4715_raw`, `J0437-4715_2024-07-25-12:13:23_zap.ar`)
- `J1909-3744` — MeerKAT, raw + cleaned (`J1909-3744_raw`, `J1909-3744_2024-07-25-00:04:55_zap.ar`)

All `pam`/`pav` work below should be done **twice**: once on the dirty
(`*_raw`) and once on the cleaned (`*_zap.ar`) archive, so the UI can
show RFI's effect on each command.

---

## 1 · `pav` — every `-{G,D,Y}` × `-<FTpd>` combination

`pav` takes exactly one of `-G/-D/-Y` (the plot mode) and any subset of
`-F`, `-T`, `-p`, `-d` (scrunch / mode flags). Not all combinations make
physical sense: e.g. `-G -T` flattens the time axis but `-G` was already
a 1D mode, so it produces an empty / degenerate plot.

### Validity matrix (UI must surface this)

| mode | bare | -F | -T | -p | -d | -FT | -Fd | -Td | -pd | -FTd |
| ---- | ---- | -- | -- | -- | -- | --- | --- | --- | --- | ---- |
| `-G` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `-D` | ✓ | ⚠ (collapses to 1D) | ⚠ | ✓ | ✓ | ⚠ | ✓ | ⚠ | ✓ | ✓ |
| `-Y` | ✓ | ✓ | ✗ (Y needs time axis) | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |

Legend: ✓ valid · ⚠ degenerate, plot will be empty / nonsense · ✗ flag combination rejected by pav.

The website must show a banner *"⚠ this combination yields an empty plot:
`pav -D -F` collapses both the time and frequency axes, leaving nothing
to plot."* when the user assembles a ⚠ or ✗ combination. **Don't just
silently render a blank.**

### Filenames

```
plots/pav/<archive>/<mode><scrunch>.png         # e.g. pav/J0437-4715/G_FT.png
plots/pav/<archive>/<mode><scrunch>__dirty.png  # raw archive variant
```

Where `<mode>` ∈ {`G`, `D`, `Y`} and `<scrunch>` ∈ {``, `F`, `T`, `p`,
`d`, `FT`, `Fd`, `Td`, `pd`, `FTd`}. The `mode__dirty` suffix marks the
RFI-still-present version.

Per archive that is **3 modes × 10 scrunch combos × 2 (clean+dirty) = 60
images**, of which only the ✓ entries above need to render correctly; the
⚠/✗ entries should still be generated (so the UI can show the user what
"empty" looks like) but tagged in `MANIFEST.json` with `"valid": false`.

### Commands

```bash
for src in J0437-4715/_raw J0437-4715/_zap J1909-3744/_raw J1909-3744/_zap; do
  for mode in G D Y; do
    for ops in "" F T p d FT Fd Td pd FTd; do
      out="plots/pav/${ar}/${mode}_${ops:-bare}${dirty}.png"
      pav -${mode} ${ops:+-${ops}} "${src}.ar" -D "${out}/png"
    done
  done
done
```

---

## 2 · `pam` — scrunch grid on dirty and clean

For each `-<F D T P>` flag plus the `-set-nchan` / `-set-nsubint`
combinations:

| `-F D T P` | `-set-nchan` | `-set-nsubint` | run on |
| --------- | ------------ | -------------- | ------ |
| `-F`      | 116, 32, 16, 8 | n/a          | dirty, clean |
| `-D`      | n/a (dedisp)   | n/a          | dirty, clean |
| `-T`      | n/a            | 1, 2, 4      | dirty, clean |
| `-P`      | n/a (psum pol) | n/a          | dirty, clean |
| `-FT`     | 116/32/16/8    | 1/2/4        | dirty, clean (only sensible products) |
| `-FD`     | …              | n/a          | … |
| `-FTD`    | 32/16/8        | 1/2/4        | clean only — full reduction |

Each `pam` run produces an `.ar` plus a `vap` text summary, but the
website also wants a `psrplot -p freq -j D` thumbnail of the *result* so
the user can see what scrunching did visually.

### Filenames

```
plots/pam/<archive>/<flag>__nchan<N>__nsub<M><tag>.png
plots/pam/<archive>/<flag>__nchan<N>__nsub<M><tag>.meta.txt
```

`<tag>` ∈ {`__clean`, `__dirty`}.

For combos where one of the `-set-*` flags doesn't apply (e.g. plain
`-F` without subint control), omit that token: `F__nchan32__clean.png`.

---

## 3 · Pipelines that combine `pam` with other commands

All on the **cleaned** archive only.

### a) `pam → pav`

```bash
pam -F -set_nchan 32 -e f32 clean.ar
pav -GTpd clean.f32 -D pipelines/pam-pav/clean__pamF32__pavGTpd.png/png
```

For each pav variant from §1 we want the equivalent on a `pam` pre-scrunched archive. Suggested set: every ✓ entry of the matrix, after the user has done one of `-F` (nchan 32) or `-FT` (nchan 16, nsubint 2).

### b) `pam → psrsmooth → pav`

```bash
pam -FT -set_nchan 1 -set_nsubint 1 -e p clean.ar       # full collapse
psrsmooth -W clean.p                                    # writes clean.p.sm
pav -SFTpd clean.p.sm -D pipelines/pam-smooth-pav/clean__smooth__SFTpd.png/png
```

### c) `pam → pat`  (use the smoothed result as the template)

```bash
pam -FT -set_nchan 1 -set_nsubint 1 -e p clean.ar
psrsmooth -W clean.p
mv clean.p.sm template.std
pat -s template.std clean.ar > pipelines/pam-pat/clean.tim
```

Display the `.tim` with the existing annotated-TOA component.

---

## 4 · Other plots requested

| description                                            | suggested filename                                  | command sketch |
| ------------------------------------------------------ | --------------------------------------------------- | -------------- |
| Rotate archive along pulse phase, animation frames     | `plots/rotation/<ar>/phase_<NN>.png` (NN = 00..23)  | `pam --rot 0.05 -e r{NN} src.ar && psrplot -p flux ...` |
| Joy-division plot via `psrplot`                        | `plots/psrplot/<ar>/joy__jdf.png`                   | `psrplot -p time -j DF -c text=... src.ar -D <out>/png` (use `-x` to stack) |
| Joy-division plot via `pav -Y`                         | `plots/pav/<ar>/Y_Fpd.png`                          | `pav -YFpd src.ar -D <out>/png` |
| Polarisation profile (literature convention: I/L/V + PA on top) | `plots/psrplot/<ar>/polprof__jdft.png`     | `psrplot -p Scyl -j DFT src.ar -D <out>/png` |
| Dynamic spectrum (if available)                        | `plots/dynspec/<ar>/dynspec.png`                    | external (e.g. scintools / `psrflux`) |
| `pdmp` plot                                            | `plots/pdmp/<ar>/pdmp.png`                          | `pdmp -g pdmp.ps/cps src.ar && ps2png` (mark this as **external — not part of PSRCHIVE**) |
| `pdmp` text output                                     | `plots/pdmp/<ar>/pdmp.txt`                          | `pdmp -mc 16 -ms 8 src.ar > pdmp.txt` |

Each `pdmp.*` file must be tagged in MANIFEST.json with `"external": true` so the playground can put a small "↗ not part of PSRCHIVE" badge next to the result.

---

## 5 · MANIFEST.json fields

Extend the existing schema with:

```json
{
  "path": "plots/pav/J0437-4715/D_F__dirty.png",
  "command": "pav -DF J0437-4715_raw.ar",
  "archive": "J0437-4715",
  "sha256": "…",
  "valid": false,           // NEW — set to false for ⚠/✗ pav combos
  "external": false,        // NEW — true for pdmp / clfd / scintools artifacts
  "dirty": true             // NEW — true if generated from the _raw archive
}
```

The website reads `valid` to surface the "⚠ degenerate plot" banner, and `external` to add the non-PSRCHIVE chip.

---

## 6 · Archive questions

- For the joy-division and dynspec products the existing two MeerKAT
  archives should be enough, **but** good scintillation visualisation
  benefits from a longer dwell. Let me know if a 10 min+ archive of
  either J0437-4715 or J1909-3744 is available — otherwise these
  artifacts will look static.
- `pdmp` ideally wants the archive *before* coherent dedispersion to
  show off the DM-search axis. The existing `_raw` MeerKAT archives are
  already coherently dedispersed; a `_predd` archive would let `pdmp`
  actually find a DM trough. If unavailable we proceed with the existing
  archive and accept a less dramatic plot.

Open these as TODOs and the playground will fill in as the artifacts land.
