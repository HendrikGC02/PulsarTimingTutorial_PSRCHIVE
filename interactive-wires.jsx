/* global React, SiteHeader, PhaseFreqPlot, PulseProfile, Residuals, TerminalLine, ABTag, DataCube */

/* ============================================================
   INTERACTIVE PAGE — 3 directions
   E · VSCode-style IDE  (sidebar tree + terminal + plot pane)
   F · Stacked terminal + plot  (single column, builder dropdowns)
   G · Split builder/preview + pipeline chainer
   ============================================================ */

const IPG_W = 1200;
const IPG_H = 900;

/* ---------- E · VSCode-style IDE ---------- */
function InteractiveE() {
  return (
    <div className="sk-page" style={{ width: IPG_W, height: IPG_H, overflow: "hidden", background: "#0f1411" }}>
      <ABTag tone="green">E · VSCode-style  (familiar IDE feel)</ABTag>
      <div style={{ position: "absolute", inset: 0, padding: 0 }}>
        {/* top tab */}
        <div className="sk-row" style={{ background: "#13201b", color: "#cfe3d7", height: 36, alignItems: "center", paddingLeft: 12, gap: 16, borderBottom: "1px solid #1b2c25" }}>
          <span style={{ fontFamily: "var(--font-hand)", fontSize: 18, color: "#9fd3b9" }}>✦ PSRCHIVE</span>
          <div className="sk-row" style={{ gap: 18, fontFamily: "var(--font-hand)", fontSize: 15 }}>
            <span style={{ color: "#7c9c8d" }}>Tutorial</span>
            <span style={{ color: "#cfe3d7", fontWeight: 700 }}>Try it ✦</span>
            <span style={{ color: "#7c9c8d" }}>Reference</span>
          </div>
          <span style={{ marginLeft: "auto", marginRight: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>workspace · J0437-4715.ar</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 280px", height: IPG_H - 36 - 30 }}>
          {/* Left: explorer */}
          <div style={{ background: "#0d1714", borderRight: "1px solid #1b2c25", padding: "10px 0", overflow: "hidden", color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <div style={{ padding: "0 12px", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-body)" }}>Examples</div>
            <div style={{ marginTop: 6 }}>
              {[
                { l: "▾ 01 · Profiles & folding", open: true },
                { l: "   • Flux profile", active: false },
                { l: "   • Stokes profile", active: false },
                { l: "▾ 02 · Phase × frequency", open: true },
                { l: "   • Heatmap (cleaned)", active: true },
                { l: "   • RFI before/after" },
                { l: "▸ 03 · Time × phase" },
                { l: "▸ 04 · Scrunching" },
                { l: "▸ 05 · RFI zapping" },
                { l: "▸ 06 · Templates" },
                { l: "▸ 07 · Pat & TOAs" },
                { l: "▸ 08 · Chained pipelines" },
              ].map((row, i) => (
                <div key={i} style={{
                  padding: "3px 14px",
                  background: row.active ? "#1f3a30" : "transparent",
                  color: row.active ? "#d5ecdd" : "#bdd6c8",
                  borderLeft: row.active ? "2px solid #4dbb91" : "2px solid transparent",
                  whiteSpace: "pre",
                }}>{row.l}</div>
              ))}
            </div>
            <div style={{ padding: "12px 12px 0", marginTop: 14, borderTop: "1px solid #1b2c25", color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-body)" }}>Archives</div>
            <div style={{ padding: "4px 14px", color: "#9fbeae" }}>📦 J0437-4715.ar</div>
            <div style={{ padding: "4px 14px", color: "#9fbeae" }}>📦 J1909-3744.ar</div>
            <div style={{ padding: "4px 14px", color: "#9fbeae" }}>📦 B1937+21.ar</div>
            <div style={{ padding: "4px 14px", color: "#6a8378" }}>＋ upload your own  (demo)</div>
          </div>

          {/* Middle: editor + plot */}
          <div style={{ display: "flex", flexDirection: "column", background: "#0a100d" }}>
            {/* file tabs */}
            <div className="sk-row" style={{ background: "#0d1714", borderBottom: "1px solid #1b2c25", height: 30, alignItems: "stretch" }}>
              <div style={{ padding: "6px 14px", background: "#0a100d", color: "#d5ecdd", fontFamily: "var(--font-mono)", fontSize: 11, borderRight: "1px solid #1b2c25" }}>command.sh ●</div>
              <div style={{ padding: "6px 14px", color: "#6a8378", fontFamily: "var(--font-mono)", fontSize: 11 }}>output.png</div>
            </div>
            {/* command editor */}
            <div style={{ padding: 16, fontFamily: "var(--font-mono)", fontSize: 13, color: "#cfe3d7", lineHeight: 1.7, height: 130, borderBottom: "1px solid #1b2c25" }}>
              <div><span style={{ color: "#6a8378" }}># Phase vs frequency, cleaned</span></div>
              <div><span style={{ color: "#4dbb91" }}>psrplot</span> <span style={{ color: "#e0a36a" }}>-p</span> freq <span style={{ color: "#e0a36a" }}>-jD</span> <span style={{ color: "#e0a36a" }}>-c</span> <span style={{ color: "#c8d99f" }}>"cmap:map=heat"</span> J0437-4715.ar<span style={{ background: "#cbe6d8", color: "#0a100d" }}>&nbsp;</span></div>
            </div>
            {/* plot pane */}
            <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column" }}>
              <div className="sk-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-hand)", fontSize: 16, color: "#9fd3b9" }}>output</span>
                <div className="sk-row sk-gap-8">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#7c9c8d" }}>cached · 12 ms</span>
                  <span style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "var(--font-mono)" }}>copy cmd</span>
                  <span style={{ border: "1px solid #2a4538", color: "#cfe3d7", padding: "2px 8px", borderRadius: 3, fontSize: 11, fontFamily: "var(--font-mono)" }}>save .png</span>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ border: "1px solid #1b2c25", padding: 4 }}>
                  <PhaseFreqPlot w={520} h={400} cleaned={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: argument inspector */}
          <div style={{ background: "#0d1714", borderLeft: "1px solid #1b2c25", padding: 14, color: "#bdd6c8", fontFamily: "var(--font-mono)", fontSize: 12, overflow: "hidden" }}>
            <div style={{ color: "#6a8378", textTransform: "uppercase", fontSize: 10, letterSpacing: 1, fontFamily: "var(--font-body)", marginBottom: 8 }}>Arguments · psrplot</div>
            {[
              { k: "-p", v: "freq", choices: "flux | freq | time | stokes | pat" },
              { k: "-jD", v: "(on)", choices: "dedisperse" },
              { k: "-jF", v: "(off)", choices: "fscrunch full" },
              { k: "-jT", v: "(off)", choices: "tscrunch full" },
              { k: "-c", v: "cmap:map=heat", choices: "any psrplot config" },
              { k: "-x", v: "", choices: "x-zoom" },
            ].map((a, i) => (
              <div key={i} style={{ marginBottom: 10, padding: 6, background: i === 0 ? "#1f3a30" : "transparent", borderRadius: 4 }}>
                <div className="sk-row" style={{ justifyContent: "space-between" }}>
                  <span style={{ color: "#e0a36a" }}>{a.k}</span>
                  <span style={{ color: "#d5ecdd" }}>{a.v || <i style={{ color: "#6a8378" }}>—</i>}</span>
                </div>
                <div style={{ color: "#6a8378", fontSize: 10, marginTop: 2 }}>{a.choices}</div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 10, background: "#152821", borderRadius: 4, color: "#9fd3b9", fontSize: 11, lineHeight: 1.4 }}>
              💡 outputs are pre-rendered. Edits to whitelisted flags hit cache; everything else falls back to the command-line text only.
            </div>
          </div>
        </div>

        {/* bottom status bar */}
        <div className="sk-row" style={{ background: "#0e3b2e", color: "#d5ecdd", height: 30, fontFamily: "var(--font-mono)", fontSize: 11, alignItems: "center", padding: "0 14px", gap: 16 }}>
          <span>✓ command valid</span>
          <span>archive: J0437-4715.ar (1024 ch · 128 sub · 4 pol)</span>
          <span style={{ marginLeft: "auto" }}>↵ render</span>
          <span>⌘ K · search</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- F · Stacked terminal-on-top, plot-below ---------- */
function InteractiveF() {
  return (
    <div className="sk-page" style={{ width: IPG_W, height: IPG_H, overflow: "hidden" }}>
      <ABTag tone="green">F · stacked  (terminal first, plot below — laptop-friendly)</ABTag>
      <SiteHeader active="play" />
      <div style={{ padding: "26px 80px" }}>
        <div className="sk-row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--green)", letterSpacing: 2 }}>PLAYGROUND</div>
            <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 40, margin: "4px 0", lineHeight: 1 }}>Type a command, see the plot.</h1>
          </div>
          <div className="sk-row sk-gap-8">
            <span className="sk-chip green">⤓ gallery</span>
            <span className="sk-chip">share link</span>
          </div>
        </div>

        {/* Builder row (chips) */}
        <div className="sk-row sk-gap-10" style={{ marginTop: 18, flexWrap: "wrap", alignItems: "center" }}>
          <span className="sk-hand" style={{ fontSize: 14, color: "var(--ink-3)" }}>build →</span>
          {[
            { label: "command", v: "psrplot" },
            { label: "-p plot", v: "freq" },
            { label: "-j ops", v: "D" },
            { label: "archive", v: "J0437-4715.ar" },
          ].map((b, i) => (
            <div key={i} className="sk-box" style={{ padding: "6px 10px", display: "flex", flexDirection: "column", minWidth: 110 }}>
              <span className="sk-hand" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: 1 }}>{b.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--green)" }}>{b.v} ▾</span>
            </div>
          ))}
          <span className="sk-btn ghost">＋ flag</span>
        </div>

        {/* Terminal */}
        <div style={{ marginTop: 16, background: "#0a100d", borderRadius: 8, padding: 14, fontFamily: "var(--font-mono)", fontSize: 13, color: "#cfe3d7", border: "1.5px solid var(--ink)" }}>
          <div style={{ color: "#7c9c8d", fontSize: 11, marginBottom: 6 }}>~ /workspace</div>
          <div>
            <span style={{ color: "#4dbb91" }}>$</span>{" "}
            <span style={{ color: "#4dbb91" }}>psrplot</span>{" "}
            <span style={{ color: "#e0a36a" }}>-p</span> freq{" "}
            <span style={{ color: "#e0a36a" }}>-jD</span>{" "}
            <span style={{ color: "#e0a36a" }}>-D</span>{" "}
            <span style={{ color: "#c8d99f" }}>/png</span>{" "}
            J0437-4715.ar<span style={{ background: "#cbe6d8", color: "#0a100d", marginLeft: 1 }}>&nbsp;</span>
          </div>
          <div style={{ color: "#7c9c8d", marginTop: 8, fontSize: 11 }}>↵ to render · ↑↓ history · ⌘L clear</div>
        </div>

        {/* Output + gallery */}
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 22 }}>
          <div>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 6 }}>OUTPUT</div>
            <div className="sk-box" style={{ padding: 8 }}>
              <PhaseFreqPlot w={580} h={340} cleaned={true} />
            </div>
            <div className="sk-row" style={{ marginTop: 8, justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
              <span>cached · J0437 · psrplot -p freq -jD</span>
              <span className="sk-row sk-gap-10">
                <span>↻ rerun</span><span>⤓ save</span><span>📋 copy cmd</span>
              </span>
            </div>
          </div>

          <div>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 6 }}>GALLERY · click any to load the command</div>
            <div className="sk-box" style={{ padding: 8 }}>
              {[
                { t: "Flux profile",        cmd: "psrplot -p flux -jFT" },
                { t: "Phase × freq (raw)",  cmd: "psrplot -p freq" },
                { t: "Phase × freq (clean)",cmd: "psrplot -p freq -jD", active: true },
                { t: "Phase × time",        cmd: "psrplot -p time -jF" },
                { t: "Stokes",              cmd: "psrplot -p stokes" },
                { t: "Pol angle (PA)",      cmd: "psrplot -p pa" },
              ].map((g, i) => (
                <div key={i} className="sk-row" style={{
                  padding: "8px 10px",
                  alignItems: "center",
                  gap: 10,
                  borderBottom: "1px dashed var(--ink-4)",
                  background: g.active ? "var(--green-mute)" : "transparent",
                }}>
                  <div style={{ width: 50, height: 36, background: "#0a100d", borderRadius: 3, display: "grid", placeItems: "center", color: "#9fd3b9", fontSize: 10, fontFamily: "var(--font-mono)" }}>🌡</div>
                  <div style={{ flex: 1 }}>
                    <div className="sk-marker" style={{ fontSize: 16, color: g.active ? "var(--green)" : "var(--ink)" }}>{g.t}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{g.cmd}</div>
                  </div>
                  <span className="sk-chip">load</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- G · Split builder + pipeline chainer ---------- */
function InteractiveG() {
  return (
    <div className="sk-page" style={{ width: IPG_W, height: IPG_H, overflow: "hidden" }}>
      <ABTag tone="green">G · split builder + pipeline chainer  (build psradd → pam → psrplot visually)</ABTag>
      <SiteHeader active="play" />

      <div style={{ padding: "22px 60px 0" }}>
        <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 38, margin: 0 }}>Chain a pipeline.</h1>
        <div style={{ fontSize: 14, color: "var(--ink-2)" }}>Drag commands onto the rail. The plot updates as soon as the chain produces an archive psrplot can read.</div>
      </div>

      {/* Pipeline rail */}
      <div style={{ padding: "18px 60px" }}>
        <div className="sk-box" style={{ padding: 14, background: "rgba(255,255,255,.5)" }}>
          <div className="sk-row" style={{ alignItems: "stretch", gap: 0 }}>
            {[
              { c: "psradd", flags: "ep1.ar ep2.ar", out: "added.ar", active: false },
              { c: "pam",    flags: "-T", out: "tscrunched.ar", active: true },
              { c: "psrplot",flags: "-p time -jF", out: "→ image", active: false },
            ].map((n, i, arr) => (
              <React.Fragment key={i}>
                <div className="sk-box" style={{
                  flex: 1,
                  padding: 10,
                  background: n.active ? "var(--green-mute)" : "var(--paper)",
                  borderColor: n.active ? "var(--green)" : "var(--ink-2)",
                }}>
                  <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                    <div className="sk-marker green" style={{ fontSize: 18 }}>{n.c}</div>
                    <span className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>step {i + 1}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)", marginTop: 4 }}>{n.flags}</div>
                  <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>→ {n.out}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 32, display: "grid", placeItems: "center" }}>
                    <svg width="22" height="14"><path d="M0 7 L 18 7 M14 3 L 18 7 L 14 11" fill="none" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  </div>
                )}
              </React.Fragment>
            ))}
            <div className="sk-box dash" style={{ flex: 0.6, padding: 10, display: "grid", placeItems: "center", color: "var(--ink-3)", fontFamily: "var(--font-hand)" }}>
              ＋ add step
            </div>
          </div>
        </div>
      </div>

      {/* Body: 2 panes */}
      <div style={{ padding: "0 60px 20px", display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 22 }}>
        {/* Left: configure active step */}
        <div className="sk-box" style={{ padding: 16 }}>
          <div className="sk-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>EDITING STEP 2</div>
              <div className="sk-marker green" style={{ fontSize: 22 }}>pam · modify archive</div>
            </div>
            <span className="sk-chip green fill">scrunch group</span>
          </div>

          <div style={{ marginTop: 14 }} className="sk-col sk-gap-12">
            <div>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>operation</div>
              <div className="sk-row sk-gap-6" style={{ marginTop: 4 }}>
                <span className="sk-chip green fill">-T  tscrunch all</span>
                <span className="sk-chip">-F  fscrunch all</span>
                <span className="sk-chip">-B  bscrunch</span>
                <span className="sk-chip">-D  dedisperse</span>
              </div>
            </div>
            <div>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>factor (optional)</div>
              <div className="sk-row" style={{ gap: 8, alignItems: "center", marginTop: 4 }}>
                <div className="sk-box" style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--green)" }}>—</div>
                <span className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>or use --setnchn N / --setnsub N</span>
              </div>
            </div>
            <div>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>output suffix</div>
              <div className="sk-box" style={{ padding: "6px 10px", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--green)", marginTop: 4 }}>-e Tscr</div>
            </div>
          </div>

          <div className="sk-row" style={{ marginTop: 16, alignItems: "center", justifyContent: "space-between", borderTop: "1px dashed var(--ink-4)", paddingTop: 12 }}>
            <span className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>resolved command →</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--green)" }}>pam -T -e Tscr added.ar</span>
          </div>
        </div>

        {/* Right: preview */}
        <div>
          <div className="sk-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <span className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>FINAL OUTPUT (psrplot -p time -jF tscrunched.ar)</span>
            <span className="sk-row sk-gap-8">
              <span className="sk-chip">📋 copy full pipeline</span>
              <span className="sk-chip green">↻ run</span>
            </span>
          </div>
          <div className="sk-box plot" style={{ padding: 6 }}>
            <PhaseFreqPlot w={580} h={340} cleaned={true} />
          </div>

          <div className="sk-box" style={{ padding: 12, marginTop: 12, background: "#0f1411", color: "#cfe3d7", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.55 }}>
            <span style={{ color: "#7c9c8d" }}># the full pipeline, copy-paste ready</span><br/>
            <span style={{ color: "#4dbb91" }}>psradd</span> -o added.ar ep1.ar ep2.ar<br/>
            <span style={{ color: "#4dbb91" }}>pam</span> <span style={{ color: "#e0a36a" }}>-T</span> -e Tscr added.ar<br/>
            <span style={{ color: "#4dbb91" }}>psrplot</span> <span style={{ color: "#e0a36a" }}>-p</span> time <span style={{ color: "#e0a36a" }}>-jF</span> added.Tscr
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InteractiveE, InteractiveF, InteractiveG, IPG_W, IPG_H });
