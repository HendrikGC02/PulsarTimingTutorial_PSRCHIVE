/* global React, PhaseFreqPlot, PulseProfile, ABTag */

/* ============================================================
   V2 · INTERACTIVE PAGE
   VSCode IDE feel (was "E") with pipeline chaining built in:
   the middle pane now hosts a horizontal "steps" rail above the
   command editor, so you can build psradd → pam → psrplot and
   step through each stage's intermediate output.
   ============================================================ */

const V2_IPG_W = 1300;
const V2_IPG_H = 920;

const STEPS = [
  { cmd: "psradd",  flags: "ep1.ar ep2.ar -o added.ar",       out: "added.ar"   },
  { cmd: "pam",     flags: "-T -e Tscr added.ar",              out: "added.Tscr" },
  { cmd: "psrplot", flags: "-p time -jF added.Tscr -D /png",   out: "→ image"    },
];

function InteractiveV2() {
  const activeStep = 2;
  const editingStep = 2;

  return (
    <div className="sk-page" style={{ width: V2_IPG_W, height: V2_IPG_H, overflow: "hidden", background: "#0d1714" }}>
      {/* IDE workspace bar (file ops, no nav — site nav is in SiteHeader above) */}
      <div className="sk-row" style={{ background: "#0a100d", color: "#cfe3d7", height: 32, alignItems: "center", paddingLeft: 14, gap: 18, borderBottom: "1px solid #1b2c25" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>workspace</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>2 archives loaded · 3-step pipeline</span>
        <span style={{ marginLeft: "auto", marginRight: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>⌘ K · search examples</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 300px", height: V2_IPG_H - 32 - 32 }}>

        {/* ---------- LEFT: explorer ---------- */}
        <div style={{ background: "#0a100d", borderRight: "1px solid #1b2c25", overflow: "hidden", color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Gallery</div>
          {[
            { l: "▾ Profiles & folding", h: true },
            { l: "   Flux profile" },
            { l: "   Stokes profile" },
            { l: "▾ Phase × frequency", h: true },
            { l: "   Heatmap (cleaned)" },
            { l: "   RFI before/after" },
            { l: "▸ Phase × time" },
            { l: "▸ Scrunching" },
            { l: "▸ RFI zapping" },
            { l: "▸ Templates" },
            { l: "▸ pat & TOAs" },
            { l: "▾ Pipelines · multi-step", h: true },
            { l: "   psradd → pam → psrplot", active: true },
            { l: "   paz → pam -T → psrplot" },
            { l: "   pat against template" },
          ].map((row, i) => (
            <div key={i} style={{
              padding: "4px 14px",
              background: row.active ? "#1f3a30" : "transparent",
              color: row.active ? "#d5ecdd" : row.h ? "#cfe3d7" : "#9fbeae",
              fontWeight: row.h ? 600 : 400,
              borderLeft: row.active ? "2px solid #4dbb91" : "2px solid transparent",
              whiteSpace: "pre",
            }}>{row.l}</div>
          ))}

          <div style={{ padding: "12px 14px 4px", marginTop: 10, borderTop: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Archives</div>
          <div style={{ padding: "3px 14px", color: "#9fbeae" }}>📦 ep1_J0437.ar</div>
          <div style={{ padding: "3px 14px", color: "#9fbeae" }}>📦 ep2_J0437.ar</div>
          <div style={{ padding: "3px 14px", color: "#9fbeae" }}>↳ added.ar  <span style={{ color: "#4dbb91" }}>· generated</span></div>
          <div style={{ padding: "3px 14px", color: "#9fbeae" }}>↳ added.Tscr  <span style={{ color: "#4dbb91" }}>· generated</span></div>
        </div>

        {/* ---------- MIDDLE: pipeline rail + editor + plot ---------- */}
        <div style={{ display: "flex", flexDirection: "column", background: "#0d1714", minWidth: 0 }}>

          {/* pipeline rail */}
          <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #1b2c25", background: "#0a100d" }}>
            <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>Pipeline · 3 steps</span>
              <div className="sk-row sk-gap-8" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>
                <span style={{ border: "1px solid #2a4538", padding: "1px 6px", borderRadius: 3 }}>↻ rerun all</span>
                <span style={{ border: "1px solid #2a4538", padding: "1px 6px", borderRadius: 3 }}>📋 copy pipeline</span>
              </div>
            </div>

            <div className="sk-row" style={{ alignItems: "stretch", gap: 0 }}>
              {STEPS.map((s, i) => {
                const ed = i === editingStep;
                return (
                  <React.Fragment key={i}>
                    <div style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 5,
                      background: ed ? "#1f3a30" : "#13201b",
                      border: ed ? "1px solid #4dbb91" : "1px solid #2a4538",
                      minWidth: 0,
                    }}>
                      <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#4dbb91" }}>{s.cmd}</span>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: 10, color: "#7c9c8d", letterSpacing: 0.6 }}>step {i + 1}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: ed ? "#cfe3d7" : "#9fbeae", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.flags}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "#6a8378", marginTop: 3 }}>→ {s.out}</div>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 26, display: "grid", placeItems: "center" }}>
                        <svg width="18" height="12"><path d="M0 6 L 14 6 M10 2 L 14 6 L 10 10" fill="none" stroke="#4dbb91" strokeWidth="1.4" strokeLinecap="round" /></svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <div style={{ width: 22, display: "grid", placeItems: "center" }}>
                <svg width="14" height="14"><path d="M0 7 L 12 7 M8 3 L 12 7 L 8 11" fill="none" stroke="#4dbb91" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </div>
              <div style={{
                flex: 0.6, padding: "9px 10px", borderRadius: 5,
                border: "1px dashed #2a4538", color: "#6a8378",
                fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 500,
                display: "grid", placeItems: "center",
              }}>＋ add step</div>
            </div>
          </div>

          {/* file tabs (one per chained command + assembled view) */}
          <div className="sk-row" style={{ background: "#0a100d", borderBottom: "1px solid #1b2c25", height: 32, alignItems: "stretch" }}>
            {["step1.sh", "step2.sh", "step3.sh ●", "pipeline.sh"].map((t, i) => {
              const sel = i === editingStep;
              return (
                <div key={i} style={{
                  padding: "7px 14px",
                  background: sel ? "#0d1714" : "transparent",
                  color: sel ? "#d5ecdd" : "#6a8378",
                  fontFamily: "var(--font-mono)", fontSize: 11,
                  borderRight: "1px solid #1b2c25",
                  borderTop: sel ? "2px solid #4dbb91" : "2px solid transparent",
                  marginTop: sel ? -1 : 0,
                }}>{t}</div>
              );
            })}
          </div>

          {/* command editor — editing step 3 */}
          <div style={{ padding: "14px 18px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#cfe3d7", lineHeight: 1.7, background: "#0d1714", borderBottom: "1px solid #1b2c25", minHeight: 110 }}>
            <div className="sk-row" style={{ gap: 14 }}>
              <span style={{ color: "#3a5848", width: 16, textAlign: "right" }}>1</span>
              <span style={{ color: "#6a8378" }}># Phase vs time, fscrunched, on the t-scrunched sum</span>
            </div>
            <div className="sk-row" style={{ gap: 14 }}>
              <span style={{ color: "#3a5848", width: 16, textAlign: "right" }}>2</span>
              <span>
                <span style={{ color: "#4dbb91" }}>psrplot</span>{" "}
                <span style={{ color: "#e0a36a" }}>-p</span> time{" "}
                <span style={{ color: "#e0a36a" }}>-jF</span>{" "}
                <span style={{ color: "#e0a36a" }}>-D</span> <span style={{ color: "#c8d99f" }}>/png</span>{" "}
                added.Tscr<span style={{ background: "#cbe6d8", color: "#0d1714", marginLeft: 1 }}>&nbsp;</span>
              </span>
            </div>
          </div>

          {/* output area — shows result of activeStep */}
          <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", background: "#0a100d" }}>
            <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div className="sk-row" style={{ gap: 16, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, color: "#9fd3b9", letterSpacing: 1.4, textTransform: "uppercase" }}>output</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>step 3 of 3 · cached 8 ms · psrplot</span>
              </div>
              <div className="sk-row sk-gap-8" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <span style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3 }}>← step 2</span>
                <span style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3 }}>copy cmd</span>
                <span style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3 }}>save .png</span>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ border: "1px solid #1b2c25", padding: 4 }}>
                <PhaseFreqPlot w={560} h={340} cleaned={true} />
              </div>
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: argument inspector for the active step ---------- */}
        <div style={{ background: "#0a100d", borderLeft: "1px solid #1b2c25", padding: 14, color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden" }}>
          <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1.4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Arguments</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#4dbb91" }}>step 3 · psrplot</span>
          </div>

          <div style={{ marginTop: 10 }}>
            {[
              { k: "-p",  v: "time",      ch: "flux · freq · time · stokes · pa", active: true },
              { k: "-jF", v: "(on)",      ch: "fscrunch full" },
              { k: "-jD", v: "(off)",     ch: "dedisperse" },
              { k: "-jT", v: "(off)",     ch: "tscrunch full" },
              { k: "-D",  v: "/png",      ch: "/png  /xs  /vps  out.png/png" },
              { k: "-c",  v: "—",         ch: "cmap:map=heat, x:range=…" },
              { k: "-x",  v: "—",         ch: "phase x-zoom" },
            ].map((a, i) => (
              <div key={i} style={{
                marginBottom: 8, padding: 7,
                background: a.active ? "#1f3a30" : "transparent",
                borderRadius: 4,
                borderLeft: a.active ? "2px solid #4dbb91" : "2px solid transparent",
              }}>
                <div className="sk-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ color: "#e0a36a", fontWeight: 700 }}>{a.k}</span>
                  <span style={{ color: "#d5ecdd" }}>{a.v}</span>
                </div>
                <div style={{ color: "#6a8378", fontSize: 10, marginTop: 2, lineHeight: 1.3 }}>{a.ch}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: 10, background: "#13201b", borderRadius: 5, border: "1px solid #2a4538", color: "#9fd3b9", fontSize: 11, lineHeight: 1.45 }}>
            💡 <b>about chaining.</b> Each step writes a file the next reads. Edits to whitelisted flags hit the precomputed cache; anything outside falls back to a copy-paste command for your own shell.
          </div>

          <div style={{ marginTop: 14, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 600, color: "#6a8378", textTransform: "uppercase", letterSpacing: 1.4 }}>Intermediate outputs</div>
          <div className="sk-col sk-gap-6" style={{ marginTop: 6 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{
                padding: "6px 8px",
                border: i === activeStep ? "1px solid #4dbb91" : "1px solid #1b2c25",
                background: i === activeStep ? "#13201b" : "transparent",
                borderRadius: 4,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ color: "#cfe3d7", fontFamily: "var(--font-mono)", fontSize: 11 }}>{s.out}</span>
                <span style={{ color: "#7c9c8d", fontSize: 10 }}>view ↗</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* status bar */}
      <div className="sk-row" style={{ background: "#0e3b2e", color: "#d5ecdd", height: 32, fontFamily: "var(--font-mono)", fontSize: 11, alignItems: "center", padding: "0 14px", gap: 18 }}>
        <span>✓ pipeline valid</span>
        <span>3 steps · 2 inputs · 1 image out</span>
        <span style={{ marginLeft: "auto" }}>↵ rerun this step</span>
        <span>⌘↵ rerun all</span>
        <span>⌘ K · search examples</span>
      </div>
    </div>
  );
}

Object.assign(window, { InteractiveV2, V2_IPG_W, V2_IPG_H });
