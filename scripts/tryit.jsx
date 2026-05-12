/* global React, SiteFooter, PhaseFreqPlot */

/* ============================================================
   V2 · INTERACTIVE PAGE — stateful IDE
   The argument inspector + plot-type radio + -j toggles all
   feed a single state object. State → command string + expected
   filename in plots/...  An <img> tries to load it; if it 404s
   we degrade gracefully to a "copy this command" panel.
   ============================================================ */

const { useState, useMemo, useRef, useEffect } = React;

const V2_IPG_W = 1300;
const V2_IPG_H = 920;

/* ---------- catalog mirrors plots-spec.md ----------
   Single-command presets (gallery section "Single commands")
   and pipeline presets (gallery section "Pipelines"). The UI
   builds the filename and command from the active preset. */

const ARCHIVES = [
  { id: "J0437-4715", label: "J0437-4715 (MeerKAT-ish)" },
  { id: "J1909-3744", label: "J1909-3744" },
];

const PLOT_TYPES = [
  { id: "flux",   label: "flux profile",      defaultJ: { D: true,  F: true,  T: true  }, group: "Profiles" },
  { id: "freq",   label: "phase × frequency", defaultJ: { D: false, F: false, T: false }, group: "Phase × frequency" },
  { id: "time",   label: "phase × time",      defaultJ: { D: false, F: true,  T: false }, group: "Phase × time" },
  { id: "stokes", label: "stokes profile",    defaultJ: { D: true,  F: true,  T: true  }, group: "Polarisation" },
  { id: "pa",     label: "position angle",    defaultJ: { D: true,  F: true,  T: true  }, group: "Polarisation" },
];

// Filenames actually present on disk under plots/.  Stored without the
// "plots/" prefix so we can compare against `expectedFilename().replace(/^plots\//,"")`.
// Keep in sync with plots/MANIFEST.json.  Each entry below is verified to exist.
const AVAILABLE = new Set([
  // J0437-4715 — psrplot single-command gallery
  "psrplot/J0437-4715/flux__jft.png",   "psrplot/J0437-4715/flux__jdft.png",
  "psrplot/J0437-4715/freq__raw.png",   "psrplot/J0437-4715/freq__jd.png",
  "psrplot/J0437-4715/time__jf.png",    "psrplot/J0437-4715/time__jdf.png",
  "psrplot/J0437-4715/stokes__jft.png", "psrplot/J0437-4715/stokes__jdft.png",
  "psrplot/J0437-4715/pa__jdft.png",
  // J1909-3744 — psrplot single-command gallery
  "psrplot/J1909-3744/flux__jft.png",   "psrplot/J1909-3744/flux__jdft.png",
  "psrplot/J1909-3744/freq__raw.png",   "psrplot/J1909-3744/freq__jd.png",
  "psrplot/J1909-3744/time__jf.png",    "psrplot/J1909-3744/time__jdf.png",
  "psrplot/J1909-3744/stokes__jft.png", "psrplot/J1909-3744/stokes__jdft.png",
  "psrplot/J1909-3744/pa__jdft.png",
]);

/** Available -j combinations per plot type, derived from AVAILABLE.
 *  Used to render the "available combinations" hint chips and to snap
 *  to the nearest existing combo when the user switches plot type. */
function availableJCombosFor(type, archive) {
  const out = [];
  const seen = new Set();
  for (const key of AVAILABLE) {
    const m = key.match(/^psrplot\/([^/]+)\/([^_]+)__([a-z]+)\.png$/);
    if (!m) continue;
    const [, ar, ty, jSfx] = m;
    if (ar !== archive || ty !== type) continue;
    if (seen.has(jSfx)) continue;
    seen.add(jSfx);
    out.push(jSfx);
  }
  return out;
}

/** Convert a jSuffix string back into a {D,F,T} bool record. */
function jFromSuffix(sfx) {
  return { D: sfx.includes("d"), F: sfx.includes("f"), T: sfx.includes("t") };
}

/* ============================================================
   COMMAND CATALOG
   ------------------------------------------------------------
   Each entry describes one *flow* the user can explore: a
   PSRCHIVE command + a discrete option space (radio-like) + an
   artifact filename built from the chosen options.

   `outKind`:
     - "image"     → PNG rendered in the output panel
     - "text"      → plain stdout rendered in a terminal panel
     - "annotated" → stdout with a .annot.json sidecar driving
                     per-column tooltips (e.g. pat .tim format)

   `artifact(state)` returns { path, command, note?, expected? }
   where `path` is relative to plots/ (no prefix).  When the
   file does not exist on disk the UI degrades gracefully.

   Group keys mirror the conceptual phases of timing work
   (inspect → plot → clean → combine → scrunch → template →
    timing) so the sidebar reads like the GettingTOAs workflow.
   ============================================================ */
const CATALOG = [
  // ----- INSPECT (text output) -----
  {
    id: "vap-header", cmd: "vap", group: "INSPECT", label: "vap · header summary",
    outKind: "annotated", blurb: "Read a few fields out of the archive header.",
    options: [{ id: "fields", label: "fields", choices: [
      { id: "compact",  cli: '-c "name,nbin,nchan,nsubint,length,bw"', label: "name + dims" },
      { id: "full",     cli: '-c "name,mjd,length,bw,freq,nchan,nbin,nsubint,npol,dm,rm,telescop,site"', label: "extended" },
    ]}],
    defaults: { fields: "compact" },
    artifact: (s, ar) => ({
      path: `vap/${ar}/${s.fields === "full" ? "all" : "header"}.txt`,
      annot: `vap/${ar}/${s.fields === "full" ? "all" : "header"}.annot.json`,
      command: `vap ${s.fields === "full" ? '-c "name,mjd,length,bw,freq,nchan,nbin,nsubint,npol,dm,rm,telescop,site"' : '-c "name,nbin,nchan,nsubint,length,bw"'} ${ar}.ar`,
    }),
  },
  {
    id: "psrstat", cmd: "psrstat", group: "INSPECT", label: "psrstat · derived quantities",
    outKind: "annotated", blurb: "Compute S/N, profile statistics, off-pulse RMS.",
    options: [{ id: "metric", label: "metric", choices: [
      { id: "snr",     cli: '-jFT -c "snr,off:avg,off:rms"', label: "S/N + off-pulse stats" },
      { id: "profile", cli: '-jFTp -c "all:bin:mean"',       label: "per-bin mean intensity" },
    ]}],
    defaults: { metric: "snr" },
    artifact: (s, ar) => ({
      path: `psrstat/${ar}/${s.metric}.txt`,
      annot: `psrstat/${ar}/${s.metric}.annot.json`,
      command: `psrstat ${s.metric === "snr" ? '-jFT -c "snr,off:avg,off:rms"' : '-jFTp -c "all:bin:mean"'} ${ar}.ar`,
    }),
  },

  // ----- PLOT (image output) -----
  // Note: psrplot is special-cased — it predates the CATALOG and lives in
  // the legacy `psrplot` mode below.  The entry here is a *pointer* the
  // sidebar can render that switches the UI to legacy single-mode.
  { id: "psrplot", cmd: "psrplot", group: "PLOT", label: "psrplot · phase × {freq|time|stokes|pa}",
    outKind: "legacy-psrplot", blurb: "The main plotting front-end.", options: [], defaults: {} },
  {
    id: "pav", cmd: "pav", group: "PLOT", label: "pav · short-flag plotter",
    outKind: "image", blurb: "Older but ubiquitous: same data, terser flags.",
    options: [{ id: "view", label: "view", choices: [
      { id: "dynamic", cli: "-DFTp -j D", label: "dynamic spectrum"  },
      { id: "stack",   cli: "-GTp  -j D", label: "subint stack"      },
      // pav -S* views (profile, stokes) need full-polarisation archives;
      // the bundled reference archives are Stokes I only, so those views
      // are unavailable here.  Re-add when an Iquv archive is in the set.
    ]}],
    defaults: { view: "dynamic" },
    artifact: (s, ar) => ({
      path: `pav/${ar}/${s.view}__jd.png`,
      command: `pav ${({ dynamic: "-DFTp", profile: "-SFTp", stack: "-GTp", stokes: "-SFTpd" })[s.view]} -j D ${ar}.ar -g out.png/PNG`,
    }),
  },

  // ----- CLEAN -----
  {
    id: "paz", cmd: "paz", group: "CLEAN", label: "paz · zap RFI",
    outKind: "image", blurb: "Mask channels or sub-integrations as zero-weight.",
    options: [{ id: "mode", label: "mode", choices: [
      { id: "auto",       cli: "-r",              label: "auto (-r)"        },
      { id: "manual-chans", cli: '-z "100 101 102"', label: "manual channels"  },
      { id: "freqrange",  cli: '-F "1200 1280"',   label: "frequency range"  },
      { id: "badsub",     cli: '-w "0 5"',         label: "drop sub-ints 0,5"},
    ]}],
    defaults: { mode: "auto" },
    artifact: (s, ar) => {
      const fname = ({ auto: "auto", "manual-chans": "manual-chans", freqrange: "freqrange", badsub: "badsub" })[s.mode];
      const cli = ({ auto: "-r -e r", "manual-chans": '-z "100 101 102" -e z', freqrange: '-F "1200 1280" -e F', badsub: '-w "0 5" -e w' })[s.mode];
      return {
        path: `paz/${ar}/${fname}.png`,
        command: `paz ${cli} ${ar}.ar  &&  psrplot -p freq ${ar}.<ext> -D out.png/png`,
      };
    },
  },

  // ----- COMBINE -----
  {
    id: "psradd", cmd: "psradd", group: "COMBINE", label: "psradd · combine archives",
    outKind: "annotated", blurb: "Append sub-integrations from many files into one.",
    options: [], defaults: {},
    artifact: (s, ar) => ({
      path: `psradd/${ar}/combine.meta.txt`,
      annot: `psradd/${ar}/combine.meta.annot.json`,
      command: `psradd -o summed.ar ${ar}_ep1.ar ${ar}_ep2.ar  &&  vap -c "nbin,nchan,nsubint,length" summed.ar`,
    }),
  },

  // ----- SCRUNCH -----
  {
    id: "pam-fscrunch", cmd: "pam", group: "SCRUNCH", label: "pam · fscrunch channels",
    outKind: "image+meta", blurb: "Sum adjacent frequency channels.",
    options: [{ id: "nchn", label: "target N_chan", choices: [
      { id: "8",   cli: "--setnchn 8 -e f8",     label: "8"   },
      { id: "32",  cli: "--setnchn 32 -e f32",   label: "32"  },
      { id: "128", cli: "--setnchn 128 -e f128", label: "128" },
    ]}],
    defaults: { nchn: "32" },
    artifact: (s, ar) => ({
      path: `pam/${ar}/fscrunch-${s.nchn}.png`,
      metaPath: `pam/${ar}/fscrunch-${s.nchn}.meta.txt`,
      metaAnnot: `pam/${ar}/fscrunch-${s.nchn}.meta.annot.json`,
      command: `pam --setnchn ${s.nchn} -e f${s.nchn} ${ar}.ar  &&  psrplot -p freq ${ar}.f${s.nchn} -D out.png/png`,
    }),
  },
  {
    id: "pam-tscrunch", cmd: "pam", group: "SCRUNCH", label: "pam · tscrunch sub-integrations",
    outKind: "image+meta", blurb: "Sum adjacent sub-integrations in time.",
    options: [{ id: "nsub", label: "target N_subint", choices: [
      { id: "1",  cli: "-T -e Tscr",         label: "1 (all)" },
      { id: "4",  cli: "--setnsub 4 -e t4",   label: "4"      },
      { id: "16", cli: "--setnsub 16 -e t16", label: "16"     },
    ]}],
    defaults: { nsub: "1" },
    artifact: (s, ar) => ({
      path: `pam/${ar}/tscrunch-${s.nsub}.png`,
      metaPath: `pam/${ar}/tscrunch-${s.nsub}.meta.txt`,
      metaAnnot: `pam/${ar}/tscrunch-${s.nsub}.meta.annot.json`,
      command: `pam ${s.nsub === "1" ? "-T -e Tscr" : `--setnsub ${s.nsub} -e t${s.nsub}`} ${ar}.ar  &&  psrplot -p time ${ar}.${s.nsub === "1" ? "Tscr" : "t" + s.nsub} -D out.png/png`,
    }),
  },
  {
    id: "pam-bscrunch", cmd: "pam", group: "SCRUNCH", label: "pam · bscrunch phase bins",
    outKind: "image+meta", blurb: "Sum adjacent phase bins.",
    options: [{ id: "nbin", label: "target N_bin", choices: [
      { id: "256",  cli: "--setnbin 256 -e b256",   label: "256"  },
      { id: "1024", cli: "--setnbin 1024 -e b1024", label: "1024" },
    ]}],
    defaults: { nbin: "1024" },
    artifact: (s, ar) => ({
      path: `pam/${ar}/bscrunch-${s.nbin}.png`,
      metaPath: `pam/${ar}/bscrunch-${s.nbin}.meta.txt`,
      metaAnnot: `pam/${ar}/bscrunch-${s.nbin}.meta.annot.json`,
      command: `pam --setnbin ${s.nbin} -e b${s.nbin} ${ar}.ar  &&  psrplot -p flux -jFT ${ar}.b${s.nbin} -D out.png/png`,
    }),
  },

  // ----- TEMPLATE -----
  {
    id: "psrsmooth", cmd: "psrsmooth", group: "TEMPLATE", label: "psrsmooth · smooth to standard",
    outKind: "image", blurb: "Wavelet-smooth a high-S/N profile into a noise-free template.",
    options: [], defaults: {},
    artifact: (s, ar) => ({
      path: `pipelines/template+pat/template.png`,
      command: `pam -FT -e FT ${ar}.ar  &&  psrsmooth -W ${ar}.FT  &&  psrplot -p flux ${ar}.FT.sm -D out.png/png`,
    }),
  },

  // ----- TIMING -----
  {
    id: "pat", cmd: "pat", group: "TIMING", label: "pat · generate TOAs (.tim)",
    outKind: "annotated", blurb: "Cross-correlate vs a template, emit one TOA line per sub-integration.",
    options: [{ id: "format", label: "format", choices: [
      { id: "tempo2", cli: "-f 'tempo2 IPTA'", label: "tempo2 IPTA" },
      { id: "princeton", cli: "", label: "princeton (default)" },
    ]}, { id: "algo", label: "algorithm", choices: [
      { id: "FDM", cli: "-A FDM", label: "FDM (frequency-domain)" },
      { id: "PGS", cli: "-A PGS", label: "PGS (phase-gradient)" },
    ]}],
    defaults: { format: "tempo2", algo: "FDM" },
    artifact: (s, ar) => ({
      path: `pat/${ar}/toas.tim`,
      annot: `pat/${ar}/toas.annot.json`,
      command: `pat -s template.std ${({FDM:"-A FDM",PGS:"-A PGS"})[s.algo]} ${({tempo2:"-f 'tempo2 IPTA'",princeton:""})[s.format]} ${ar}.ar > toas.tim`,
    }),
  },
];

const CATALOG_BY_ID = Object.fromEntries(CATALOG.map(e => [e.id, e]));
const CATALOG_GROUPS = ["INSPECT", "PLOT", "CLEAN", "COMBINE", "SCRUNCH", "TEMPLATE", "TIMING"];

/* ---------- TextOutput: monospace stdout panel with .annot.json tooltips ---------- */
function TextOutput({ src, annotSrc, command }) {
  const [text, setText] = useState(null);
  const [annot, setAnnot] = useState(null);
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setText(null); setAnnot(null); setError(null);
    fetch(src).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
      if (!cancelled) setText(t);
    }).catch(e => { if (!cancelled) setError(String(e)); });
    if (annotSrc) {
      fetch(annotSrc).then(r => r.ok ? r.json() : null).then(j => {
        if (!cancelled && j) setAnnot(j);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [src, annotSrc]);

  if (error) {
    return (
      <div style={{ width: "min(680px, 95%)", padding: "22px 24px", border: "1px dashed #2a4538", borderRadius: 6, background: "#0d1714", color: "#cfe3d7" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, color: "#e0a36a", textTransform: "uppercase", letterSpacing: 1.4 }}>
          not precomputed
        </div>
        <div style={{ fontSize: 13, marginTop: 6, color: "#9fbeae", lineHeight: 1.5 }}>
          Expected <code>{src}</code> but didn't find it. Run the command on your own archive:
        </div>
        <div className="sk-code" style={{ marginTop: 10, fontSize: 12 }}>
          <span className="prompt">$</span> {command}
        </div>
        <button onClick={() => navigator.clipboard?.writeText(command)}
          style={{ marginTop: 10, padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11, background: "transparent", color: "#4dbb91", border: "1px solid #4dbb91", borderRadius: 4, cursor: "pointer" }}>📋 copy command</button>
      </div>
    );
  }
  if (text == null) {
    return <div style={{ color: "#7c9c8d", fontFamily: "var(--font-mono)", fontSize: 12 }}>loading…</div>;
  }

  // For .tim files which can be huge, only show the first N lines.
  const MAX_LINES = 8;
  const allLines = text.split(/\r?\n/);
  const truncated = allLines.length > MAX_LINES;
  const shownLines = truncated ? allLines.slice(0, MAX_LINES) : allLines;

  // annotation rendering: for each shown line we look for spans whose
  // `line` matches and wrap their slice in a <span> with a tooltip.
  const lineHasAnnot = (lineNo) => annot?.spans?.some(s => (s.line ?? 0) === lineNo);

  return (
    <div style={{ width: "min(820px, 100%)", textAlign: "left" }}>
      <div className="sk-row" style={{ alignItems: "baseline", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>output → <code>{src.split("/").slice(-1)[0]}</code></span>
        {annot && (
          <label className="sk-row" style={{ marginLeft: "auto", gap: 6, color: "#9fd3b9", fontFamily: "var(--font-mono)", fontSize: 11, cursor: "pointer" }}>
            <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} style={{ accentColor: "#4dbb91" }} />
            highlight annotated columns
          </label>
        )}
      </div>
      <pre style={{
        background: "#0d1714", color: "#d5ecdd", border: "1px solid #1b2c25",
        padding: "14px 18px", borderRadius: 4, fontFamily: "var(--font-mono)",
        fontSize: 12.5, lineHeight: 1.55, overflowX: "auto", margin: 0,
        whiteSpace: "pre", maxHeight: 360,
      }}>
        {shownLines.map((ln, li) => (
          <div key={li} style={{ minHeight: 18 }}>
            {annot && lineHasAnnot(li)
              ? renderAnnotatedLine(ln, li, annot.spans, showAll)
              : ln || " "}
          </div>
        ))}
        {truncated && (
          <div style={{ color: "#7c9c8d", marginTop: 6 }}>
            … {allLines.length - MAX_LINES} more lines · the rest are at <code>{src}</code>
          </div>
        )}
      </pre>
      {annot?.spans?.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 14px", background: "#0a100d", border: "1px solid #1b2c25", borderRadius: 4 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4, marginBottom: 6 }}>what the columns mean</div>
          <div className="sk-col sk-gap-2">
            {Array.from(new Map(annot.spans.map(s => [s.kind || s.label, s])).values()).map((s, i) => (
              <div key={i} className="sk-row" style={{ gap: 10, fontSize: 12, fontFamily: "var(--font-body)", color: "#cfe3d7" }}>
                <span style={{ display: "inline-block", width: 10, height: 10, background: kindColor(s.kind || ""), borderRadius: 2 }} />
                <span style={{ fontFamily: "var(--font-mono)", color: "#9fd3b9", minWidth: 90 }}>{s.kind || "field"}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function kindColor(kind) {
  return ({
    filename:    "#7c9c8d",
    frequency:   "#4dbb91",
    mjd:         "#e0a36a",
    error:       "#c25a2c",
    observatory: "#7a4fb8",
    flag:        "#3a78b8",
  })[kind] || "#9fbeae";
}

function renderAnnotatedLine(text, lineIdx, spans, showAll) {
  // spans for this line, sorted by start
  const onLine = spans.filter(s => (s.line ?? 0) === lineIdx).slice().sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;
  onLine.forEach((s, i) => {
    if (s.start > cursor) parts.push(<span key={`p${i}`}>{text.slice(cursor, s.start)}</span>);
    const slice = text.slice(s.start, s.end);
    const c = kindColor(s.kind || "");
    parts.push(
      <span key={`s${i}`} title={`${s.kind || "field"}: ${s.label}`}
        style={{
          background: showAll ? c + "22" : "transparent",
          borderBottom: `1.5px dotted ${c}`,
          cursor: "help",
          padding: "0 1px",
        }}>{slice}</span>
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(<span key="tail">{text.slice(cursor)}</span>);
  return parts;
}

const PIPELINES = [
  {
    id: "psradd+pamT+psrplot",
    label: "psradd → pam -T → psrplot",
    blurb: "Combine two epochs, then time-scrunch, then plot phase × time.",
    steps: [
      { cmd: "psradd",  flags: "-o added.ar ep1.ar ep2.ar",            out: "added.ar",       img: "pipelines/psradd+pamT+psrplot/added__step2.png" },
      { cmd: "pam",     flags: "-T -e Tscr added.ar",                  out: "added.Tscr",     img: "pipelines/psradd+pamT+psrplot/added-tscr__step3.png" },
      { cmd: "psrplot", flags: "-p time -j F added.Tscr -D out.png/png", out: "→ image",      img: "pipelines/psradd+pamT+psrplot/final.png" },
    ],
  },
  {
    id: "paz+pamFT+stokes",
    label: "paz → pam -FT → psrplot stokes",
    blurb: "Zap RFI, scrunch fully, plot Stokes parameters.",
    steps: [
      { cmd: "paz",     flags: "-r -e zap ${ar}.ar",                   out: "${ar}.zap",      img: "pipelines/paz+pamFT+stokes/zapped.png" },
      { cmd: "pam",     flags: "-FT -e FT ${ar}.zap",                  out: "${ar}.zap.FT",   img: "pipelines/paz+pamFT+stokes/scrunched.png" },
      { cmd: "psrplot", flags: "-p stokes ${ar}.zap.FT -D out.png/png", out: "→ image",       img: "pipelines/paz+pamFT+stokes/final.png" },
    ],
  },
  {
    id: "template+pat",
    label: "psrsmooth → pat",
    blurb: "Build a template, then generate TOAs against it.",
    steps: [
      { cmd: "psrplot", flags: "-p flux -j FT ${ar}.ar",               out: "profile.png",    img: "pipelines/template+pat/profile.png" },
      { cmd: "psrsmooth", flags: "-W ${ar}.FT",                        out: "${ar}.FT.sm",    img: "pipelines/template+pat/template.png" },
      { cmd: "pat",     flags: "-s template.std ${ar}.ar > toa.tim",   out: "toa.tim",        img: "pipelines/template+pat/residual.png" },
    ],
  },
  {
    id: "end-to-end",
    label: "vap → paz → pam → psrsmooth → pat",
    blurb: "Full inspection → clean → scrunch → template → TOAs workflow.",
    steps: [
      { cmd: "vap",       flags: '-c "name,nbin,nchan,nsubint" ${ar}.ar',     out: "header",          img: "vap/J0437-4715/header.txt",                          textOnly: true, annot: "vap/J0437-4715/header.annot.json" },
      { cmd: "paz",       flags: "-r -e zap ${ar}.ar",                        out: "${ar}.zap",       img: "pipelines/paz+pamFT+stokes/zapped.png" },
      { cmd: "pam",       flags: "-FT -e FT ${ar}.zap",                       out: "${ar}.zap.FT",    img: "pipelines/paz+pamFT+stokes/scrunched.png" },
      { cmd: "psrsmooth", flags: "-W ${ar}.zap.FT",                           out: "${ar}.zap.FT.sm", img: "pipelines/template+pat/template.png" },
      { cmd: "pat",       flags: "-s template.std -A FDM ${ar}.ar > toa.tim", out: "toa.tim",         img: "pat/J0437-4715/toas.tim",                            textOnly: true, annot: "pat/J0437-4715/toas.annot.json" },
    ],
  },
];

/* ---------- builders ---------- */
function jSuffix(j) {
  // alphabetised lowercase concatenation, "raw" if empty (matches plots-spec)
  const s = ["d", "f", "t"].filter(k => j[k.toUpperCase()]).join("");
  return s || "raw";
}
function buildSingleCommand({ archive, type, j }) {
  const ops = ["D", "F", "T"].filter(k => j[k]).join("");
  const jflag = ops ? `-j ${ops} ` : "";
  return `psrplot -p ${type} ${jflag}${archive}.ar -D out.png/png`;
}
function expectedFilename({ archive, type, j }) {
  return `plots/psrplot/${archive}/${type}__${jSuffix(j)}.png`;
}

/* ---------- image with graceful fallback ---------- */
function PlotImage({ src, fallbackCommand, fallbackNote }) {
  const [state, setState] = useState("loading"); // loading | ok | missing
  useEffect(() => {
    setState("loading");
    const im = new Image();
    im.onload = () => setState("ok");
    im.onerror = () => setState("missing");
    im.src = src;
  }, [src]);
  if (state === "ok") {
    return (
      <div style={{ border: "1px solid #1b2c25", padding: 4, background: "#000" }}>
        <img src={src} alt="" style={{ display: "block", maxWidth: "100%", maxHeight: 420 }} />
      </div>
    );
  }
  return (
    <div style={{ width: "min(560px, 90%)", padding: "22px 24px", border: "1px dashed #2a4538", borderRadius: 6, background: "#0d1714", color: "#cfe3d7" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, color: "#e0a36a", textTransform: "uppercase", letterSpacing: 1.4 }}>
        {state === "loading" ? "loading…" : "not precomputed"}
      </div>
      {state === "missing" && (
        <>
          <div style={{ fontSize: 13, marginTop: 6, color: "#9fbeae", lineHeight: 1.5 }}>
            {fallbackNote || "This combination of flags isn't in the precomputed gallery. Run it on your own archive:"}
          </div>
          <div className="sk-code" style={{ marginTop: 10, fontSize: 12 }}>
            <span className="prompt">$</span> {fallbackCommand}
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(fallbackCommand)}
            style={{ marginTop: 10, padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11, background: "transparent", color: "#4dbb91", border: "1px solid #4dbb91", borderRadius: 4, cursor: "pointer" }}
          >📋 copy command</button>
        </>
      )}
    </div>
  );
}

/* ---------- gallery row (sidebar) ---------- */
function GalleryRow({ active, label, indent = 0, header = false, onClick }) {
  return (
    <button onClick={onClick} disabled={header}
      style={{
        textAlign: "left", width: "100%",
        padding: `${header ? 7 : 4}px 14px 4px ${14 + indent * 12}px`,
        background: active ? "#1f3a30" : "transparent",
        color: active ? "#d5ecdd" : header ? "#cfe3d7" : "#9fbeae",
        fontWeight: header ? 600 : 400,
        borderLeft: active ? "2px solid #4dbb91" : "2px solid transparent",
        border: 0,
        fontFamily: "var(--font-mono)", fontSize: 12,
        cursor: header ? "default" : "pointer",
        textTransform: header ? "uppercase" : "none",
        letterSpacing: header ? 1.2 : 0,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{label}</button>
  );
}

function InteractiveV2() {
  const [mode, setMode] = useState("single"); // 'single' | 'pipeline' | 'catalog'
  const [archive, setArchive] = useState("J0437-4715");
  const [type, setType] = useState("freq");
  const [j, setJ] = useState({ D: false, F: false, T: false });
  const [pipelineId, setPipelineId] = useState(PIPELINES[0].id);
  const [pipelineStep, setPipelineStep] = useState(2);

  // ---- catalog mode (Phase C — pav, pam, paz, vap, psrstat, pat) ----
  const [catalogId, setCatalogId] = useState("pav");
  const [catalogOpts, setCatalogOpts] = useState(() => ({ ...CATALOG_BY_ID["pav"].defaults }));
  const catalogItem = CATALOG_BY_ID[catalogId] || CATALOG[0];
  const catalogArtifact = useMemo(
    () => catalogItem.artifact ? catalogItem.artifact(catalogOpts, archive) : null,
    [catalogItem, catalogOpts, archive]
  );

  // Pick a catalog item: reset options to its defaults.  If it's the
  // legacy-psrplot pointer, switch to single mode instead.
  const selectCatalog = (id) => {
    const it = CATALOG_BY_ID[id];
    if (!it) return;
    if (it.outKind === "legacy-psrplot") { setMode("single"); return; }
    setMode("catalog");
    setCatalogId(id);
    setCatalogOpts({ ...it.defaults });
  };

  // active artifacts
  const single = useMemo(() => {
    const file = expectedFilename({ archive, type, j });
    const rel = file.replace(/^plots\//, "");
    return {
      file,
      command: buildSingleCommand({ archive, type, j }),
      available: AVAILABLE.has(rel),
    };
  }, [archive, type, j]);

  const pipeline = useMemo(() => PIPELINES.find(p => p.id === pipelineId), [pipelineId]);
  const currentStep = pipeline && pipeline.steps[pipelineStep];

  // When the user changes plot type via the inspector radio, snap -j to the
  // nearest available combo for that type+archive.  Prefer the type's
  // defaultJ if its filename exists, otherwise fall back to the first
  // available combo, otherwise leave the current j unchanged.
  const selectType = (nextType) => {
    const combos = availableJCombosFor(nextType, archive); // e.g. ["jft","jdft"]
    if (combos.length === 0) { setType(nextType); return; }
    const pt = PLOT_TYPES.find(p => p.id === nextType);
    const wantSfx = pt ? jSuffix(pt.defaultJ) : combos[0];
    const sfx = combos.includes(wantSfx) ? wantSfx : combos[0];
    setType(nextType);
    setJ(jFromSuffix(sfx));
  };

  const availableCombos = useMemo(
    () => availableJCombosFor(type, archive),
    [type, archive]
  );

  // When the user switches archive, snap -j to a combo that exists for the
  // current plot type on the new archive (both archives currently share the
  // same set, but this future-proofs against asymmetric coverage).
  const selectArchive = (nextArchive) => {
    const combos = availableJCombosFor(type, nextArchive);
    setArchive(nextArchive);
    if (combos.length === 0) return;
    const curSfx = jSuffix(j);
    if (!combos.includes(curSfx)) {
      const pt = PLOT_TYPES.find(p => p.id === type);
      const wantSfx = pt ? jSuffix(pt.defaultJ) : combos[0];
      setJ(jFromSuffix(combos.includes(wantSfx) ? wantSfx : combos[0]));
    }
  };

  const setPreset = (preset) => {
    if (preset.type === "single") {
      setMode("single");
      setArchive(preset.archive);
      setType(preset.plot);
      setJ(preset.j);
    } else {
      setMode("pipeline");
      setPipelineId(preset.id);
      setPipelineStep(preset.steps - 1);
    }
  };

  return (
    <div className="sk-page" style={{ width: V2_IPG_W, minHeight: V2_IPG_H, overflow: "hidden", background: "#0d1714" }}>
      {/* workspace bar */}
      <div className="sk-row" style={{ background: "#0a100d", color: "#cfe3d7", height: 32, alignItems: "center", paddingLeft: 14, gap: 18, borderBottom: "1px solid #1b2c25" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>workspace</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>
          {mode === "single" ? `psrplot · ${archive}`
            : mode === "catalog" ? `${catalogItem.cmd} · ${archive}`
            : `pipeline · ${pipeline.label}`}
        </span>
        <span style={{ marginLeft: "auto", marginRight: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>
          mode:
          {[
            ["single", "psrplot"],
            ["catalog", "other cmd"],
            ["pipeline", "pipeline"],
          ].map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{ marginLeft: 6, padding: "2px 8px",
                background: mode === m ? "#1f3a30" : "transparent",
                color: mode === m ? "#d5ecdd" : "#7c9c8d",
                border: "1px solid #2a4538", borderRadius: 3, cursor: "pointer",
                fontFamily: "var(--font-mono)", fontSize: 11 }}>{lbl}</button>
          ))}
        </span>
      </div>

      <div className="ipg-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", minHeight: V2_IPG_H - 32 - 32 }}>

        {/* ---------- LEFT: gallery ---------- */}
        <div style={{ background: "#0a100d", borderRight: "1px solid #1b2c25", overflow: "auto", maxHeight: V2_IPG_H - 64 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Gallery</div>

          {/* Catalog — grouped by phase of work (Phase C) */}
          {CATALOG_GROUPS.map(g => {
            const items = CATALOG.filter(c => c.group === g);
            if (!items.length) return null;
            return (
              <React.Fragment key={g}>
                <GalleryRow header label={`▾ ${g.toLowerCase()}`} />
                {items.map(it => {
                  const isActive = (it.outKind === "legacy-psrplot")
                    ? mode === "single"
                    : (mode === "catalog" && catalogId === it.id);
                  return (
                    <GalleryRow key={it.id} indent={1} label={it.label}
                      active={isActive}
                      onClick={() => selectCatalog(it.id)} />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Pipelines */}
          <GalleryRow header label="▾ Pipelines · multi-step" />
          {PIPELINES.map(p => (
            <GalleryRow
              key={p.id}
              indent={1}
              label={p.label}
              active={mode === "pipeline" && pipelineId === p.id}
              onClick={() => setPreset({ type: "pipeline", id: p.id, steps: p.steps.length })}
            />
          ))}

          <div style={{ padding: "12px 14px 4px", marginTop: 10, borderTop: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Archives</div>
          {ARCHIVES.map(ar => (
            <button key={ar.id} onClick={() => selectArchive(ar.id)}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "3px 14px",
                color: archive === ar.id ? "#d5ecdd" : "#9fbeae",
                background: archive === ar.id ? "#13201b" : "transparent",
                border: 0, fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer",
              }}>📦 {ar.id}.ar</button>
          ))}
        </div>

        {/* ---------- MIDDLE: editor + output ---------- */}
        <div style={{ display: "flex", flexDirection: "column", background: "#0d1714", minWidth: 0 }}>

          {mode === "pipeline" && (
            <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #1b2c25", background: "#0a100d" }}>
              <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>Pipeline · {pipeline.steps.length} steps</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>{pipeline.blurb}</span>
              </div>
              <div className="sk-row" style={{ alignItems: "stretch", gap: 0, flexWrap: "wrap" }}>
                {pipeline.steps.map((s, i) => {
                  const ed = i === pipelineStep;
                  return (
                    <React.Fragment key={i}>
                      <button onClick={() => setPipelineStep(i)} style={{
                        flex: "1 1 180px", padding: "9px 12px", borderRadius: 5,
                        background: ed ? "#1f3a30" : "#13201b",
                        border: ed ? "1px solid #4dbb91" : "1px solid #2a4538",
                        minWidth: 0, textAlign: "left", cursor: "pointer", fontFamily: "var(--font-body)",
                      }}>
                        <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#4dbb91" }}>{s.cmd}</span>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "#7c9c8d", letterSpacing: 0.6 }}>step {i + 1}</span>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: ed ? "#cfe3d7" : "#9fbeae", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.flags}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6a8378", marginTop: 3 }}>→ {s.out}</div>
                      </button>
                      {i < pipeline.steps.length - 1 && (
                        <div style={{ width: 26, display: "grid", placeItems: "center" }}>
                          <svg width="18" height="12"><path d="M0 6 L 14 6 M10 2 L 14 6 L 10 10" fill="none" stroke="#4dbb91" strokeWidth="1.4" strokeLinecap="round" /></svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* file tab */}
          <div className="sk-row" style={{ background: "#0a100d", borderBottom: "1px solid #1b2c25", height: 32, alignItems: "stretch" }}>
            <div style={{
              padding: "7px 14px", background: "#0d1714", color: "#d5ecdd",
              fontFamily: "var(--font-mono)", fontSize: 11,
              borderRight: "1px solid #1b2c25", borderTop: "2px solid #4dbb91", marginTop: -1,
            }}>{
              mode === "single" ? "command.sh ●"
              : mode === "catalog" ? `${catalogItem.cmd}.sh ●`
              : `step${pipelineStep + 1}.sh ●`
            }</div>
          </div>

          {/* command editor */}
          <div style={{ padding: "14px 18px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#cfe3d7", lineHeight: 1.7, background: "#0d1714", borderBottom: "1px solid #1b2c25", minHeight: 90 }}>
            <div className="sk-row" style={{ gap: 14 }}>
              <span style={{ color: "#3a5848", width: 16, textAlign: "right" }}>1</span>
              <span style={{ color: "#6a8378" }}># {
                mode === "single" ? "Configure flags on the right to change the output."
                : mode === "catalog" ? catalogItem.blurb
                : `step ${pipelineStep + 1} of ${pipeline.steps.length}`
              }</span>
            </div>
            <div className="sk-row" style={{ gap: 14 }}>
              <span style={{ color: "#3a5848", width: 16, textAlign: "right" }}>2</span>
              <span style={{ overflowWrap: "anywhere" }}>
                {mode === "single" ? (
                  <>
                    <span style={{ color: "#4dbb91" }}>psrplot</span>{" "}
                    <span style={{ color: "#e0a36a" }}>-p</span> {type}{" "}
                    {(j.D || j.F || j.T) && <><span style={{ color: "#e0a36a" }}>-j</span> {["D","F","T"].filter(k=>j[k]).join("")}{" "}</>}
                    {archive}.ar{" "}
                    <span style={{ color: "#e0a36a" }}>-D</span> <span style={{ color: "#c8d99f" }}>out.png/png</span>
                    <span style={{ background: "#cbe6d8", color: "#0d1714", marginLeft: 1 }}>&nbsp;</span>
                  </>
                ) : mode === "catalog" ? (
                  <>
                    <span style={{ color: "#4dbb91" }}>{catalogItem.cmd}</span>{" "}
                    <span style={{ color: "#cfe3d7" }}>{catalogArtifact?.command?.replace(new RegExp(`^${catalogItem.cmd}\\s+`), "") || ""}</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "#4dbb91" }}>{currentStep.cmd}</span>{" "}
                    {currentStep.flags}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* output */}
          <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", background: "#0a100d", minHeight: 380 }}>
            <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div className="sk-row" style={{ gap: 16, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>output</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>
                  {mode === "single"
                    ? `${type} · -j ${jSuffix(j).toUpperCase()} · ${archive} ${single.available ? "· cached" : "· not in cache"}`
                    : mode === "catalog"
                    ? `${catalogItem.id} · ${archive} · ${catalogItem.outKind}`
                    : `${pipeline.id} · step ${pipelineStep + 1} of ${pipeline.steps.length}`}
                </span>
              </div>
              <div className="sk-row sk-gap-8" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <button onClick={() => {
                  const cmd = mode === "single" ? single.command
                    : mode === "catalog" ? (catalogArtifact?.command || "")
                    : `${currentStep.cmd} ${currentStep.flags}`;
                  navigator.clipboard?.writeText(cmd);
                }}
                  style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3, background: "transparent", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>copy cmd</button>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {mode === "single" ? (
                single.available
                  ? <PlotImage src={single.file} fallbackCommand={single.command} />
                  : <PlotImage src={`__missing__/${type}__${jSuffix(j)}.png`} fallbackCommand={single.command} />
              ) : mode === "catalog" ? (
                catalogItem.outKind === "annotated" || catalogItem.outKind === "text"
                  ? <TextOutput
                      src={"plots/" + catalogArtifact.path}
                      annotSrc={catalogArtifact.annot ? "plots/" + catalogArtifact.annot : null}
                      command={catalogArtifact.command}
                    />
                  : catalogItem.outKind === "image+meta"
                    ? (
                        <div className="sk-col" style={{ gap: 14, alignItems: "center", width: "100%" }}>
                          <PlotImage src={"plots/" + catalogArtifact.path} fallbackCommand={catalogArtifact.command} />
                          {catalogArtifact.metaPath && (
                            <div style={{ width: "100%", maxWidth: 820 }}>
                              <TextOutput
                                src={"plots/" + catalogArtifact.metaPath}
                                annotSrc={catalogArtifact.metaAnnot ? "plots/" + catalogArtifact.metaAnnot : null}
                                command={"vap -c \"nbin,nchan,nsubint,npol,length,bw\" <result>.ar"}
                              />
                            </div>
                          )}
                        </div>
                      )
                    : <PlotImage src={"plots/" + catalogArtifact.path} fallbackCommand={catalogArtifact.command} />
              ) : (
                currentStep.textOnly
                  ? <TextOutput
                      src={"plots/" + currentStep.img}
                      annotSrc={currentStep.annot ? "plots/" + currentStep.annot : null}
                      command={`${currentStep.cmd} ${currentStep.flags}`}
                    />
                  : <PlotImage src={"plots/" + currentStep.img} fallbackCommand={`${currentStep.cmd} ${currentStep.flags}`} />
              )}
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: argument inspector ---------- */}
        <div style={{ background: "#0a100d", borderLeft: "1px solid #1b2c25", padding: 14, color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12, overflow: "auto", maxHeight: V2_IPG_H - 64 }}>
          <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Arguments</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4dbb91" }}>{
              mode === "single" ? "psrplot"
              : mode === "catalog" ? catalogItem.cmd
              : currentStep.cmd
            }</span>
          </div>

          {mode === "catalog" ? (
            <>
              <div style={{ marginTop: 12, padding: 10, background: "#13201b", borderRadius: 5, border: "1px solid #2a4538", color: "#9fd3b9", fontSize: 11, lineHeight: 1.5 }}>
                <b>{catalogItem.label}</b>
                <div style={{ color: "#7c9c8d", marginTop: 4 }}>{catalogItem.blurb}</div>
                <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "#e0a36a" }}>output kind · {catalogItem.outKind}</div>
              </div>

              {catalogItem.options.map(opt => (
                <React.Fragment key={opt.id}>
                  <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>
                    {opt.label}
                  </div>
                  <div className="sk-col" style={{ marginTop: 6, gap: 4 }}>
                    {opt.choices.map(ch => {
                      const active = catalogOpts[opt.id] === ch.id;
                      return (
                        <button key={ch.id} onClick={() => setCatalogOpts(o => ({ ...o, [opt.id]: ch.id }))}
                          style={{
                            textAlign: "left", padding: "6px 9px", borderRadius: 4, cursor: "pointer",
                            background: active ? "#1f3a30" : "transparent",
                            borderLeft: active ? "2px solid #4dbb91" : "2px solid transparent",
                            border: 0, color: active ? "#d5ecdd" : "#9fbeae",
                            fontFamily: "var(--font-mono)", fontSize: 12,
                          }}>
                          <span style={{ color: "#e0a36a", fontWeight: 700, marginRight: 6 }}>{ch.id}</span>
                          <span style={{ fontSize: 11, color: active ? "#cfe3d7" : "#6a8378" }}>{ch.label}</span>
                          {ch.cli && (
                            <div style={{ marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 10, color: active ? "#9fbeae" : "#4a5d54", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>$ {ch.cli}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </React.Fragment>
              ))}

              {/* archive */}
              <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>archive</div>
              <div className="sk-row" style={{ marginTop: 6, gap: 4 }}>
                {ARCHIVES.map(ar => (
                  <button key={ar.id} onClick={() => setArchive(ar.id)}
                    style={{ flex: 1, padding: "6px 8px", background: archive === ar.id ? "#1f3a30" : "transparent", border: "1px solid " + (archive === ar.id ? "#4dbb91" : "#2a4538"), borderRadius: 4, color: archive === ar.id ? "#d5ecdd" : "#9fbeae", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {ar.id}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 14, padding: 10, background: "rgba(224,133,106,.06)", borderRadius: 5, border: "1px solid #2a4538", fontSize: 11, lineHeight: 1.45, color: "#9fbeae" }}>
                Many of these artifacts are <i>planned</i> — the page degrades to "not precomputed" with a copyable command until <code>tools/gen/</code> scripts run against a real PSRCHIVE install. See <a href="../tools/HANDOFF.md" style={{ color: "#4dbb91" }}>tools/HANDOFF.md</a>.
              </div>
            </>
          ) : mode === "single" ? (
            <>
              {/* -p plot type */}
              <div style={{ marginTop: 12, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>-p <span style={{ color: "#7c9c8d", fontWeight: 400 }}>plot kind</span></div>
              <div className="sk-col" style={{ marginTop: 6, gap: 4 }}>
                {PLOT_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => selectType(pt.id)}
                    style={{
                      textAlign: "left", padding: "6px 9px", borderRadius: 4, cursor: "pointer",
                      background: type === pt.id ? "#1f3a30" : "transparent",
                      borderLeft: type === pt.id ? "2px solid #4dbb91" : "2px solid transparent",
                      border: 0, color: type === pt.id ? "#d5ecdd" : "#9fbeae",
                      fontFamily: "var(--font-mono)", fontSize: 12,
                    }}>
                    <span style={{ color: "#e0a36a", fontWeight: 700, marginRight: 6 }}>{pt.id}</span>
                    <span style={{ fontSize: 11, color: type === pt.id ? "#cfe3d7" : "#6a8378" }}>{pt.label}</span>
                  </button>
                ))}
              </div>

              {/* -j toggles */}
              <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>-j <span style={{ color: "#7c9c8d", fontWeight: 400 }}>pre-plot operations</span></div>
              <div className="sk-col" style={{ marginTop: 6, gap: 5 }}>
                {[
                  { k: "D", lbl: "dedisperse",  hint: "remove ν⁻² delay" },
                  { k: "F", lbl: "fscrunch all", hint: "sum frequency axis" },
                  { k: "T", lbl: "tscrunch all", hint: "sum time axis" },
                ].map(row => (
                  <label key={row.k} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 8px", background: j[row.k] ? "#13201b" : "transparent", border: "1px solid " + (j[row.k] ? "#4dbb91" : "#1b2c25"), borderRadius: 4, cursor: "pointer" }}>
                    <input type="checkbox" checked={j[row.k]} onChange={e => setJ({ ...j, [row.k]: e.target.checked })} style={{ accentColor: "#4dbb91" }} />
                    <span style={{ color: "#e0a36a", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 12, minWidth: 18 }}>-{row.k}</span>
                    <span style={{ color: "#d5ecdd", fontSize: 11 }}>{row.lbl}</span>
                    <span style={{ marginLeft: "auto", color: "#6a8378", fontSize: 10 }}>{row.hint}</span>
                  </label>
                ))}
              </div>

              {/* available combos hint — click to snap */}
              <div style={{ marginTop: 12, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>
                cached combos <span style={{ color: "#7c9c8d", fontWeight: 400 }}>for {type}</span>
              </div>
              <div className="sk-row" style={{ marginTop: 6, gap: 4, flexWrap: "wrap" }}>
                {availableCombos.length === 0 ? (
                  <span style={{ color: "#7c9c8d", fontSize: 11 }}>(none on disk for this archive)</span>
                ) : availableCombos.map(sfx => {
                  const active = sfx === jSuffix(j);
                  return (
                    <button key={sfx} onClick={() => setJ(jFromSuffix(sfx))}
                      style={{
                        padding: "3px 8px",
                        border: "1px solid " + (active ? "#4dbb91" : "#2a4538"),
                        background: active ? "#1f3a30" : "transparent",
                        color: active ? "#d5ecdd" : "#9fbeae",
                        borderRadius: 3, cursor: "pointer",
                        fontFamily: "var(--font-mono)", fontSize: 11,
                      }}>-j {sfx === "raw" ? "raw" : sfx.toUpperCase()}</button>
                  );
                })}
              </div>

              {/* archive */}
              <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>archive</div>
              <div className="sk-row" style={{ marginTop: 6, gap: 4 }}>
                {ARCHIVES.map(ar => (
                  <button key={ar.id} onClick={() => selectArchive(ar.id)}
                    style={{ flex: 1, padding: "6px 8px", background: archive === ar.id ? "#1f3a30" : "transparent", border: "1px solid " + (archive === ar.id ? "#4dbb91" : "#2a4538"), borderRadius: 4, color: archive === ar.id ? "#d5ecdd" : "#9fbeae", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {ar.id}
                  </button>
                ))}
              </div>

              {/* status */}
              <div style={{ marginTop: 14, padding: 10, background: single.available ? "#13201b" : "rgba(224,133,106,.10)", borderRadius: 5, border: "1px solid " + (single.available ? "#2a4538" : "#5a3a2a"), fontSize: 11, lineHeight: 1.45 }}>
                {single.available
                  ? <span style={{ color: "#9fd3b9" }}>✓ <b>cached</b> — loading <code style={{ color: "#cfe3d7" }}>{single.file.replace(/^plots\//, "")}</code></span>
                  : <span style={{ color: "#e0a36a" }}>⚠ this combo isn't in the precomputed gallery — copy the command and run locally to see it.</span>}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginTop: 12, padding: 10, background: "#13201b", borderRadius: 5, border: "1px solid #2a4538", color: "#9fd3b9", fontSize: 11, lineHeight: 1.5 }}>
                <b>{pipeline.label}</b>
                <div style={{ color: "#7c9c8d", marginTop: 4 }}>{pipeline.blurb}</div>
              </div>
              <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>step {pipelineStep + 1} of {pipeline.steps.length}</div>
              <div className="sk-code" style={{ marginTop: 6, fontSize: 11 }}>
                <span className="prompt">$</span> {currentStep.cmd} {currentStep.flags}
              </div>
              <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>intermediate outputs</div>
              <div className="sk-col sk-gap-6" style={{ marginTop: 6 }}>
                {pipeline.steps.map((s, i) => (
                  <button key={i} onClick={() => setPipelineStep(i)} style={{
                    padding: "6px 8px",
                    border: i === pipelineStep ? "1px solid #4dbb91" : "1px solid #1b2c25",
                    background: i === pipelineStep ? "#13201b" : "transparent",
                    borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", color: "inherit", fontFamily: "var(--font-mono)", fontSize: 11,
                  }}>
                    <span style={{ color: "#cfe3d7" }}>{s.out}</span>
                    <span style={{ color: "#7c9c8d", fontSize: 10 }}>{i === pipelineStep ? "← shown" : "view"}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* status bar */}
      <div className="sk-row" style={{ background: "#0e3b2e", color: "#d5ecdd", height: 32, fontFamily: "var(--font-mono)", fontSize: 11, alignItems: "center", padding: "0 14px", gap: 18, flexWrap: "wrap" }}>
        <span>✓ ready</span>
        <span>{
          mode === "single" ? `psrplot · 1 archive · ${jSuffix(j).toUpperCase()}`
          : mode === "catalog" ? `${catalogItem.cmd} · ${catalogItem.group.toLowerCase()}`
          : `${pipeline.id} · ${pipeline.steps.length} steps`
        }</span>
        <span style={{ marginLeft: "auto" }}>{
          mode === "pipeline" ? "step cached"
          : mode === "single" ? (single.available ? "image cached" : "missing — copy + run")
          : "see right panel"
        }</span>
      </div>
    </div>
  );
}

Object.assign(window, { InteractiveV2, V2_IPG_W, V2_IPG_H });
