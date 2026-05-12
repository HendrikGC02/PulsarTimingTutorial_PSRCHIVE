# PSRCHIVE — a visual pulsar timing tutorial

A three-page interactive tutorial that walks a new researcher through the
PSRCHIVE pulsar timing software, from "what is a pulse profile?" to "here
are the parts of a `.tim` line, hover them to see what each column means".

Built as a companion to the
[GettingTOAs tutorial PDF](../GettingTOAs_tutorial.pdf): the same
end-to-end workflow (raw archive → clean → scrunch → template → TOAs →
residuals) presented as diagrams you can poke at and commands you can
configure.

**Live site:** https://hendrikgc02.github.io/PulsarTimingTutorial_PSRCHIVE/

**Author:** Hendrik Combrinck — Swinburne University of Technology; ARC
Centre of Excellence for Gravitational Wave Discovery (OzGrav).

PSRCHIVE itself is © Willem van Straten, Aidan Hotan, and the PSRCHIVE
collaboration (GPL).  This site is an independent teaching aid, not
affiliated with the PSRCHIVE development team.

## The three pages

- [`index.html`](index.html) — **Visual essay.**  Eight stops along the
  pipeline, each with an interactive SVG diagram + a paragraph of context.
  Folding, the 4-D data cube, dedispersion, RFI zapping (with the real
  before/after PSRCHIVE plots), polarisation calibration, scrunching,
  template building, TOA cross-correlation + residuals.
- [`try-it.html`](try-it.html) — **Playground.**  VSCode-style workspace
  where you pick a command and a set of flags and see what the output
  actually looks like.  Three modes: legacy single-command (psrplot),
  multi-step pipelines, and the broader catalog of every other command
  the tutorial covers (vap, psrstat, pav, pam scrunches, paz variants,
  psradd, psrsmooth, pat with annotated `.tim` columns).  All outputs are
  real PSRCHIVE artifacts — no synthesised stand-ins.
- [`reference.html`](reference.html) — **Command dictionary.**  Every
  command's flag list (auto-refreshed monthly from `<cmd> --help`) plus
  curated examples; each example renders a thumbnail of its real
  precomputed output you can click to enlarge.

## Repository layout

```
PulsarTimingTutorial_PSRCHIVE/
├── index.html / try-it.html / reference.html
├── styles/site.css
├── scripts/
│   ├── diagrams.jsx        ← shared SVG primitives (PulseProfile, heatColor,
│   │                         DedispCurves, CalibPolar, SiteHeader/Footer)
│   ├── animations.jsx      ← scrub-bar driven animations (FoldingAnim,
│   │                         DataCubeInteractive, RfiMorph, ScrunchAnim,
│   │                         TemplateStacking)
│   ├── landing.jsx         ← Page 1 (visual essay)
│   ├── tryit.jsx           ← Page 2 (playground, CATALOG-driven)
│   └── reference.jsx       ← Page 3 (command dictionary + lightbox)
├── data/
│   └── commands.json       ← seed prose + machine-refreshed flag table
├── plots/                  ← precomputed PSRCHIVE outputs (see plots-spec.md)
│   ├── landing/, psrplot/, pav/, pam/, paz/, vap/, psrstat/, psradd/, pat/,
│   ├── pipelines/, MANIFEST.json, README.md, SKIPPED.md
├── tools/
│   ├── generate_plots.sh   ← original generator (psrplot + landing + pipelines)
│   ├── scrape_help.py      ← refreshes data/commands.json from --help
│   ├── HANDOFF.md          ← runbook for the new extended generators
│   └── gen/                ← Phase-C additions: small focused generators
│       ├── _common.sh, _annot_helpers.py
│       └── generate_pav.sh, generate_pam_scrunches.sh,
│           generate_paz_variants.sh, generate_vap_outputs.sh,
│           generate_psrstat_outputs.sh, generate_psradd_meta.sh,
│           generate_pat_tim.sh
├── plots-spec.md           ← UI ↔ generator contract (filename schema)
├── REFERENCE-STRATEGY.md   ← how data/commands.json stays fresh
└── .github/workflows/refresh-docs.yml   ← monthly --help re-scrape
```

Hand-authored content (prose, examples, related-command links) and
machine-refreshed content (flag tables, --help text) live side-by-side in
`data/commands.json`; the scraper is configured to overwrite only the
machine fields.  See `REFERENCE-STRATEGY.md` for details.

## Running locally

No build step — Babel-standalone transpiles JSX in the browser.  Serve
over HTTP (not `file://`) so the `fetch()`-es in `reference.jsx` and
`tryit.jsx` work:

```bash
python -m http.server 8000
# open http://localhost:8000/index.html
```

## Updating content

### Refreshing the command reference

`.github/workflows/refresh-docs.yml` runs on the 1st of each month (and
on-demand from the Actions tab).  It boots a PSRCHIVE container, runs
`tools/scrape_help.py`, and opens a PR with the diff.  The hand-authored
`desc` / `long` / `examples` / `related` / `img` fields in
`data/commands.json` are preserved; only `usage` / `flags` / `help_raw` /
`help_available` get overwritten.

### Regenerating plots

The plots are produced by running PSRCHIVE against real `.ar` archives.
Two generators:

- `tools/generate_plots.sh` — the original 4 landing PNGs, the 18
  psrplot single-command gallery, and the 3 multi-step pipelines.
- `tools/gen/*.sh` — seven smaller scripts producing the artifacts the
  Phase-C expansion needs (pav, pam scrunches, paz variants, vap text,
  psrstat text, psradd metadata, pat `.tim` with annotation sidecars).
  See [`tools/HANDOFF.md`](tools/HANDOFF.md) for the exact runbook,
  filename schema, and the `.annot.json` format.

All scripts are idempotent.  Failures are logged to `plots/SKIPPED.md`
and the UI degrades gracefully when a precomputed file is missing.

After both generators have run against a real PSRCHIVE install, the
manifest tracks ~90 primary artifacts (images, text outputs, .tim files);
the JSON annotation sidecars and intermediate pipeline files live next
to them on disk but aren't separately manifested.

### Editing prose / diagrams

Everything else is edited directly in the `.jsx` files and viewed in the
browser — no build, no transpile step, no node_modules.

## Tech choices

React 18 via the Babel-standalone CDN; no bundler; GitHub Pages; SVG-first
for the animated diagrams; a precomputed PNG + JSON sidecar pattern for
everything that needs real PSRCHIVE output.  The pattern lets the
tutorial run anywhere a static file server runs while still showing real
data — the only stateful step (running PSRCHIVE itself) happens out of
band.

## Citing the tutorial

```
@misc{combrinck2026psrchivetutorial,
  author = {Hendrik Combrinck},
  title  = {PSRCHIVE: a visual pulsar timing tutorial},
  year   = {2026},
  howpublished = {\url{https://hendrikgc02.github.io/PulsarTimingTutorial_PSRCHIVE/}},
  note   = {OzGrav / Swinburne University of Technology}
}
```

Per-archive provenance (telescope, MJD, processing) is recorded in
[`plots/README.md`](plots/README.md).

## License

- Code (`scripts/`, `styles/`, `tools/`): **MIT**.
- Text and diagrams (`*.html`, prose in `data/`, `*.md`): **CC BY 4.0**.
- PSRCHIVE binaries: **GPL** (© Willem van Straten et al., upstream).
- Sample archives: see `plots/README.md` for per-archive licensing.
