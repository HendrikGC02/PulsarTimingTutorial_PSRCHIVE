/* global React, SiteHeader, ABTag, TerminalLine */

/* ============================================================
   REFERENCE PAGE — 2 directions
   H · Searchable card grid  (one card per command)
   I · Two-pane reference  (list left, detail right)
   ============================================================ */

const RPG_W = 1200;
const RPG_H = 1100;

const COMMANDS = [
  { name: "psrplot",  cat: "plot",     d: "the swiss-army knife for plotting archives" },
  { name: "pav",      cat: "plot",     d: "older PGPLOT-based plotting" },
  { name: "pam",      cat: "modify",   d: "in-place archive modification: scrunch, dedisperse…" },
  { name: "paz",      cat: "clean",    d: "zap channels / sub-integrations" },
  { name: "psredit",  cat: "meta",     d: "read & set archive metadata" },
  { name: "psrstat",  cat: "analyze",  d: "compute archive statistics" },
  { name: "vap",      cat: "meta",     d: "view archive parameters (one-line summaries)" },
  { name: "psradd",   cat: "modify",   d: "add / append archives in time or frequency" },
  { name: "pat",      cat: "timing",   d: "produce times of arrival from template + obs" },
  { name: "paas",     cat: "template", d: "fit gaussian components to build a template" },
  { name: "psrsmooth",cat: "template", d: "wavelet-smooth a high-S/N profile into a template" },
  { name: "pac",      cat: "calib",    d: "polarisation calibration" },
  { name: "pcm",      cat: "calib",    d: "calibration coefficients fitter (MEM, etc.)" },
  { name: "psrflux",  cat: "analyze",  d: "estimate flux density per sub-integration / channel" },
];

const CAT_TONE = {
  plot:     { c: "var(--green)",  bg: "var(--green-mute)" },
  modify:   { c: "#7a4a14",       bg: "#f0d8a8" },
  clean:    { c: "#8a3320",       bg: "#f0c8b8" },
  meta:     { c: "#3b3b3b",       bg: "var(--paper-2)" },
  analyze:  { c: "#205070",       bg: "#c6dae8" },
  timing:   { c: "var(--green)",  bg: "var(--green-mute)" },
  template: { c: "#6a4a8a",       bg: "#dcd0ea" },
  calib:    { c: "#205070",       bg: "#c6dae8" },
};

/* ---------- H · Searchable card grid ---------- */
function ReferenceH() {
  return (
    <div className="sk-page" style={{ width: RPG_W, height: RPG_H, overflow: "hidden" }}>
      <ABTag tone="green">H · card grid  (searchable / filterable command reference)</ABTag>
      <SiteHeader active="ref" />

      <div style={{ padding: "32px 80px 16px" }}>
        <div className="sk-hand" style={{ fontSize: 13, color: "var(--green)", letterSpacing: 2 }}>REFERENCE</div>
        <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 46, margin: "4px 0 14px", lineHeight: 1 }}>Every command, one tap away.</h1>

        {/* search + filter */}
        <div className="sk-row" style={{ gap: 14, alignItems: "center" }}>
          <div className="sk-box" style={{ flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.6)" }}>
            <span style={{ fontFamily: "var(--font-hand)", color: "var(--ink-3)" }}>⌕</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--ink-3)" }}>search commands, flags, or descriptions…</span>
            <span className="sk-chip" style={{ marginLeft: "auto" }}>⌘K</span>
          </div>
          <span className="sk-chip green fill">all</span>
          <span className="sk-chip">plot</span>
          <span className="sk-chip">modify</span>
          <span className="sk-chip">clean</span>
          <span className="sk-chip">template</span>
          <span className="sk-chip">timing</span>
          <span className="sk-chip">calib</span>
        </div>
      </div>

      {/* card grid */}
      <div style={{ padding: "10px 80px 30px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {COMMANDS.map((c, i) => {
          const tone = CAT_TONE[c.cat];
          return (
            <div key={i} className="sk-box" style={{ padding: 14, background: "rgba(255,255,255,.45)" }}>
              <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 20, color: tone.c }}>{c.name}</div>
                <span className="sk-badge" style={{ background: tone.bg, color: tone.c, border: `1px solid ${tone.c}` }}>{c.cat}</span>
              </div>
              <div className="sk-hand" style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.3 }}>{c.d}</div>
              <div className="sk-code" style={{ marginTop: 10, fontSize: 11 }}>
                <span className="prompt">$</span>{" "}{c.name === "psrplot" && <>psrplot <span className="flag">-p</span> freq file.ar</>}
                {c.name === "pav" && <>pav <span className="flag">-DFTp</span> file.ar</>}
                {c.name === "pam" && <>pam <span className="flag">-T</span> <span className="flag">-e</span> Tscr file.ar</>}
                {c.name === "paz" && <>paz <span className="flag">-r</span> <span className="flag">-e</span> zap file.ar</>}
                {c.name === "psredit" && <>psredit <span className="flag">-c</span> name file.ar</>}
                {c.name === "psrstat" && <>psrstat <span className="flag">-c</span> snr file.ar</>}
                {c.name === "vap" && <>vap <span className="flag">-c</span> "name,nchan" file.ar</>}
                {c.name === "psradd" && <>psradd <span className="flag">-o</span> sum.ar ep*.ar</>}
                {c.name === "pat" && <>pat <span className="flag">-s</span> std.ar file.ar</>}
                {c.name === "paas" && <>paas <span className="flag">-i</span> profile.std</>}
                {c.name === "psrsmooth" && <>psrsmooth <span className="flag">-W</span> file.ar</>}
                {c.name === "pac" && <>pac <span className="flag">-Q</span> cal.ar file.ar</>}
                {c.name === "pcm" && <>pcm <span className="flag">-J</span> mtm.ar</>}
                {c.name === "psrflux" && <>psrflux <span className="flag">-s</span> std.ar file.ar</>}
              </div>
              <div className="sk-row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
                <span className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)" }}>12 flags · 4 examples</span>
                <span className="sk-chip green">open →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- I · Two-pane reference ---------- */
function ReferenceI() {
  return (
    <div className="sk-page" style={{ width: RPG_W, height: RPG_H, overflow: "hidden" }}>
      <ABTag tone="green">I · two-pane  (list + expanded detail; deep-link-able)</ABTag>
      <SiteHeader active="ref" />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", height: RPG_H - 70 }}>
        {/* list */}
        <div style={{ borderRight: "1.5px dashed var(--ink-4)", padding: "20px 12px", background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
          <div className="sk-box" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "var(--ink-3)" }}>⌕</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-3)" }}>filter…</span>
          </div>

          {["plot", "modify", "clean", "template", "timing", "calib", "analyze", "meta"].map(cat => (
            <div key={cat} style={{ marginTop: 16 }}>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: 1.4, textTransform: "uppercase" }}>{cat}</div>
              <div className="sk-col sk-gap-4" style={{ marginTop: 4 }}>
                {COMMANDS.filter(c => c.cat === cat).map((c, i) => {
                  const active = c.name === "psrplot";
                  return (
                    <div key={i} className="sk-row" style={{
                      alignItems: "center", gap: 8, padding: "5px 10px",
                      borderRadius: 4,
                      background: active ? "var(--green)" : "transparent",
                      color: active ? "var(--paper)" : "var(--ink-2)",
                    }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                      <span className="sk-hand" style={{ fontSize: 12, opacity: 0.8, marginLeft: 4, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* detail */}
        <div style={{ padding: "30px 56px", overflow: "hidden" }}>
          <div className="sk-row" style={{ alignItems: "baseline", gap: 14 }}>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 44, color: "var(--green)", margin: 0 }}>psrplot</h1>
            <span className="sk-badge" style={{ background: "var(--green-mute)", color: "var(--green)", border: "1px solid var(--green)" }}>plot</span>
            <span className="sk-hand" style={{ fontSize: 14, color: "var(--ink-3)" }}>the main plotting front-end</span>
            <span style={{ marginLeft: "auto" }} className="sk-chip green">try in playground →</span>
          </div>

          <div style={{ marginTop: 14, fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, maxWidth: 740 }}>
            Project the 4-D archive onto any pair of axes — phase against frequency, phase against time, the
            Stokes parameters, polarisation angle, the integrated profile. Combine with <code>-j</code> operations
            to scrunch and dedisperse on the fly.
          </div>

          {/* signature */}
          <div className="sk-code" style={{ marginTop: 14, fontSize: 12 }}>
            <span className="prompt">$</span> psrplot <span className="flag">[-p plot-type]</span> <span className="flag">[-j ops]</span> <span className="flag">[-D device]</span> <span className="flag">[-c config]</span> archive.ar
          </div>

          {/* flags table */}
          <div className="sk-row" style={{ marginTop: 22, gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div className="sk-marker green" style={{ fontSize: 18 }}>common flags</div>
              <div className="sk-col" style={{ marginTop: 8 }}>
                {[
                  ["-p", "plot type · flux | freq | time | stokes | pa | pat"],
                  ["-j", "operations · D dedisperse, F fscrunch, T tscrunch, B bscrunch"],
                  ["-D", "device · /png  /xs  /vps  file.png/png"],
                  ["-c", "config · cmap:map=heat, x:range=0:0.5, etc."],
                  ["-l", "log scale · for dynamic spectra"],
                  ["-x", "x-zoom · phase window"],
                ].map((row, i) => (
                  <div key={i} className="sk-row" style={{ padding: "6px 0", borderBottom: "1px dashed var(--ink-4)", alignItems: "baseline", gap: 14 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--green)", minWidth: 36 }}>{row[0]}</span>
                    <span className="sk-hand" style={{ fontSize: 14, color: "var(--ink-2)" }}>{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="sk-marker green" style={{ fontSize: 18 }}>examples</div>
              <div className="sk-col sk-gap-8" style={{ marginTop: 8 }}>
                {[
                  { t: "Integrated profile", c: "psrplot -p flux -jFT file.ar" },
                  { t: "Phase × freq, cleaned", c: "psrplot -p freq -jD file.ar" },
                  { t: "Phase × time", c: "psrplot -p time -jF file.ar" },
                  { t: "Stokes I,Q,U,V", c: "psrplot -p stokes -jFT file.ar" },
                  { t: "Save to PNG", c: "psrplot -p flux -D plot.png/png file.ar" },
                ].map((e, i) => (
                  <div key={i} className="sk-box" style={{ padding: 10 }}>
                    <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <span className="sk-marker" style={{ fontSize: 15 }}>{e.t}</span>
                      <span className="sk-chip green">↗ open</span>
                    </div>
                    <div className="sk-code" style={{ marginTop: 6, fontSize: 11 }}>
                      <span className="prompt">$</span> {e.c}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* related */}
          <div style={{ marginTop: 22 }}>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>RELATED</div>
            <div className="sk-row sk-gap-8" style={{ marginTop: 6 }}>
              {["pav", "pam", "paz", "psrstat", "vap"].map(n => (
                <span key={n} className="sk-chip green">{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ReferenceH, ReferenceI, RPG_W, RPG_H });
