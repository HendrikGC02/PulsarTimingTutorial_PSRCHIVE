/* global React, SiteHeader, ABTag */

/* ============================================================
   V2 · REFERENCE PAGE  (was "I")
   Two-pane list + detail. Refined: cleaner type, less marker font,
   no wavy underline.
   ============================================================ */

const V2_RPG_W = 1240;
const V2_RPG_H = 1080;

const V2_COMMANDS = [
  { name: "psrplot",  cat: "plot",     d: "main plotting front-end" },
  { name: "pav",      cat: "plot",     d: "older PGPLOT plotting" },
  { name: "pam",      cat: "modify",   d: "scrunch · dedisperse · in-place mods" },
  { name: "psradd",   cat: "modify",   d: "combine archives (time / freq)" },
  { name: "paz",      cat: "clean",    d: "zap bad channels / sub-ints" },
  { name: "psredit",  cat: "meta",     d: "read & set archive metadata" },
  { name: "psrstat",  cat: "analyze",  d: "compute archive statistics" },
  { name: "vap",      cat: "meta",     d: "one-line archive summaries" },
  { name: "pat",      cat: "timing",   d: "produce times of arrival" },
  { name: "paas",     cat: "template", d: "fit gaussians → template" },
  { name: "psrsmooth",cat: "template", d: "wavelet smooth to template" },
  { name: "pac",      cat: "calib",    d: "polarisation calibration" },
  { name: "pcm",      cat: "calib",    d: "calibration coefficients fitter" },
  { name: "psrflux",  cat: "analyze",  d: "flux density per sub-int / ch" },
];

const V2_CATS = ["plot", "modify", "clean", "template", "timing", "calib", "analyze", "meta"];

function ReferenceV2() {
  return (
    <div className="sk-page" style={{ width: V2_RPG_W, height: V2_RPG_H, overflow: "hidden" }}>
      <SiteHeader active="ref" />

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", height: V2_RPG_H - 70 }}>
        {/* ---------- LIST ---------- */}
        <div style={{ borderRight: "1px solid var(--ink-4)", padding: "22px 14px", background: "rgba(255,255,255,.35)", overflow: "hidden" }}>
          <div className="sk-box" style={{ padding: "9px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "var(--ink-3)" }}>⌕</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--ink-3)" }}>filter commands…</span>
            <span className="sk-chip" style={{ marginLeft: "auto" }}>⌘K</span>
          </div>

          {V2_CATS.map(cat => (
            <div key={cat} style={{ marginTop: 18 }}>
              <div className="sk-label">{cat}</div>
              <div className="sk-col sk-gap-2" style={{ marginTop: 6 }}>
                {V2_COMMANDS.filter(c => c.cat === cat).map((c, i) => {
                  const active = c.name === "psrplot";
                  return (
                    <div key={i} className="sk-row" style={{
                      alignItems: "center", gap: 10, padding: "6px 10px",
                      borderRadius: 5,
                      background: active ? "var(--green)" : "transparent",
                      color: active ? "var(--paper)" : "var(--ink-2)",
                    }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: 12, opacity: 0.85, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.d}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- DETAIL ---------- */}
        <div style={{ padding: "32px 64px", overflow: "hidden" }}>
          <div className="sk-row" style={{ alignItems: "baseline", gap: 14 }}>
            <h1 style={{ fontFamily: "var(--font-mono)", fontSize: 46, color: "var(--green)", margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>psrplot</h1>
            <span className="sk-badge" style={{ background: "var(--green-mute)", color: "var(--green)", border: "1px solid var(--green)" }}>plot</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-3)" }}>the main plotting front-end</span>
            <span style={{ marginLeft: "auto" }} className="sk-chip green">try in playground →</span>
          </div>

          <div style={{ marginTop: 14, fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 760 }}>
            Project the 4-D archive onto any pair of axes — phase against frequency, phase against time, the
            Stokes parameters, polarisation angle, the integrated profile. Combine with <code style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>-j</code> operations
            to scrunch and dedisperse on the fly.
          </div>

          {/* signature */}
          <div className="sk-code" style={{ marginTop: 16, fontSize: 12 }}>
            <span className="prompt">$</span> psrplot <span className="flag">[-p plot-type]</span> <span className="flag">[-j ops]</span> <span className="flag">[-D device]</span> <span className="flag">[-c config]</span> archive.ar
          </div>

          {/* flags + examples */}
          <div className="sk-row" style={{ marginTop: 26, gap: 28 }}>
            <div style={{ flex: 1 }}>
              <div className="sk-h3" style={{ color: "var(--green)" }}>common flags</div>
              <div className="sk-col" style={{ marginTop: 10 }}>
                {[
                  ["-p", "plot type · flux | freq | time | stokes | pa | pat"],
                  ["-j", "operations · D dedisperse, F fscrunch, T tscrunch, B bscrunch"],
                  ["-D", "device · /png  /xs  /vps  out.png/png"],
                  ["-c", "config · cmap:map=heat, x:range=0:0.5, etc."],
                  ["-l", "log scale (for dynamic spectra)"],
                  ["-x", "x-zoom · phase window"],
                ].map((row, i) => (
                  <div key={i} className="sk-row" style={{ padding: "8px 0", borderBottom: "1px solid var(--ink-4)", alignItems: "baseline", gap: 14 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color: "var(--green)", minWidth: 36 }}>{row[0]}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{row[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="sk-h3" style={{ color: "var(--green)" }}>examples</div>
              <div className="sk-col sk-gap-8" style={{ marginTop: 10 }}>
                {[
                  { t: "Integrated profile",       c: "psrplot -p flux -jFT file.ar" },
                  { t: "Phase × freq, cleaned",    c: "psrplot -p freq -jD file.ar" },
                  { t: "Phase × time",             c: "psrplot -p time -jF file.ar" },
                  { t: "Stokes I, Q, U, V",        c: "psrplot -p stokes -jFT file.ar" },
                  { t: "Save to PNG",              c: "psrplot -p flux -D plot.png/png file.ar" },
                ].map((e, i) => (
                  <div key={i} className="sk-box" style={{ padding: 12 }}>
                    <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600 }}>{e.t}</span>
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

          <div style={{ marginTop: 24 }}>
            <div className="sk-label">related</div>
            <div className="sk-row sk-gap-8" style={{ marginTop: 8 }}>
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

Object.assign(window, { ReferenceV2, V2_RPG_W, V2_RPG_H });
