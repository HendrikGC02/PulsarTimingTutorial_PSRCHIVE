/* global React */
/* Small reusable sketch parts shared by all wireframes. */

const { useEffect, useState, useRef } = React;

// Site header that appears at the top of every wireframe (faux navigation)
function SiteHeader({ active = "landing", compact = false }) {
  const [dark, setDark] = useState(() => {
    try { return document.documentElement.getAttribute("data-theme") === "dark"; } catch (e) { return false; }
  });
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

// Diagram: pulse profile (squiggle on dark bg or paper)
function PulseProfile({ w = 220, h = 80, dark = false, color = "var(--green)" }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      {dark && <rect width={w} height={h} fill="var(--plot-bg)" />}
      {/* baseline */}
      <line x1="4" y1={h - 12} x2={w - 4} y2={h - 12} stroke={dark ? "#555" : "#999"} strokeWidth="1" strokeDasharray="3 3" />
      {/* profile */}
      <path
        d={`M 4 ${h - 14}
            L ${w * 0.30} ${h - 14}
            C ${w * 0.34} ${h - 14}, ${w * 0.36} 8, ${w * 0.42} 8
            C ${w * 0.46} 8, ${w * 0.48} ${h - 14}, ${w * 0.52} ${h - 14}
            L ${w - 4} ${h - 14}`}
        fill="none"
        stroke={dark ? "#e08545" : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

Object.assign(window, {
  SiteHeader, Annotate, PulseProfile, DataCube, PhaseFreqPlot, Residuals,
  TerminalLine, ABTag,
});
