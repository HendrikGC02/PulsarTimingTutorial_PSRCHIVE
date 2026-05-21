/* global React */
/* Small reusable sketch parts shared by all wireframes. */

const { useEffect, useState, useRef } = React;

// Site header that appears at the top of every wireframe (faux navigation)
function SiteHeader({ active = "landing", compact = false }) {
  const [dark, setDark] = useState(() => {
    try { return document.documentElement.getAttribute("data-theme") === "dark"; } catch (e) { return false; }
  });
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try { localStorage.setItem("psrchive-theme", next ? "dark" : "light"); } catch (e) {}
  }
  const NAV = [
    { k: "landing", label: "Tutorial",  href: "index.html" },
    { k: "play",    label: "Try it",    href: "try-it.html" },
    { k: "ref",     label: "Reference", href: "reference.html" },
  ];
  return (
    <div className="sk-row" style={{
      alignItems: "center",
      justifyContent: "space-between",
      padding: compact ? "10px 24px" : "16px 32px",
      borderBottom: "1px solid var(--ink-4)",
      background: "var(--paper)",
      position: "relative",
      zIndex: 2,
    }}>
      <a href="index.html" className="sk-row sk-gap-10" style={{ alignItems: "baseline", textDecoration: "none", color: "inherit", whiteSpace: "nowrap", flexShrink: 0 }}>
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: compact ? 19 : 22,
          fontWeight: 700,
          color: "var(--green)",
          lineHeight: 1,
          letterSpacing: -0.3,
          whiteSpace: "nowrap",
        }}>✦ PSRCHIVE</div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
          pulsar timing tutorial
        </div>
      </a>
      <div className="sk-nav" style={{ flexShrink: 0 }}>
        {NAV.map(n => (
          <a key={n.k} href={n.href} className={"item" + (active === n.k ? " active" : "")} style={{ textDecoration: "none", color: "inherit", whiteSpace: "nowrap" }}>{n.label}</a>
        ))}
        <button onClick={() => setGlossaryOpen(true)} className="sk-chip" style={{ marginLeft: 8, background: "transparent", border: "1px solid var(--green)", cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--green)" }} aria-label="open glossary">
          📖 glossary
        </button>
        {glossaryOpen && <GlossaryOverlay onClose={() => setGlossaryOpen(false)} />}
        <button onClick={toggleTheme} className="sk-chip" style={{ marginLeft: 8, background: "transparent", border: "1px solid var(--ink-4)", cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--ink-2)" }} aria-label="toggle theme">
          <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--ink)" }} />
          {dark ? "light" : "dark"}
        </button>
      </div>
    </div>
  );
}

// Annotation arrow with bent path + handwritten label
function Annotate({ x, y, w = 110, h = 50, dir = "tl", label, color = "var(--green)" }) {
  // dir: tl (label top-left of arrow tip), tr, bl, br
  const flipX = dir.includes("r") ? -1 : 1;
  const flipY = dir.includes("b") ? -1 : 1;
  const start = { x: dir.includes("r") ? w : 0, y: dir.includes("b") ? h : 0 };
  const end = { x: dir.includes("r") ? 4 : w - 4, y: dir.includes("b") ? 4 : h - 4 };
  const c1 = { x: start.x, y: end.y };
  return (
    <div className="sk-arrow" style={{ position: "absolute", left: x, top: y, width: w, height: h, color }}>
      <svg width={w} height={h}>
        <path d={`M ${start.x} ${start.y} Q ${c1.x} ${c1.y} ${end.x} ${end.y}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <polygon points={`${end.x},${end.y} ${end.x + 8 * flipX},${end.y + 3 * flipY} ${end.x + 4 * flipX},${end.y + 9 * flipY}`} fill="currentColor" />
      </svg>
      <div style={{
        position: "absolute",
        [dir.includes("r") ? "right" : "left"]: 6,
        [dir.includes("b") ? "bottom" : "top"]: 0,
        fontSize: 15,
        maxWidth: w - 20,
      }}>{label}</div>
    </div>
  );
}

/* realisticProfile — returns intensity in [0,1] for phase in [0,1].
   Modelled on a J0437-style MSP profile: a narrow main peak, a leading
   shoulder, a trailing kink, and a faint scattering tail.  Used wherever
   the tutorial shows "an integrated pulse profile" so it doesn't read as
   a plain gaussian. */
function realisticProfile(phase) {
  // wrap into [0,1)
  let p = phase - Math.floor(phase);
  // Components (centre, sigma, amplitude).  Asymmetric: main peak narrow,
  // shoulder slightly wider on the trailing side.
  const G = (c, s, a) => a * Math.exp(-Math.pow((p - c) / s, 2));
  let v = 0;
  v += G(0.395, 0.018, 0.32); // leading shoulder
  v += G(0.420, 0.013, 1.00); // main peak
  v += G(0.448, 0.020, 0.58); // trailing shoulder
  v += G(0.475, 0.030, 0.22); // soft trailing bump
  // exponential scattering tail (only after main peak)
  if (p > 0.42 && p < 0.62) {
    v += 0.16 * Math.exp(-(p - 0.42) / 0.045);
  }
  // tiny interpulse around phase 0.92 (very low amplitude, optional)
  v += G(0.915, 0.012, 0.06);
  return Math.max(0, Math.min(1.0, v));
}

// Diagram: pulse profile (realistic asymmetric J0437-style shape)
function PulseProfile({ w = 220, h = 80, dark = false, color = "var(--green)", noise = 0 }) {
  const N = 200;
  const baseline = h - 12;
  const peak = 8;
  const span = baseline - peak;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const phase = i / (N - 1);
    let v = realisticProfile(phase);
    if (noise > 0) v += (Math.sin(i * 13.7) + Math.cos(i * 27.1)) * 0.5 * noise;
    v = Math.max(0, Math.min(1, v));
    const x = 4 + (w - 8) * phase;
    const y = baseline - v * span;
    pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {dark && <rect width={w} height={h} fill="var(--plot-bg)" />}
      <line x1="4" y1={baseline} x2={w - 4} y2={baseline} stroke={dark ? "#555" : "#999"} strokeWidth="1" strokeDasharray="3 3" />
      <path d={pts.join(" ")} fill="none" stroke={dark ? "#e08545" : color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Data cube — isometric drawing showing phase × freq × time
function DataCube({ size = 220, animated = false, faces = "all" }) {
  // simple isometric
  const W = size, H = size * 0.95;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <pattern id={`dc-stripes-${size}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="6" height="6" fill="rgba(14,59,46,.08)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(14,59,46,.45)" strokeWidth="1.2" />
        </pattern>
        <pattern id={`dc-dots-${size}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="rgba(14,59,46,.5)" />
        </pattern>
      </defs>
      {(() => {
        const cx = W * 0.5, cy = H * 0.55;
        const s = size * 0.32;
        const dx = s, dy = s * 0.55, dz = s * 0.9;
        // top face: (cx, cy - dz) center
        const top = `M ${cx} ${cy - dz - dy} L ${cx + dx} ${cy - dz} L ${cx} ${cy - dz + dy} L ${cx - dx} ${cy - dz} Z`;
        const right = `M ${cx + dx} ${cy - dz} L ${cx + dx} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;
        const left = `M ${cx - dx} ${cy - dz} L ${cx - dx} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;
        return (
          <g>
            <path d={top} fill={`url(#dc-dots-${size})`} stroke="var(--ink)" strokeWidth="1.5" />
            <path d={right} fill={`url(#dc-stripes-${size})`} stroke="var(--ink)" strokeWidth="1.5" />
            <path d={left} fill="rgba(14,59,46,.06)" stroke="var(--ink)" strokeWidth="1.5" />
            {/* axis labels */}
            <text x={cx + dx + 6} y={cy - dz / 2} fontFamily="var(--font-hand)" fontSize="14" fill="var(--green)">freq</text>
            <text x={cx - dx - 38} y={cy - dz / 2} fontFamily="var(--font-hand)" fontSize="14" fill="var(--green)">time</text>
            <text x={cx - 14} y={cy - dz - dy - 4} fontFamily="var(--font-hand)" fontSize="14" fill="var(--green)">phase</text>
            {/* tiny pulse on the front face */}
            <path d={`M ${cx - dx + 4} ${cy - 6} L ${cx - dx + s * 0.5} ${cy - 6} L ${cx - dx + s * 0.6} ${cy - 22} L ${cx - dx + s * 0.7} ${cy - 6} L ${cx} ${cy + dy - 4}`} fill="none" stroke="var(--plot-warm)" strokeWidth="1.6" />
            {animated && (
              <g>
                <rect x={cx - dx + 2} y={cy - dz + dy - 4} width="3" height={dz - dy - 2} fill="var(--green)" opacity="0.5">
                  <animate attributeName="x" values={`${cx - dx + 2};${cx - 2};${cx - dx + 2}`} dur="3s" repeatCount="indefinite" />
                </rect>
              </g>
            )}
          </g>
        );
      })()}
    </svg>
  );
}

// Frequency vs phase heatmap (mimics the user's reference image)
// Heat colormap: black → deep red → orange → yellow-white (afmhot-ish)
function heatColor(v) {
  // v in [0,1]
  const stops = [
    [0.00, [  0,   0,   0]],
    [0.25, [ 70,   8,   2]],
    [0.45, [165,  30,   8]],
    [0.65, [220,  90,  18]],
    [0.82, [240, 165,  40]],
    [1.00, [255, 230, 160]],
  ];
  v = Math.max(0, Math.min(1, v));
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [v0, c0] = stops[i - 1];
      const [v1, c1] = stops[i];
      const t = (v - v0) / (v1 - v0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * t),
        Math.round(c0[1] + (c1[1] - c0[1]) * t),
        Math.round(c0[2] + (c1[2] - c0[2]) * t),
      ];
    }
  }
  return stops[stops.length - 1][1];
}

function PhaseFreqPlot({ w = 220, h = 160, cleaned = false }) {
  const cells = [];
  // band of bright pulse around phase 0.35-0.55; brightest at lower freq channels
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 30; x++) {
      const inBand = x > 9 && x < 17;
      const lowFreqBoost = (y > 12 ? (y - 12) / 12 : 0);
      let v = Math.random() * 0.03;
      if (inBand) {
        const phaseShape = Math.exp(-Math.pow((x - 13) / 2.2, 2));
        v = Math.min(1, phaseShape * (0.5 + lowFreqBoost) + Math.random() * 0.08);
      }
      // optional RFI band (horizontal stripe)
      if (!cleaned && y === 4 && Math.random() > 0.3) v = 0.6 + Math.random() * 0.25;
      if (!cleaned && y === 17 && x > 20 && Math.random() > 0.5) v = 0.4 + Math.random() * 0.2;
      cells.push({ x, y, v });
    }
  }
  const cellW = (w - 32) / 30;
  const cellH = (h - 28) / 24;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <rect width={w} height={h} fill="#000" />
      <g transform="translate(28, 8)">
        {cells.map((c, i) => {
          const [r, g, b] = heatColor(c.v);
          return <rect key={i} x={c.x * cellW} y={c.y * cellH} width={cellW + 0.5} height={cellH + 0.5} fill={`rgb(${r},${g},${b})`} />;
        })}
      </g>
      {/* axes */}
      <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="10" fill="#bbb" fontFamily="var(--font-body)">pulse phase</text>
      <text x={8} y={h / 2} textAnchor="middle" fontSize="10" fill="#bbb" fontFamily="var(--font-body)" transform={`rotate(-90 8 ${h / 2})`}>frequency</text>
    </svg>
  );
}

// Residuals scatter
function Residuals({ w = 240, h = 90 }) {
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const x = (i / 39) * (w - 30) + 24;
    const y = h / 2 + (Math.random() - 0.5) * (h * 0.5);
    pts.push({ x, y, err: 4 + Math.random() * 4 });
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <line x1="24" y1={h / 2} x2={w - 6} y2={h / 2} stroke="var(--ink-3)" strokeWidth="1" strokeDasharray="3 3" />
      {pts.map((p, i) => (
        <g key={i}>
          <line x1={p.x} y1={p.y - p.err} x2={p.x} y2={p.y + p.err} stroke="var(--green)" strokeWidth="1" />
          <circle cx={p.x} cy={p.y} r="2" fill="var(--green)" />
        </g>
      ))}
      <text x={4} y={h / 2 + 4} fontSize="10" fontFamily="var(--font-hand)" fill="var(--ink-3)">0</text>
      <text x={w / 2} y={h - 2} textAnchor="middle" fontSize="10" fontFamily="var(--font-hand)" fill="var(--ink-3)">MJD</text>
    </svg>
  );
}

// Quick "code line" terminal snippet
function TerminalLine({ children, prompt = "$" }) {
  return (
    <div className="sk-code" style={{ fontSize: 11.5 }}>
      <span className="prompt">{prompt} </span>{children}
    </div>
  );
}

// helpful little artboard frame label (printed inside artboard top-left)
function ABTag({ tone = "ink", children }) {
  return (
    <div style={{
      position: "absolute",
      top: 12, left: 12,
      fontFamily: "var(--font-hand)",
      fontSize: 14,
      color: tone === "green" ? "var(--green)" : "var(--ink-3)",
      letterSpacing: 0.3,
      zIndex: 5,
    }}>{children}</div>
  );
}

/* ============================================================
   SiteFooter — shared bottom of every page
   ============================================================ */
function SiteFooter({ data = null }) {
  return (
    <footer style={{
      borderTop: "1px solid var(--ink-4)",
      padding: "32px 6vw 28px",
      background: "var(--paper-2)",
      marginTop: 60,
    }}>
      <div className="sk-row" style={{ flexWrap: "wrap", gap: 36, alignItems: "flex-start" }}>
        <div style={{ minWidth: 220, flex: "1 1 240px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--green)", letterSpacing: -0.2 }}>✦ PSRCHIVE tutorial</div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.5, maxWidth: 320 }}>
            A visual companion to the PSRCHIVE pulsar timing software — diagrams you can poke at, commands you can run.
          </div>
        </div>
        <div style={{ flex: "1 1 160px" }}>
          <div className="sk-label">read</div>
          <div className="sk-col sk-gap-4" style={{ marginTop: 8, fontSize: 13 }}>
            <a href="index.html" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Tutorial</a>
            <a href="try-it.html" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Playground</a>
            <a href="reference.html" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Reference</a>
          </div>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div className="sk-label">upstream</div>
          <div className="sk-col sk-gap-4" style={{ marginTop: 8, fontSize: 13 }}>
            <a href="http://psrchive.sourceforge.net/" target="_blank" rel="noreferrer" style={{ color: "var(--ink-2)", textDecoration: "none" }}>psrchive.sourceforge.net ↗</a>
            <a href="http://psrchive.sourceforge.net/manuals/" target="_blank" rel="noreferrer" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Command manuals ↗</a>
            <a href="https://bitbucket.org/psrsoft/psrchive" target="_blank" rel="noreferrer" style={{ color: "var(--ink-2)", textDecoration: "none" }}>Source repo ↗</a>
          </div>
        </div>
        <div style={{ flex: "1 1 220px" }}>
          <div className="sk-label">cite</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.55 }}>
            Hotan, van Straten & Manchester (2004), <i>PASA</i> 21, 302.<br />
            van Straten, Demorest & Oslowski (2012), <i>AR&T</i> 9, 237.
          </div>
        </div>
      </div>
      {/* author byline */}
      <div style={{
        marginTop: 26, paddingTop: 14, borderTop: "1px dashed var(--ink-4)",
        fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-2)",
        lineHeight: 1.55,
      }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.4, color: "var(--ink-3)" }}>by</div>
        <div style={{ marginTop: 4 }}>
          <b>Hendrik Combrinck</b>
          {" — "}
          Swinburne University of Technology
          {"; "}
          <span style={{ color: "var(--ink-3)" }}>ARC Centre of Excellence for Gravitational Wave Discovery (OzGrav)</span>
        </div>
      </div>

      <div className="sk-row" style={{
        marginTop: 14, paddingTop: 0,
        fontSize: 11.5, color: "var(--ink-3)", flexWrap: "wrap", gap: 14, alignItems: "center",
        fontFamily: "var(--font-body)",
      }}>
        <span>© {new Date().getFullYear()} · written as a community tutorial</span>
        <span>·</span>
        <span>code: MIT · text & diagrams: CC BY 4.0</span>
        <span>·</span>
        <span>not affiliated with the PSRCHIVE development team</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
          {data?._meta?.psrchive_version && data._meta.psrchive_version !== "unknown" ? `PSRCHIVE ${data._meta.psrchive_version}` : "PSRCHIVE — version pending refresh"}
        </span>
      </div>
    </footer>
  );
}

/* ============================================================
   DedispCurves — ν⁻² sweep before / after dedispersion
   A small animated diagram for the dedispersion section.
   ============================================================ */
function DedispCurves({ w = 460, h = 240, showIntegrated = true }) {
  const [t, setT] = useState(0); // 0 = dispersed, 1 = dedispersed
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    let raf, last;
    function step(ts) {
      if (!last) last = ts;
      const dt = (ts - last) / 1000; last = ts;
      setT(prev => {
        const n = prev + dt * 0.4;
        if (n >= 1) { setPlaying(false); return 1; }
        return n;
      });
      if (playing) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // 6 frequency channels stacked vertically; pulse sweeps right as freq drops (dispersion).
  // At t=1, all aligned at phase 0.5.
  const NCH = 6;
  const channels = [];
  for (let i = 0; i < NCH; i++) {
    const freqFrac = (i + 0.5) / NCH; // 0 (top, high freq) → 1 (bottom, low freq)
    // dispersion shifts low-freq pulses to later phase by Δφ ∝ 1/ν² ≈ freqFrac² (approx)
    const dispShift = freqFrac * freqFrac * 0.28; // up to ~0.28 phase
    const phase0 = 0.22 + dispShift * (1 - t); // animates back to 0.22
    channels.push({ y: 22 + i * ((h - 50) / NCH), phase0, freqFrac });
  }
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", background: "var(--card-2)", borderRadius: 6 }}>
        {/* phase axis */}
        <line x1="36" y1={h - 22} x2={w - 12} y2={h - 22} stroke="var(--ink-4)" strokeWidth="1" />
        <line x1="36" y1="14" x2="36" y2={h - 22} stroke="var(--ink-4)" strokeWidth="1" />
        <text x={w / 2} y={h - 6} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">pulse phase</text>
        <text x="14" y={h / 2} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)" transform={`rotate(-90 14 ${h / 2})`}>frequency ↓</text>

        {/* dispersion curve overlay (the ν⁻² arc that t→1 erases) */}
        {t < 0.99 && (
          <path
            d={(() => {
              const pts = [];
              for (let i = 0; i <= 30; i++) {
                const f = i / 30;
                const phase = 0.22 + f * f * 0.28 * (1 - t);
                const x = 36 + (w - 56) * phase;
                const y = 22 + f * (h - 50);
                pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
              }
              return pts.join(" ");
            })()}
            fill="none" stroke="var(--plot-warm)" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.6 * (1 - t)}
          />
        )}
        {/* the channel pulses */}
        {channels.map((c, i) => {
          const xCenter = 36 + (w - 56) * c.phase0;
          const peak = 14;
          return (
            <g key={i}>
              <path
                d={`M 36 ${c.y} L ${xCenter - 14} ${c.y} L ${xCenter - 2} ${c.y - peak} L ${xCenter + 4} ${c.y - peak} L ${xCenter + 14} ${c.y} L ${w - 12} ${c.y}`}
                fill="none" stroke="var(--green)" strokeWidth="1.4" strokeLinejoin="round"
              />
              <text x={28} y={c.y + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-3)">
                {Math.round(1700 - c.freqFrac * 700)}
              </text>
            </g>
          );
        })}
        {/* state badge */}
        <g transform={`translate(${w - 122}, 16)`}>
          <rect width="110" height="22" rx="11" fill="var(--green)" />
          <text x="55" y="15" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--paper)">
            {t < 0.05 ? "dispersed" : t > 0.95 ? "dedispersed ✓" : `pam -d ${Math.round(t * 100)}%`}
          </text>
        </g>
      </svg>
      {showIntegrated && (() => {
        // Integrated profile: sum across frequency channels.
        // When dispersed (t=0), the per-channel pulses are spread out in
        // phase, so summing produces a broad, low-amplitude bump.
        // When dedispersed (t=1), they all align and we recover the sharp
        // realistic profile.
        const IH = 72;          // panel height
        const NPH = 240;        // phase samples
        const NCH = 32;         // channels to sum
        const baseline = IH - 12;
        // build two profiles and interpolate
        const dispBuf = new Array(NPH).fill(0);
        const dedispBuf = new Array(NPH).fill(0);
        for (let i = 0; i < NPH; i++) {
          const phase = i / NPH;
          // dedispersed = realisticProfile, each channel adds the same
          dedispBuf[i] = realisticProfile(phase);
          // dispersed = each channel shifted by f² * 0.28, summed
          let s = 0;
          for (let c = 0; c < NCH; c++) {
            const f = (c + 0.5) / NCH;
            const shifted = phase - f * f * 0.28;
            s += realisticProfile(shifted);
          }
          dispBuf[i] = s / NCH; // mean (gives broad smeared shape)
        }
        // peak amplitude is much smaller when dispersed → normalise both
        // to their own peak so the user sees the SHAPE collapse, but also
        // show the actual S/N gain via a small caption.
        const peakDisp = Math.max(...dispBuf);
        const peakDed = Math.max(...dedispBuf);
        const snrGain = peakDed / Math.max(0.001, peakDisp);
        const pathFor = (buf) => {
          const pts = [];
          for (let i = 0; i < NPH; i++) {
            const x = 36 + (w - 56) * (i / NPH);
            // use lerp of dispBuf and dedispBuf based on t
            const v = (1 - t) * dispBuf[i] + t * dedispBuf[i];
            const norm = (1 - t) * peakDisp + t * peakDed;
            const y = baseline - (v / Math.max(0.001, norm)) * (baseline - 8);
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return pts.join(" ");
        };
        return (
          <svg width={w} height={IH} viewBox={`0 0 ${w} ${IH}`} style={{ display: "block", background: "var(--card-2)", borderRadius: 6, marginTop: 6 }}>
            <line x1="36" y1={baseline} x2={w - 12} y2={baseline} stroke="var(--ink-4)" strokeWidth="0.8" strokeDasharray="2 2" />
            <text x="40" y="16" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">integrated (Σ over freq)</text>
            <path d={pathFor()} fill="none" stroke="var(--plot-warm)" strokeWidth="1.8" />
            <text x={w - 14} y="16" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--green)">
              peak × {(snrGain * (0.05 + 0.95 * t) + (1 - t) * 0).toFixed(1)} after dedispersion
            </text>
          </svg>
        );
      })()}
      <div className="sk-row" style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
        <button
          onClick={() => { if (t >= 1) setT(0); setPlaying(p => !p); }}
          style={{
            width: 26, height: 26, borderRadius: 13,
            border: "1px solid var(--green)", background: playing ? "var(--green)" : "transparent",
            color: playing ? "var(--paper)" : "var(--green)", cursor: "pointer", fontSize: 11, lineHeight: 1, fontFamily: "var(--font-mono)",
          }}
        >{playing ? "▮▮" : t >= 1 ? "↺" : "▶"}</button>
        <input type="range" min="0" max="1000" value={Math.round(t * 1000)}
          onChange={e => { setPlaying(false); setT(+e.target.value / 1000); }}
          style={{ flex: 1, accentColor: "var(--green)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", minWidth: 90, textAlign: "right" }}>
          Δt ∝ DM · ν⁻²
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   CalibPolar — uncalibrated → calibrated Stokes profile pair
   Two stacked panels (raw → -3dB gain offset visible; calibrated → clean L, V, PA).
   ============================================================ */
function CalibPolar({ w = 460, h = 240 }) {
  const [calibrated, setCalibrated] = useState(false);
  const profileI = (phase) =>
      0.88 * Math.exp(-Math.pow((phase - 0.42) / 0.04, 2))
    + 0.42 * Math.exp(-Math.pow((phase - 0.56) / 0.025, 2));
  const profileL = (phase) =>
      0.55 * Math.exp(-Math.pow((phase - 0.43) / 0.05, 2));
  const profileV = (phase) =>
     -0.30 * Math.exp(-Math.pow((phase - 0.45) / 0.04, 2));
  // gain miscalibration shrinks L and skews V upward; phase offset shifts L
  const Lscale = calibrated ? 1 : 0.45;
  const Lshift = calibrated ? 0 : 0.025;
  const Voffset = calibrated ? 0 : 0.10;
  const Iscale = calibrated ? 1 : 0.78;
  const N = 220;
  const pathFor = (fn) => {
    const pts = [];
    for (let i = 0; i < N; i++) {
      const phase = i / N;
      const v = fn(phase);
      const x = 36 + (w - 56) * phase;
      const y = (h - 30) - v * (h / 2 - 30);
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ");
  };
  // PA curve — RVM-style S-curve across the pulse window when calibrated;
  // randomised when raw (gain leakage scrambles the polarisation position
  // angle).  Only emit PA points where the linearly-polarised flux L is
  // significant (otherwise PA is undefined / dominated by noise).
  // RVM:  tan(ψ - ψ0) = sin(α) sin(φ - φ0) / (sin(ζ)cos(α) - cos(ζ)sin(α)cos(φ - φ0))
  // We pick α and ζ to produce a fairly steep central swing.
  const paPanelTop = 14, paPanelBot = 70;
  const paYFor = (paDeg) => {
    // map -90..+90 → bottom..top of panel
    const frac = (paDeg + 90) / 180;
    return paPanelBot - frac * (paPanelBot - paPanelTop);
  };
  const paPath = (() => {
    const pts = [];
    const alpha = 75 * Math.PI / 180; // mag axis vs spin axis
    const zeta  = 80 * Math.PI / 180; // sightline vs spin axis
    const phi0  = 0.43;
    const psi0  = 8 * Math.PI / 180;
    let started = false;
    let path = "";
    for (let i = 0; i < 240; i++) {
      const phase = i / 240;
      // only draw within the on-pulse window where L is significant
      const L = profileL(phase - Lshift) * Lscale;
      if (L < 0.06) { started = false; continue; }
      // RVM
      const dphi = (phase - phi0) * 2 * Math.PI * 1.6; // stretch
      const num = Math.sin(alpha) * Math.sin(dphi);
      const den = Math.sin(zeta) * Math.cos(alpha)
                - Math.cos(zeta) * Math.sin(alpha) * Math.cos(dphi);
      const psi = psi0 + Math.atan2(num, den);
      let paDeg = psi * 180 / Math.PI;
      // wrap into [-90, 90)
      paDeg = ((paDeg + 90) % 180 + 180) % 180 - 90;
      if (!calibrated) {
        // raw — gain / leakage scrambles PA: pseudo-random
        paDeg = (Math.sin(i * 9.7) * 90 + Math.cos(i * 3.1) * 35);
        paDeg = ((paDeg + 90) % 180 + 180) % 180 - 90;
      }
      const x = 36 + (w - 56) * phase;
      const y = paYFor(paDeg);
      path += `${started ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)} `;
      started = true;
      pts.push({ x, y, paDeg });
    }
    return { d: path.trim(), pts };
  })();
  const zero = h - 30 - 0 * (h / 2 - 30);
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", background: "var(--card-2)", borderRadius: 6 }}>
        {/* PA mini-panel at top — show as scatter (literature convention) */}
        <line x1="36" y1="76" x2={w - 12} y2="76" stroke="var(--ink-4)" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="36" y1={paYFor(0)} x2={w - 12} y2={paYFor(0)} stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="1 2" />
        <text x="40" y="22" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">P.A. (deg)</text>
        <text x={w - 14} y="22" textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-4)">+90 / 0 / −90</text>
        {paPath.pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.6} fill="var(--plot-warm)" />
        ))}
        {/* profile axes */}
        <line x1="36" y1={zero} x2={w - 12} y2={zero} stroke="var(--ink-4)" strokeWidth="0.8" strokeDasharray="2 2" />
        <line x1="36" y1="90" x2="36" y2={h - 22} stroke="var(--ink-4)" strokeWidth="1" />
        <line x1="36" y1={h - 22} x2={w - 12} y2={h - 22} stroke="var(--ink-4)" strokeWidth="1" />
        <path d={pathFor(p => profileI(p) * Iscale)} fill="none" stroke="var(--ink)" strokeWidth="1.7" />
        <path d={pathFor(p => profileL(p - Lshift) * Lscale)} fill="none" stroke="var(--green)" strokeWidth="1.6" strokeDasharray={calibrated ? "" : "3 2"} />
        <path d={pathFor(p => profileV(p) + Voffset)} fill="none" stroke="#c25a2c" strokeWidth="1.6" strokeDasharray="2 3" />
        <text x={w - 14} y="100" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink)">I</text>
        <text x={w - 14} y="116" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--green)">L (linear)</text>
        <text x={w - 14} y="132" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#c25a2c">V (circular)</text>
        <text x={w / 2} y={h - 6} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">pulse phase</text>
        {/* badge */}
        <g transform={`translate(${w - 122}, 30)`}>
          <rect width="110" height="22" rx="11" fill={calibrated ? "var(--green)" : "#c25a2c"} />
          <text x="55" y="15" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--paper)">
            {calibrated ? "calibrated ✓" : "raw (gain off)"}
          </text>
        </g>
      </svg>
      <div className="sk-row" style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
        <button
          onClick={() => setCalibrated(c => !c)}
          className="sk-chip green"
          style={{ cursor: "pointer", background: calibrated ? "var(--green)" : "transparent", color: calibrated ? "var(--paper)" : "var(--green)", border: "1px solid var(--green)" }}
        >{calibrated ? "show raw" : "apply pac"}</button>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {calibrated ? "$ pac -A -e calib *.ar" : "before — gains, phase, leakage uncorrected"}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   GlossaryOverlay — modal of common pulsar-timing terms with
   annotated SVG visuals.  Opens from the header on every page.
   Designed for "I'm in a tutorial and forgot what `duty cycle` means" lookups.
   ============================================================ */
function GlossaryOverlay({ onClose }) {
  const [query, setQuery] = useState("");
  // close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Realistic-shape profile path used by several glossary visuals.
  const profilePath = (w, h, options = {}) => {
    const N = 240;
    const baseline = h - 14, peak = 10, span = baseline - peak;
    const noise = options.noise || 0;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const phase = i / N;
      let v = realisticProfile(phase);
      if (noise) v += (Math.sin(i * 13.7) + Math.cos(i * 27.1)) * 0.5 * noise;
      v = Math.max(0, Math.min(1, v));
      const x = 18 + (w - 24) * phase;
      const y = baseline - v * span;
      pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return { d: pts.join(" "), baseline };
  };

  // ---- Terms with their own visualisation ----
  const TERMS = [
    {
      k: "Pulse profile",
      tags: ["profile", "shape"],
      body: "The intensity of the pulsed emission averaged over many rotations, plotted against rotational phase. Almost every PSRCHIVE plot is some projection that produces or shows a profile.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H);
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.8" />
            <text x={W/2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--ink-3)">pulse phase  (0 → 1)</text>
            <text x={12} y={H/2} fontSize="10" fill="var(--ink-3)" transform={`rotate(-90 12 ${H/2})`}>flux</text>
          </g>
        );
      },
    },
    {
      k: "Main pulse",
      tags: ["mp"],
      body: "The dominant peak of the profile. Often where the TOA is anchored. By convention many pipelines rotate the profile so the main pulse sits near phase 0.5.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H);
        const mainPhase = 0.42;
        const x = 18 + (W - 24) * mainPhase;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.8" />
            <line x1={x} y1={baseline} x2={x} y2={14} stroke="var(--plot-warm)" strokeDasharray="3 3" />
            <text x={x + 4} y={22} fontSize="11" fill="var(--plot-warm)" fontFamily="var(--font-hand)">main pulse</text>
          </g>
        );
      },
    },
    {
      k: "Interpulse",
      tags: ["ip"],
      body: "A second, usually weaker peak roughly half a rotation away from the main pulse. Interpreted as the opposite magnetic pole sweeping past the line of sight (≈ orthogonal rotator).",
      svg: (W, H) => {
        // bigger interpulse than the realistic profile gives by default
        const N = 240;
        const baseline = H - 14, peak = 10, span = baseline - peak;
        const pts = [];
        for (let i = 0; i < N; i++) {
          const phase = i / N;
          let v = realisticProfile(phase);
          v += 0.35 * Math.exp(-Math.pow((phase - 0.92)/0.025, 2));
          v = Math.max(0, Math.min(1, v));
          const x = 18 + (W - 24) * phase;
          const y = baseline - v * span;
          pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        const xM = 18 + (W - 24) * 0.42;
        const xI = 18 + (W - 24) * 0.92;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <path d={pts.join(" ")} fill="none" stroke="var(--green)" strokeWidth="1.7" />
            <line x1={xM} y1={baseline - 2} x2={xM} y2={baseline - 70} stroke="var(--plot-warm)" strokeDasharray="3 3" />
            <text x={xM + 4} y={baseline - 60} fontSize="11" fill="var(--plot-warm)" fontFamily="var(--font-hand)">main</text>
            <line x1={xI} y1={baseline - 2} x2={xI} y2={baseline - 50} stroke="#2b6fc0" strokeDasharray="3 3" />
            <text x={xI - 38} y={baseline - 40} fontSize="11" fill="#2b6fc0" fontFamily="var(--font-hand)">interpulse</text>
          </g>
        );
      },
    },
    {
      k: "Off-pulse region",
      tags: ["baseline", "offpulse"],
      body: "Phases where no pulsed signal is present — the floor. Used to estimate the baseline level and the noise RMS that goes into S/N and TOA error bars.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H, { noise: 0.06 });
        const xOff1 = 18, xOff2 = 18 + (W - 24) * 0.30;
        const xOff3 = 18 + (W - 24) * 0.65, xOff4 = W - 6;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <rect x={xOff1} y={baseline - 30} width={xOff2 - xOff1} height={30} fill="rgba(50,120,210,0.12)" />
            <rect x={xOff3} y={baseline - 30} width={xOff4 - xOff3} height={30} fill="rgba(50,120,210,0.12)" />
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.7" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <text x={(xOff1 + xOff2)/2} y={baseline + 12} textAnchor="middle" fontSize="10" fill="#2b6fc0" fontFamily="var(--font-hand)">off-pulse</text>
            <text x={(xOff3 + xOff4)/2} y={baseline + 12} textAnchor="middle" fontSize="10" fill="#2b6fc0" fontFamily="var(--font-hand)">off-pulse</text>
          </g>
        );
      },
    },
    {
      k: "On-pulse region",
      tags: ["onpulse"],
      body: "The phases where significant pulsed flux is present. Defined by a threshold above the off-pulse RMS — PSRCHIVE will pick it automatically (e.g. `psrstat -j Fp -c on:range` returns the window).",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H);
        const xOn1 = 18 + (W - 24) * 0.36, xOn2 = 18 + (W - 24) * 0.60;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <rect x={xOn1} y={baseline - 70} width={xOn2 - xOn1} height={70} fill="rgba(38,156,90,0.10)" />
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.7" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <text x={(xOn1 + xOn2)/2} y={20} textAnchor="middle" fontSize="11" fontFamily="var(--font-hand)" fill="var(--green)">on-pulse window</text>
          </g>
        );
      },
    },
    {
      k: "Duty cycle",
      tags: ["width", "w50"],
      body: "The fraction of the period that's on-pulse. Often quoted as W50 / period — the full width at 50% of the peak as a fraction of one rotation. Millisecond pulsars are typically a few percent; some slow pulsars approach tens of percent.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H);
        // measure FWHM of realisticProfile
        const N = 1000;
        let peakV = 0;
        for (let i = 0; i < N; i++) peakV = Math.max(peakV, realisticProfile(i/N));
        let left = 0, right = 1;
        for (let i = 0; i < N; i++) {
          if (realisticProfile(i/N) >= peakV/2) { left = i/N; break; }
        }
        for (let i = N - 1; i >= 0; i--) {
          if (realisticProfile(i/N) >= peakV/2) { right = i/N; break; }
        }
        const xL = 18 + (W - 24) * left;
        const xR = 18 + (W - 24) * right;
        const yH = baseline - peakV * (baseline - 10) * 0.5;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.7" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <line x1={xL} y1={yH} x2={xR} y2={yH} stroke="var(--plot-warm)" strokeWidth="2" />
            <line x1={xL} y1={yH - 4} x2={xL} y2={yH + 4} stroke="var(--plot-warm)" strokeWidth="2" />
            <line x1={xR} y1={yH - 4} x2={xR} y2={yH + 4} stroke="var(--plot-warm)" strokeWidth="2" />
            <text x={(xL+xR)/2} y={yH - 6} textAnchor="middle" fontSize="11" fontFamily="var(--font-hand)" fill="var(--plot-warm)">W50</text>
            <text x={W/2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--ink-3)">duty cycle ≈ W50 / P ≈ {((right - left) * 100).toFixed(1)}%</text>
          </g>
        );
      },
    },
    {
      k: "Profile evolution",
      tags: ["freq", "evolution"],
      body: "How the pulse shape changes with observing frequency — typically components become narrower and shift in relative amplitude at higher frequencies. This is why timing precision depends on observing band, and why a separate template is sometimes built per band.",
      svg: (W, H) => {
        const N = 240;
        const baseline = H - 14, peak = 12, span = baseline - peak;
        const draw = (centre, width, amp, colour, lbl) => {
          const pts = [];
          for (let i = 0; i < N; i++) {
            const phase = i / N;
            const v = amp * Math.exp(-Math.pow((phase - centre) / width, 2));
            const x = 18 + (W - 24) * phase;
            const y = baseline - v * span;
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return <path d={pts.join(" ")} fill="none" stroke={colour} strokeWidth="1.6" />;
        };
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            {draw(0.44, 0.060, 0.55, "#c0392b", "0.5 GHz")}
            {draw(0.42, 0.035, 0.82, "var(--green)", "1.4 GHz")}
            {draw(0.405, 0.022, 1.00, "#2b6fc0", "3 GHz")}
            <text x={W - 8} y={26} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#c0392b">0.5 GHz (wider)</text>
            <text x={W - 8} y={40} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--green)">1.4 GHz</text>
            <text x={W - 8} y={54} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#2b6fc0">3 GHz (narrowest)</text>
          </g>
        );
      },
    },
    {
      k: "Single pulses vs integrated profile",
      tags: ["folding", "single"],
      body: "Individual rotations look like spiky noise on top of a faint pulse — sometimes the pulse is missing entirely (nulling). Averaging many rotations (folding) builds the smooth, stable integrated profile that timing uses.",
      svg: (W, H) => {
        const baseline = H - 14, peak = 12, span = baseline - peak;
        const N = 200;
        const rngArr = (seed) => {
          let s = seed;
          return Array.from({ length: N }, () => {
            s = (s * 16807) % 2147483647;
            return ((s & 0x7fffffff) / 2147483647) - 0.5;
          });
        };
        const drawSingle = (seed, op) => {
          const noise = rngArr(seed);
          const pts = [];
          for (let i = 0; i < N; i++) {
            const phase = i / N;
            const v = realisticProfile(phase) * 0.7 + noise[i] * 0.7;
            const x = 18 + (W - 24) * phase;
            const y = baseline - v * span;
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return <path d={pts.join(" ")} fill="none" stroke="var(--ink-3)" strokeWidth="0.8" opacity={op} />;
        };
        const { d } = profilePath(W, H);
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            {[3, 11, 17, 29, 43, 61, 79].map((s, i) => drawSingle(s, 0.45))}
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="2.2" />
            <text x={W - 8} y={22} textAnchor="end" fontSize="10" fontFamily="var(--font-hand)" fill="var(--green)">integrated profile</text>
            <text x={W - 8} y={36} textAnchor="end" fontSize="10" fontFamily="var(--font-hand)" fill="var(--ink-3)">single rotations</text>
          </g>
        );
      },
    },
    {
      k: "Polarisation profile (I, L, V)",
      tags: ["stokes", "linear", "circular", "pa"],
      body: "Standard polarisation plot: total intensity (I, black), linear (L = √(Q²+U²), red), and circular (V, blue) profiles. Above sits the linear polarisation position angle (PA) — usually drawn as scattered points only where L is significant.",
      svg: (W, H) => {
        const baseline = H - 14, mid = H - 14 - 4, span = (H - 30) * 0.6;
        const N = 240;
        const profI = (p) => realisticProfile(p);
        const profL = (p) => 0.55 * realisticProfile(p);
        const profV = (p) => -0.32 * realisticProfile(p) + 0.06;
        const paneStart = 8, paneEnd = paneStart + (H - 30) * 0.30;
        const draw = (fn, color, dash = "") => {
          const pts = [];
          for (let i = 0; i < N; i++) {
            const phase = i / N;
            const v = fn(phase);
            const x = 18 + (W - 24) * phase;
            const y = baseline - v * span;
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return <path d={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeDasharray={dash} />;
        };
        // PA scatter
        const paPts = [];
        for (let i = 0; i < N; i++) {
          const phase = i / N;
          if (profI(phase) < 0.20) continue;
          const dphi = (phase - 0.42) * 12;
          const psi = Math.atan2(Math.sin(dphi), 0.3 - Math.cos(dphi));
          const x = 18 + (W - 24) * phase;
          const y = paneStart + (1 - (psi + Math.PI) / (2 * Math.PI)) * (paneEnd - paneStart);
          paPts.push(<circle key={i} cx={x} cy={y} r={1.1} fill="var(--plot-warm)" />);
        }
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={paneEnd} x2={W - 6} y2={paneEnd} stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="2 2" />
            <text x={20} y={paneStart + 10} fontSize="9" fontFamily="var(--font-mono)" fill="var(--ink-3)">P.A.</text>
            {paPts}
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            {draw(profI, "var(--ink)")}
            {draw(profL, "#c0392b", "3 2")}
            {draw(profV, "#2b6fc0", "1 2")}
            <text x={W - 8} y={paneEnd + 16} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink)">I</text>
            <text x={W - 8} y={paneEnd + 30} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#c0392b">L</text>
            <text x={W - 8} y={paneEnd + 44} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="#2b6fc0">V</text>
          </g>
        );
      },
    },
    {
      k: "Position angle (PA)",
      tags: ["psi", "rvm"],
      body: "Orientation of the linear-polarisation vector on the sky, in degrees. Often follows a smooth S-shaped sweep across the pulse (the rotating-vector model, RVM) — its steepness and inflection point constrain the magnetic/sightline geometry.",
      svg: (W, H) => {
        const pts = [];
        const alpha = 75 * Math.PI / 180, zeta = 80 * Math.PI / 180;
        for (let i = 0; i < 240; i++) {
          const phase = i / 240;
          if (realisticProfile(phase) < 0.15) continue;
          const dphi = (phase - 0.42) * 2 * Math.PI * 1.6;
          const num = Math.sin(alpha) * Math.sin(dphi);
          const den = Math.sin(zeta) * Math.cos(alpha) - Math.cos(zeta) * Math.sin(alpha) * Math.cos(dphi);
          let psi = Math.atan2(num, den) * 180 / Math.PI;
          psi = ((psi + 90) % 180 + 180) % 180 - 90;
          const x = 18 + (W - 24) * phase;
          const y = 14 + (1 - (psi + 90) / 180) * (H - 28);
          pts.push(<circle key={i} cx={x} cy={y} r="1.4" fill="var(--plot-warm)" />);
        }
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={H/2} x2={W - 6} y2={H/2} stroke="var(--ink-4)" strokeWidth="0.6" strokeDasharray="2 2" />
            {pts}
            <text x={20} y={20} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">+90°</text>
            <text x={20} y={H/2 + 3} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">0°</text>
            <text x={20} y={H - 6} fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">−90°</text>
            <text x={W/2} y={H - 3} textAnchor="middle" fontSize="10" fill="var(--ink-3)">RVM S-curve across the pulse</text>
          </g>
        );
      },
    },
    {
      k: "Time of arrival (TOA)",
      tags: ["toa", "pat"],
      body: "A timestamp marking when a chosen fiducial phase of the integrated profile passed the telescope. Computed by cross-correlating the observation against a smooth template — `pat` returns the phase shift Δφ, multiplies by the period, and writes one line per observation to a `.tim` file.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H, { noise: 0.04 });
        const shift = 0.02;
        const dT = profilePath(W, H);
        // template centred at 0.42; observation shifted
        const N = 240, peak = 12, span = baseline - peak;
        const obsPath = (() => {
          const pts = [];
          for (let i = 0; i < N; i++) {
            const phase = i / N;
            let v = realisticProfile(phase - shift);
            v += (Math.sin(i * 13.7) + Math.cos(i * 27.1)) * 0.04;
            const x = 18 + (W - 24) * phase;
            const y = baseline - v * span;
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          return pts.join(" ");
        })();
        const xT = 18 + (W - 24) * 0.42;
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <path d={dT.d} fill="none" stroke="var(--green)" strokeWidth="1.8" strokeDasharray="4 3" />
            <path d={obsPath} fill="none" stroke="var(--ink)" strokeWidth="1.4" />
            <line x1={xT} y1={baseline - span - 4} x2={xT + (W - 24) * shift} y2={baseline - span - 4} stroke="var(--plot-warm)" strokeWidth="2.5" />
            <text x={xT - 4} y={baseline - span - 8} fontSize="11" fontFamily="var(--font-hand)" fill="var(--plot-warm)">Δφ → TOA</text>
            <text x={W - 8} y={22} textAnchor="end" fontSize="10" fontFamily="var(--font-hand)" fill="var(--green)">template</text>
            <text x={W - 8} y={36} textAnchor="end" fontSize="10" fontFamily="var(--font-hand)" fill="var(--ink)">observation</text>
          </g>
        );
      },
    },
    {
      k: "Dynamic spectrum",
      tags: ["scintillation", "freq", "time"],
      body: "Flux as a function of frequency vs time, after collapsing the pulse-phase axis (or restricting to on-pulse). Bright/dark patches are scintillation; horizontal stripes are persistent RFI; vertical dropouts are bad sub-integrations.",
      svg: (W, H) => {
        const cells = [];
        const NX = 36, NY = 22;
        let seed = 5;
        const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
        for (let y = 0; y < NY; y++) {
          for (let x = 0; x < NX; x++) {
            // scintle blobs
            let v = 0.3 + 0.5 * (Math.sin(x*0.4 + y*0.2) * Math.cos(x*0.15 - y*0.35));
            // RFI streaks
            if (y === 4 || y === 17) v = 0.9;
            // dropouts
            if (x === 22) v *= 0.15;
            v += rand() * 0.08;
            cells.push({ x, y, v: Math.max(0, Math.min(1, v)) });
          }
        }
        const cw = (W - 4) / NX, ch = (H - 14) / NY;
        return (
          <g>
            <rect width={W} height={H} fill="#000" />
            {cells.map((c, i) => {
              const [r, g, b] = heatColor(c.v);
              return <rect key={i} x={2 + c.x * cw} y={c.y * ch} width={cw + 0.4} height={ch + 0.4} fill={`rgb(${r},${g},${b})`} />;
            })}
            <text x={W/2} y={H - 2} textAnchor="middle" fontSize="10" fill="#aaa">time →</text>
            <text x={8} y={H/2} fontSize="10" fill="#aaa" transform={`rotate(-90 8 ${H/2})`}>frequency ↑</text>
          </g>
        );
      },
    },
    {
      k: "Joy-Division plot",
      tags: ["waterfall", "stack"],
      body: "A stack of per-sub-integration (or per-channel) profiles offset vertically — a `psrplot -p time` or `pav -Y` style waterfall. Lets you eyeball mode-changes, drifting subpulses, or scintillation by sub-integration.",
      svg: (W, H) => {
        const rows = 14;
        const N = 200;
        const baseline = H - 8;
        const rowH = (H - 16) / rows;
        const paths = [];
        for (let r = 0; r < rows; r++) {
          const amp = 0.6 + 0.4 * Math.sin(r * 0.6);
          const drift = 0.005 * (r - rows/2);
          const pts = [];
          for (let i = 0; i < N; i++) {
            const phase = i / N;
            let v = realisticProfile(phase + drift) * amp;
            v += (Math.sin(i * (r+1) * 3.1) + Math.cos(i * (r+1) * 1.7)) * 0.03;
            const x = 12 + (W - 24) * phase;
            const y = baseline - r * rowH - v * (rowH + 14);
            pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          paths.push(<path key={r} d={pts.join(" ")} fill="none" stroke="var(--green)" strokeWidth="1" opacity={0.85} />);
        }
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            {paths}
            <text x={W/2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--ink-3)">pulse phase</text>
            <text x={12} y={14} fontSize="10" fill="var(--ink-3)" fontFamily="var(--font-mono)">subint ↑</text>
          </g>
        );
      },
    },
    {
      k: "Signal-to-noise ratio (S/N)",
      tags: ["snr"],
      body: "Peak (or area) of the on-pulse profile divided by the RMS of the off-pulse baseline. Quoted per observation, and improves as √N with more pulses folded in. `psrstat -c snr` returns it.",
      svg: (W, H) => {
        const { d, baseline } = profilePath(W, H, { noise: 0.08 });
        return (
          <g>
            <rect width={W} height={H} fill="var(--paper-2)" />
            <line x1="18" y1={baseline} x2={W - 6} y2={baseline} stroke="var(--ink-4)" />
            <line x1="18" y1={baseline - 8} x2={W - 6} y2={baseline - 8} stroke="#2b6fc0" strokeDasharray="2 2" />
            <text x={W - 8} y={baseline - 10} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="#2b6fc0">RMS</text>
            <path d={d} fill="none" stroke="var(--green)" strokeWidth="1.6" />
            <line x1={18 + (W - 24)*0.42} y1={baseline - 4} x2={18 + (W - 24)*0.42} y2={baseline - 70} stroke="var(--plot-warm)" strokeWidth="2" />
            <text x={18 + (W - 24)*0.42 + 6} y={baseline - 60} fontSize="11" fontFamily="var(--font-hand)" fill="var(--plot-warm)">peak</text>
            <text x={W/2} y={H - 2} textAnchor="middle" fontSize="10" fill="var(--ink-3)">S/N = peak / RMS(off-pulse)</text>
          </g>
        );
      },
    },
  ];
  const q = query.trim().toLowerCase();
  const visible = !q ? TERMS : TERMS.filter(t =>
    t.k.toLowerCase().includes(q) || t.tags.some(g => g.includes(q)) || t.body.toLowerCase().includes(q)
  );
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(8, 24, 18, 0.45)",
      backdropFilter: "blur(2px)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      padding: "5vh 4vw",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--paper)", color: "var(--ink)",
        width: "min(1080px, 95vw)", maxHeight: "90vh", overflowY: "auto",
        border: "1px solid var(--ink-4)", borderRadius: 10,
        padding: "22px 26px 26px",
        fontFamily: "var(--font-body)",
        boxShadow: "0 10px 40px rgba(0,0,0,.25)",
      }}>
        <div className="sk-row" style={{ alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="sk-accent green">glossary</span>
            <h2 className="sk-h2" style={{ marginTop: 4 }}>Pulsar-timing terms, with pictures</h2>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, maxWidth: 720 }}>
              Quick-reference visuals for the language used during a tutorial session. Search by term or tag (e.g.
              <code style={{ margin: "0 2px" }}>w50</code>, <code>stokes</code>, <code>rvm</code>). Press Esc to close.
            </div>
          </div>
          <div className="sk-row sk-gap-8" style={{ alignItems: "center" }}>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="search…"
              style={{ padding: "6px 10px", border: "1px solid var(--ink-4)", borderRadius: 6, fontFamily: "var(--font-body)", fontSize: 13, minWidth: 180, background: "var(--paper)" }} />
            <button onClick={onClose} className="sk-chip" style={{ cursor: "pointer", border: "1px solid var(--ink-4)", background: "transparent" }}>close ✕</button>
          </div>
        </div>
        <div style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}>
          {visible.map((t, i) => {
            const VW = 320, VH = 130;
            return (
              <div key={i} className="sk-box" style={{ padding: 14 }}>
                <div className="sk-h3" style={{ fontSize: 15, marginBottom: 6 }}>{t.k}</div>
                <svg width="100%" viewBox={`0 0 ${VW} ${VH}`} style={{ display: "block", border: "1px solid var(--ink-4)", borderRadius: 4, background: "var(--paper-2)" }}>
                  {t.svg(VW, VH)}
                </svg>
                <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink-2)", marginTop: 8 }}>{t.body}</div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div style={{ fontFamily: "var(--font-body)", color: "var(--ink-3)", padding: 20 }}>
              No terms match — try a shorter query, or clear the search.
            </div>
          )}
        </div>
        <div style={{ marginTop: 18, paddingTop: 12, borderTop: "1px dashed var(--ink-4)", fontSize: 11.5, color: "var(--ink-3)" }}>
          Missing a term? Drop it on <a href="mailto:hgcombrinck@gmail.com" style={{ color: "var(--green)" }}>hgcombrinck@gmail.com</a> or open an issue on GitHub.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SiteHeader, SiteFooter, Annotate, PulseProfile, DataCube, PhaseFreqPlot, Residuals,
  TerminalLine, ABTag, DedispCurves, CalibPolar, heatColor, realisticProfile,
  GlossaryOverlay,
});
