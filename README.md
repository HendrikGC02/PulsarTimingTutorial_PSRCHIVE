# PulsarTimingTutorial_PSRCHIVE

An interactive website to learn and practice pulsar timing with PSRCHIVE.

## Website structure

- `index.html`: tutorial page with a visual workflow and interactive argument controls.
- `styles.css`: page styling.
- `script.js`: scenario selection logic.
- `assets/precomputed/`: precomputed output images used for scenario display.

## Run locally

Open `index.html` directly in a browser, or serve the repository root:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.

## Adding new precomputed scenarios

1. Add a new image file under `assets/precomputed/`.
2. Add a matching scenario entry in `script.js` with the argument key and image path.
