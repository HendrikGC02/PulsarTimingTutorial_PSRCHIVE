# Plots specification — handoff to Claude Code

This file is the **contract between the website UI and the precomputed plot images** that Claude Code will generate against a real PSRCHIVE install. Every image the UI loads is a fixed filename in `plots/`. If a user picks a combination of arguments that isn't on this list, the UI shows the command for them to run locally instead of an image.

---

## Filename schema

```
plots/<command>/<archive>/<plot-type>__<jflags>[__<extra>].png        ← single-command plots
plots/pipelines/<chain-id>/<archive>__<stage>.png                      ← multi-command pipeline outputs
plots/landing/<name>.png                                               ← landing-page hero & diagrams
```

Rules:
- `<archive>` — short name without `.ar` extension, e.g. `J0437-4715`, `J1909-3744`.
- `<jflags>` — concatenated lowercase `j` ops, alphabetised, e.g. `jd`, `jdf`, `jdft`. Use `raw` if no `-j` ops.
- `<extra>` — optional cmap/zoom marker, e.g. `cmap-inferno`, `xphase-03-07`. Omit when default.
- All images **1200×800 px**, 100 dpi, PNG, transparent → black background.
- Use PSRCHIVE's default colour map (`heat`) unless the file name says otherwise.
- Title bar inside the plot is OK — the UI does **not** crop it.

---

## Required sample archives

Generate everything below for **two** archives so the user can switch between them in the gallery:

| short name      | suggested source                                                  | notes                                         |
| --------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `J0437-4715`    | any reasonably high-S/N MeerKAT / Parkes archive of J0437-4715    | the canonical MSP demo                        |
| `J1909-3744`    | any archive of J1909-3744                                         | second voice, different morphology            |

If real archives aren't available, fall back to PSRCHIVE's bundled test data (`$PSRHOME/data/...`), and document which file you used in `plots/README.md`.

---

## Section 1 — Landing page plots  (`plots/landing/`)

The landing page needs 4 reference images. Everything else there is rendered procedurally as SVG.

| filename                          | command (generate from a clean archive)                                                            | what it shows                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `landing/rfi-before.png`          | `psrplot -p freq -j D       file.ar -D rfi-before.png/png`                                         | dynamic spectrum with RFI still in it                  |
| `landing/rfi-after.png`           | `paz -r -e zap file.ar && psrplot -p freq -j D file.zap -D rfi-after.png/png`                      | same archive after `paz -r`                            |
| `landing/template-stack.png`      | stack of ~5 high-S/N profiles + the smoothed result (`psrsmooth` output) overplotted               | shows smoothing to template (optional, can be SVG)     |
| `landing/residuals-example.png`   | output of `pat` → `tempo2`/`pint` residual plot                                                    | residuals vs MJD (acceptable to use any real residual) |

---

## Section 2 — Try-it gallery, single commands  (`plots/psrplot/<archive>/...`)

For **each** of the two archives, generate the following grid. Run on a cleaned + calibrated archive (call it `${ar}.zap.calib.ar` after `paz` + `pac`).

| plot-type | `-j` ops      | filename                                       | command                                                            |
| --------- | ------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| flux      | jft           | `psrplot/${ar}/flux__jft.png`                  | `psrplot -p flux -j FT  ${ar}.ar -D <out>/png`                     |
| flux      | jdft          | `psrplot/${ar}/flux__jdft.png`                 | `psrplot -p flux -j DFT ${ar}.ar -D <out>/png`                     |
| freq      | raw           | `psrplot/${ar}/freq__raw.png`                  | `psrplot -p freq           ${ar}.ar -D <out>/png`                  |
| freq      | jd            | `psrplot/${ar}/freq__jd.png`                   | `psrplot -p freq -j D      ${ar}.ar -D <out>/png`                  |
| time      | jf            | `psrplot/${ar}/time__jf.png`                   | `psrplot -p time -j F      ${ar}.ar -D <out>/png`                  |
| time      | jdf           | `psrplot/${ar}/time__jdf.png`                  | `psrplot -p time -j DF     ${ar}.ar -D <out>/png`                  |
| stokes    | jft           | `psrplot/${ar}/stokes__jft.png`                | `psrplot -p stokes -j FT   ${ar}.ar -D <out>/png`                  |
| stokes    | jdft          | `psrplot/${ar}/stokes__jdft.png`               | `psrplot -p stokes -j DFT  ${ar}.ar -D <out>/png`                  |
| pa        | jdft          | `psrplot/${ar}/pa__jdft.png`                   | `psrplot -p pa -j DFT      ${ar}.ar -D <out>/png`                  |
| pat       | jdft          | `psrplot/${ar}/pat__jdft.png`                  | `psrplot -p pat -j DFT     ${ar}.ar -D <out>/png`                  |

→ **20 images total** (10 variants × 2 archives).

### `pav` parity row (one archive only)

Show `pav` produces the same thing with a different syntax:

| filename                                       | command                                       |
| ---------------------------------------------- | --------------------------------------------- |
| `pav/${ar}/dynamic__jd.png`                    | `pav -DFTp -j D ${ar}.ar -D <out>/png`        |

---

## Section 3 — Try-it gallery, **pipelines**  (`plots/pipelines/<chain-id>/...`)

Pipelines are the heart of the page — each one is a chain of commands the UI walks through. Every stage's intermediate output is its own PNG so the "step N of M" view in the IDE can render it.

### Pipeline A · `psradd → pam-T → psrplot`

Combine two epochs, time-scrunch, plot phase × frequency. Use the *same* pulsar archive split across two epochs (`ep1.ar`, `ep2.ar`).

| chain-id stage           | filename                                            | command                                                 |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| `psradd+pamT+psrplot/1`  | `pipelines/psradd+pamT+psrplot/ep1__step1.png`      | `psrplot -p time -j F ep1.ar -D <out>/png`              |
| `…/2`                    | `pipelines/psradd+pamT+psrplot/ep2__step1b.png`     | `psrplot -p time -j F ep2.ar -D <out>/png`              |
| `…/added`                | `pipelines/psradd+pamT+psrplot/added__step2.png`    | `psradd -o added.ar ep1.ar ep2.ar && psrplot -p time -j F added.ar -D <out>/png` |
| `…/tscr`                 | `pipelines/psradd+pamT+psrplot/added-tscr__step3.png` | `pam -T -e Tscr added.ar && psrplot -p time -j F added.Tscr -D <out>/png` |
| `…/final`                | `pipelines/psradd+pamT+psrplot/final.png`           | identical to `added-tscr__step3` (alias)                |

### Pipeline B · `paz → pam-FT → psrplot stokes`

Zap, scrunch frequency + time, plot Stokes parameters.

| stage   | filename                                  | command                                                                                  |
| ------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| input   | `pipelines/paz+pamFT+stokes/raw.png`      | `psrplot -p freq ${ar}.ar -D <out>/png`                                                  |
| zapped  | `pipelines/paz+pamFT+stokes/zapped.png`   | `paz -r -e zap ${ar}.ar && psrplot -p freq ${ar}.zap -D <out>/png`                       |
| scrunch | `pipelines/paz+pamFT+stokes/scrunched.png`| `pam -FT -e FT ${ar}.zap && psrplot -p stokes ${ar}.zap.FT -D <out>/png`                 |
| final   | `pipelines/paz+pamFT+stokes/final.png`    | identical to `scrunched`                                                                 |

### Pipeline C · template + `pat`

Build a standard, generate TOAs, show the cross-correlation residual.

| stage    | filename                                  | command                                                                                    |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| profile  | `pipelines/template+pat/profile.png`      | `psrplot -p flux -j FT ${ar}.ar -D <out>/png`                                              |
| smoothed | `pipelines/template+pat/template.png`     | `psrsmooth -W ${ar}.FT && psrplot -p flux ${ar}.FT.sm -D <out>/png`                        |
| toa      | `pipelines/template+pat/toa-text.txt`     | `pat -s template.std ${ar}.ar > toa-text.txt`  (plain text, the UI displays it)            |
| residual | `pipelines/template+pat/residual.png`     | feed `toa-text.txt` into tempo2/pint → residual plot                                       |

---

## Generation script

A simple shell loop is fine. Sketch:

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p plots/landing plots/psrplot plots/pav plots/pipelines

for ar in J0437-4715 J1909-3744; do
  src="archives/${ar}.zap.calib.ar"
  out="plots/psrplot/${ar}"
  mkdir -p "$out"

  psrplot -p flux   -j FT  "$src" -D "$out/flux__jft.png/png"
  psrplot -p flux   -j DFT "$src" -D "$out/flux__jdft.png/png"
  psrplot -p freq          "$src" -D "$out/freq__raw.png/png"
  psrplot -p freq   -j D   "$src" -D "$out/freq__jd.png/png"
  psrplot -p time   -j F   "$src" -D "$out/time__jf.png/png"
  psrplot -p time   -j DF  "$src" -D "$out/time__jdf.png/png"
  psrplot -p stokes -j FT  "$src" -D "$out/stokes__jft.png/png"
  psrplot -p stokes -j DFT "$src" -D "$out/stokes__jdft.png/png"
  psrplot -p pa     -j DFT "$src" -D "$out/pa__jdft.png/png"
  psrplot -p pat    -j DFT "$src" -D "$out/pat__jdft.png/png"
done

# … pipelines as above …
```

Commit a `plots/MANIFEST.json` listing every generated file, with `{path, command, archive, sha256}` per entry — the UI uses this to know what's available.

---

## What the UI does when a plot is missing

When the user assembles a command/pipeline that isn't on the manifest, the UI:
1. Shows the assembled command in a code block.
2. Adds a "Copy command" button.
3. Renders a placeholder with: *"This combination isn't precomputed — run the command above on your own archive to see the result."*

So missing plots are not blocking — they just degrade gracefully.

---

## Credits

Each PNG should be reproducible from the manifest. In `plots/README.md`, record:
- which physical archive (`.ar`) each `${ar}` short-name corresponds to,
- where it came from (telescope, programme, MJD, observer / DOI / paper if applicable),
- the PSRCHIVE version (`vap --version`),
- the date the manifest was generated.

That way when we cite sources on the website footer we can pull the real attribution from one file.
