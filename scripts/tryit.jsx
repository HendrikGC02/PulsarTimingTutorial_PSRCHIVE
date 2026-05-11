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
  { id: "flux",   label: "flux profile",     defaultJ: { D: true,  F: true,  T: true  }, group: "Profiles" },
  { id: "freq",   label: "phase × frequency", defaultJ: { D: false, F: false, T: false }, group: "Phase × frequency" },
  { id: "time",   label: "phase × time",      defaultJ: { D: false, F: true,  T: false }, group: "Phase × time" },
  { id: "stokes", label: "stokes profile",   defaultJ: { D: true,  F: true,  T: true  }, group: "Polarisation" },
  { id: "pa",     label: "position angle",   defaultJ: { D: true,  F: true,  T: true  }, group: "Polarisation" },
  { id: "pat",    label: "phase-aligned",    defaultJ: { D: true,  F: true,  T: true  }, group: "Other" },
];

// Filenames listed in plots-spec.md as actually generated:
const AVAILABLE = new Set([
  "psrplot/J0437-4715/flux__jft.png",   "psrplot/J0437-4715/flux__jdft.png",
  "psrplot/J0437-4715/freq__raw.png",   "psrplot/J0437-4715/freq__jd.png",
  "psrplot/J0437-4715/time__jf.png",    "psrplot/J0437-4715/time__jdf.png",
  "psrplot/J0437-4715/stokes__jft.png", "psrplot/J0437-4715/stokes__jdft.png",
  "psrplot/J0437-4715/pa__jdft.png",    "psrplot/J0437-4715/pat__jdft.png",
  "psrplot/J1909-3744/flux__jft.png",   "psrplot/J1909-3744/flux__jdft.png",
  "psrplot/J1909-3744/freq__raw.png",   "psrplot/J1909-3744/freq__jd.png",
  "psrplot/J1909-3744/time__jf.png",    "psrplot/J1909-3744/time__jdf.png",
  "psrplot/J1909-3744/stokes__jft.png", "psrplot/J1909-3744/stokes__jdft.png",
  "psrplot/J1909-3744/pa__jdft.png",    "psrplot/J1909-3744/pat__jdft.png",
]);

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
  const [mode, setMode] = useState("single"); // 'single' | 'pipeline'
  const [archive, setArchive] = useState("J0437-4715");
  const [type, setType] = useState("freq");
  const [j, setJ] = useState({ D: false, F: false, T: false });
  const [pipelineId, setPipelineId] = useState(PIPELINES[0].id);
  const [pipelineStep, setPipelineStep] = useState(2);

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
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>{mode === "single" ? `archive · ${archive}` : `pipeline · ${pipeline.label}`}</span>
        <span style={{ marginLeft: "auto", marginRight: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>
          mode:
          <button onClick={() => setMode("single")} style={{ marginLeft: 8, padding: "2px 8px", background: mode === "single" ? "#1f3a30" : "transparent", color: mode === "single" ? "#d5ecdd" : "#7c9c8d", border: "1px solid #2a4538", borderRadius: 3, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>single</button>
          <button onClick={() => setMode("pipeline")} style={{ marginLeft: 4, padding: "2px 8px", background: mode === "pipeline" ? "#1f3a30" : "transparent", color: mode === "pipeline" ? "#d5ecdd" : "#7c9c8d", border: "1px solid #2a4538", borderRadius: 3, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>pipeline</button>
        </span>
      </div>

      <div className="ipg-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", minHeight: V2_IPG_H - 32 - 32 }}>

        {/* ---------- LEFT: gallery ---------- */}
        <div style={{ background: "#0a100d", borderRight: "1px solid #1b2c25", overflow: "auto", maxHeight: V2_IPG_H - 64 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Gallery</div>

          {/* Single command presets — grouped by plot type, per archive */}
          <GalleryRow header label="▾ Single commands" />
          {ARCHIVES.map(ar => (
            <React.Fragment key={ar.id}>
              <GalleryRow header label={`   ${ar.id}`} />
              {PLOT_TYPES.map(pt => {
                // preset = the default j flags from plots-spec
                const presetJ = pt.defaultJ;
                const fname = `psrplot/${ar.id}/${pt.id}__${jSuffix(presetJ)}.png`;
                if (!AVAILABLE.has(fname)) return null;
                const isActive = mode === "single" && archive === ar.id && type === pt.id
                  && j.D === presetJ.D && j.F === presetJ.F && j.T === presetJ.T;
                return (
                  <GalleryRow
                    key={pt.id}
                    indent={1}
                    label={`${pt.id}  · -j ${jSuffix(presetJ).toUpperCase()}`}
                    active={isActive}
                    onClick={() => setPreset({ type: "single", archive: ar.id, plot: pt.id, j: presetJ })}
                  />
                );
              })}
            </React.Fragment>
          ))}

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
            <button key={ar.id} onClick={() => setArchive(ar.id)}
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
            }}>{mode === "single" ? "command.sh ●" : `step${pipelineStep + 1}.sh ●`}</div>
          </div>

          {/* command editor */}
          <div style={{ padding: "14px 18px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#cfe3d7", lineHeight: 1.7, background: "#0d1714", borderBottom: "1px solid #1b2c25", minHeight: 90 }}>
            <div className="sk-row" style={{ gap: 14 }}>
              <span style={{ color: "#3a5848", width: 16, textAlign: "right" }}>1</span>
              <span style={{ color: "#6a8378" }}># {mode === "single" ? "Configure flags on the right to change the output." : `step ${pipelineStep + 1} of ${pipeline.steps.length}`}</span>
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
                    : `${pipeline.id} · step ${pipelineStep + 1} of ${pipeline.steps.length}`}
                </span>
              </div>
              <div className="sk-row sk-gap-8" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <button onClick={() => navigator.clipboard?.writeText(mode === "single" ? single.command : `${currentStep.cmd} ${currentStep.flags}`)}
                  style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3, background: "transparent", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}>copy cmd</button>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {mode === "single" ? (
                single.available
                  ? <PlotImage src={single.file} fallbackCommand={single.command} />
                  : <PlotImage src={`__missing__/${type}__${jSuffix(j)}.png`} fallbackCommand={single.command} />
              ) : (
                <PlotImage src={"plots/" + currentStep.img} fallbackCommand={`${currentStep.cmd} ${currentStep.flags}`} />
              )}
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: argument inspector ---------- */}
        <div style={{ background: "#0a100d", borderLeft: "1px solid #1b2c25", padding: 14, color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12, overflow: "auto", maxHeight: V2_IPG_H - 64 }}>
          <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Arguments</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4dbb91" }}>{mode === "single" ? "psrplot" : currentStep.cmd}</span>
          </div>

          {mode === "single" ? (
            <>
              {/* -p plot type */}
              <div style={{ marginTop: 12, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#9fd3b9", textTransform: "uppercase", letterSpacing: 1.4 }}>-p <span style={{ color: "#7c9c8d", fontWeight: 400 }}>plot kind</span></div>
              <div className="sk-col" style={{ marginTop: 6, gap: 4 }}>
                {PLOT_TYPES.map(pt => (
                  <button key={pt.id} onClick={() => setType(pt.id)}
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
        <span>{mode === "single" ? `psrplot · 1 archive · ${jSuffix(j).toUpperCase()}` : `${pipeline.id} · ${pipeline.steps.length} steps`}</span>
        <span style={{ marginLeft: "auto" }}>{single.available || mode === "pipeline" ? "image cached" : "missing — copy + run"}</span>
      </div>
    </div>
  );
}

Object.assign(window, { InteractiveV2, V2_IPG_W, V2_IPG_H });
