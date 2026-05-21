/* global React, heatColor, realisticProfile */
/* Interactive / animated diagrams for the landing page.
   Each is small and self-contained. They auto-play on first
   intersection and expose a play/pause + scrub. */

const { useEffect, useState, useRef, useMemo } = React;

/* ---------- shared: a tiny play/scrub control ---------- */
function ScrubBar({ t, setT, playing, setPlaying, label, steps }) {
  return (
    <div className="sk-row" style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
      <button
        onClick={() => setPlaying(!playing)}
        style={{
          width: 26, height: 26, borderRadius: 13,
          border: "1px solid var(--green)", background: playing ? "var(--green)" : "transparent",
          color: playing ? "var(--paper)" : "var(--green)",
          cursor: "pointer", fontSize: 11, lineHeight: 1, fontFamily: "var(--font-mono)",
        }}
        aria-label={playing ? "pause" : "play"}
      >{playing ? "▮▮" : "▶"}</button>
      <input
        type="range" min="0" max="1000" value={Math.round(t * 1000)}
        onChange={e => { setPlaying(false); setT(+e.target.value / 1000); }}
        style={{ flex: 1, accentColor: "var(--green)" }}
      />
      {label && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", minWidth: 80, textAlign: "right" }}>{label}</span>}
      {steps && (
        <div className="sk-row" style={{ gap: 4 }}>
          {steps.map((s, i) => (
            <button key={i} onClick={() => { setPlaying(false); setT(s.t); }}
              style={{
                fontFamily: "var(--font-mono)", fontSize: 10,
                padding: "2px 6px", borderRadius: 3, cursor: "pointer",
                border: "1px solid var(--green)",
                background: Math.abs(t - s.t) < 0.05 ? "var(--green)" : "transparent",
                color: Math.abs(t - s.t) < 0.05 ? "var(--paper)" : "var(--green)",
              }}
            >{s.lbl}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function useAutoTime(playing, setPlaying, duration = 6000, loop = true) {
  const [t, setT] = useState(0);
  const startedAt = useRef(null);
  const offsetAt = useRef(0);
  useEffect(() => {
    if (!playing) { startedAt.current = null; offsetAt.current = t; return; }
    let raf;
    function tick(ts) {
      if (startedAt.current === null) startedAt.current = ts;
      const elapsed = (ts - startedAt.current) / duration + offsetAt.current;
      if (elapsed >= 1) {
        if (loop) { startedAt.current = ts; offsetAt.current = 0; setT(0); }
        else { setT(1); setPlaying(false); return; }
      } else {
        setT(elapsed);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, duration]);
  return [t, setT];
}

/* deterministic pseudo-random for stable noise across renders */
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ============================================================
   1 · FOLDING — N rotations averaging into a clean profile
      A faint "cloud" of individual rotation traces sits behind
      the running average; cloud thins and fades as N grows.
   ============================================================ */
function FoldingAnim({ w = 460, h = 200 }) {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useAutoTime(playing, setPlaying, 7000);
  const logN = 0 + t * 5;
  const N = Math.round(Math.pow(10, logN));
  const noiseAmp = 1 / Math.sqrt(N);
  const rng = useMemo(() => mulberry32(7), []);
  const pts = useMemo(() => {
    const xs = [];
    for (let i = 0; i < 240; i++) {
      const phase = i / 240;
      // realistic asymmetric J0437-style profile (see diagrams.jsx)
      const signal = (typeof realisticProfile === "function")
        ? realisticProfile(phase) * 0.85
        : (0.85 * Math.exp(-Math.pow((phase - 0.42) / 0.04, 2))
          + 0.45 * Math.exp(-Math.pow((phase - 0.55) / 0.025, 2)));
      xs.push({ phase, signal, n: rng() * 2 - 1 });
    }
    return xs;
  }, [rng]);
  // 14 jittered "cloud" traces sit behind the running average. Each has a
  // fixed seed so the cloud is stable. They fade as N grows (cloud → mean).
  const cloudSeeds = useMemo(() => [11, 23, 37, 41, 53, 67, 79, 89, 97, 103, 113, 127, 139, 151], []);
  const cloudOpacity = Math.max(0, 0.55 - t * 0.45);
  const cloudPath = (seed) => {
    const r = mulberry32(seed);
    return pts.map((p, i) => {
      const v = p.signal + (r() * 2 - 1) * 0.7;
      const x = 36 + (w - 56) * p.phase;
      const y = h - 30 - v * (h - 80);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };
  const path = pts.map((p, i) => {
    const v = p.signal + p.n * noiseAmp * 1.8;
    const x = 36 + (w - 56) * p.phase;
    const y = h - 30 - v * (h - 80);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const steps = [
    { lbl: "N=1", t: 0 },
    { lbl: "N=10²", t: 0.4 },
    { lbl: "N=10⁴", t: 0.8 },
    { lbl: "N=10⁵", t: 1 },
  ];
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", background: "var(--card-2)", borderRadius: 6 }}>
        <line x1="36" y1={h - 30} x2={w - 12} y2={h - 30} stroke="var(--ink-4)" strokeWidth="1" />
        <line x1="36" y1="14" x2="36" y2={h - 30} stroke="var(--ink-4)" strokeWidth="1" />
        <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">pulse phase</text>
        <text x="14" y={h / 2} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)" transform={`rotate(-90 14 ${h / 2})`}>flux</text>
        {/* cloud of individual rotations behind the mean */}
        {cloudOpacity > 0.01 && cloudSeeds.map((s, i) => (
          <path key={i} d={cloudPath(s)} fill="none" stroke="var(--ink-3)" strokeWidth="0.7" opacity={cloudOpacity * (0.45 + (i % 3) * 0.18)} />
        ))}
        {/* the running average */}
        <path d={path} fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinejoin="round" />
        <g transform={`translate(${w - 110}, 18)`}>
          <rect width="98" height="26" rx="13" fill="var(--green)" />
          <text x="49" y="18" textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--paper)">
            N = {N.toLocaleString()}
          </text>
        </g>
      </svg>
      <ScrubBar t={t} setT={setT} playing={playing} setPlaying={setPlaying}
        label={`σ ∝ 1/√N`} steps={steps} />
    </div>
  );
}

/* ============================================================
   2 · DATA CUBE — drag to rotate, click axis chips to highlight
   ============================================================ */
function DataCubeInteractive({ size = 280 }) {
  const [hl, setHl] = useState(null); // 'phase' | 'freq' | 'time' | null
  const [rot, setRot] = useState(0); // -1 .. 1 horizontal rotation
  const dragRef = useRef(null);
  function onDown(e) {
    dragRef.current = { x: e.clientX, rot };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function onMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    setRot(Math.max(-1, Math.min(1, dragRef.current.rot + dx / 200)));
  }
  function onUp() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }
  const W = size, H = size * 0.95;
  const cx = W / 2, cy = H * 0.58;
  const s = size * 0.32;
  const skew = rot * 0.4; // -0.4 .. 0.4
  const dx = s * (1 + skew * 0.5);
  const dxL = s * (1 - skew * 0.5);
  const dy = s * 0.55;
  const dz = s * 0.95;

  const top = `M ${cx} ${cy - dz - dy} L ${cx + dx} ${cy - dz} L ${cx} ${cy - dz + dy} L ${cx - dxL} ${cy - dz} Z`;
  const right = `M ${cx + dx} ${cy - dz} L ${cx + dx} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;
  const left = `M ${cx - dxL} ${cy - dz} L ${cx - dxL} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;

  const FACE_ON  = "rgba(14,59,46,0.55)";
  const FACE_OFF = "rgba(14,59,46,0.06)";

  // ----- 2D "slice" projection that appears alongside when an axis is hovered.
  // Slices model what `psrplot` actually produces along each axis:
  //   phase   → 1D integrated profile  (psrplot -p flux -j FT)
  //   freq    → phase × freq heatmap   (psrplot -p freq -j DT)
  //   time    → phase × time heatmap   (psrplot -p time -j DF)
  //   pol     → stacked I,L,V profile with PA on top  (psrplot -p Scyl / pa)
  const NX = 64, NY_F = 28, NY_T = 22;
  // Use a realistic pulse profile rather than a generic gaussian.
  const profileAt = (xIdx) => (typeof realisticProfile === "function")
      ? realisticProfile(xIdx / NX)
      : Math.exp(-Math.pow((xIdx - NX*0.42) / (NX*0.04), 2));

  // phase × freq: pulse appears at SAME phase across all channels
  // (dedispersed), brightness scales with frequency-dependent flux density
  // (spectral index ≈ -1.5), with scintles patches per channel.
  const freqCells = useMemo(() => {
    const rng = mulberry32(17);
    const a = [];
    // per-channel scintle gain
    const chanGain = Array.from({ length: NY_F }, (_, y) => {
      const lowFreqBoost = (y / NY_F);             // y=0 high freq, y=NY_F-1 low freq
      const scint = 0.55 + 0.45 * Math.sin(y * 0.9 + 0.3) * Math.sin(y * 0.31);
      return Math.max(0.05, 0.4 + 1.1 * lowFreqBoost) * scint;
    });
    for (let y = 0; y < NY_F; y++) {
      for (let x = 0; x < NX; x++) {
        const sig = profileAt(x) * chanGain[y];
        a.push({ x, y, v: sig + rng() * 0.025 });
      }
    }
    return a;
  }, []);

  // phase × time: pulse at same phase across all subintegrations, brightness
  // drifts slowly (calibration + scintillation), one faint dropout subint.
  const timeCells = useMemo(() => {
    const rng = mulberry32(43);
    const a = [];
    const subintGain = Array.from({ length: NY_T }, (_, y) => {
      const slow = 0.7 + 0.3 * Math.sin(y * 0.35 + 0.6);
      const drop = (y === 7) ? 0.15 : (y === 16 ? 0.35 : 1);
      return slow * drop;
    });
    for (let y = 0; y < NY_T; y++) {
      for (let x = 0; x < NX; x++) {
        const sig = profileAt(x) * subintGain[y];
        a.push({ x, y, v: sig + rng() * 0.025 });
      }
    }
    return a;
  }, []);

  function Slice() {
    if (!hl) return null;
    const sw = 130, sh = 96;
    const drawHeat = (cells, ny) => {
      const cw = sw / NX, ch = sh / ny;
      return (
        <g>
          {cells.map((c, i) => {
            const [r, g, b] = heatColor(Math.min(1, c.v));
            return <rect key={i} x={c.x * cw} y={c.y * ch} width={cw + 0.4} height={ch + 0.4} fill={`rgb(${r},${g},${b})`} />;
          })}
        </g>
      );
    };

    let body, caption, axes;
    if (hl === "phase") {
      // 1D integrated profile.
      const pts = [];
      for (let i = 0; i < NX; i++) {
        const x = (i / (NX - 1)) * sw;
        const y = sh - 4 - profileAt(i) * (sh - 12);
        pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
      body = <g>
        <rect width={sw} height={sh} fill="var(--paper-2)" />
        <line x1="0" y1={sh - 4} x2={sw} y2={sh - 4} stroke="var(--ink-4)" strokeWidth="0.6" />
        <path d={pts.join(" ")} fill="none" stroke="var(--green)" strokeWidth="1.6" />
      </g>;
      caption = "flux vs phase  (-j FT)";
      axes = "↳ collapse freq + time";
    } else if (hl === "freq") {
      body = <g><rect width={sw} height={sh} fill="#000" />{drawHeat(freqCells, NY_F)}</g>;
      caption = "phase × freq  (psrplot -p freq)";
      axes = "↳ pulse at same phase, every channel";
    } else if (hl === "time") {
      body = <g><rect width={sw} height={sh} fill="#000" />{drawHeat(timeCells, NY_T)}</g>;
      caption = "phase × time  (psrplot -p time)";
      axes = "↳ pulse stable across subints";
    } else { // pol
      // Stacked profile: I solid, L dashed, V dotted; tiny PA scatter above.
      const yMid = sh * 0.68;
      const span = sh * 0.42;
      const profPath = (scale, offset = 0) => {
        const pts = [];
        for (let i = 0; i < NX; i++) {
          const x = (i / (NX - 1)) * sw;
          const v = profileAt(i) * scale + offset;
          const y = yMid - v * span;
          pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        return pts.join(" ");
      };
      // small PA S-curve scatter at top of pol panel
      const paPts = [];
      for (let i = 0; i < NX; i++) {
        const phase = i / NX;
        if (profileAt(i) < 0.18) continue;
        const dphi = (phase - 0.42) * 14;
        const psi = Math.atan2(Math.sin(dphi), 0.25 - Math.cos(dphi)); // S-curve
        const x = (i / (NX - 1)) * sw;
        const y = 4 + (1 - (psi + Math.PI) / (2 * Math.PI)) * (sh * 0.22);
        paPts.push(<circle key={i} cx={x} cy={y} r={0.9} fill="#c25a2c" />);
      }
      body = <g>
        <rect width={sw} height={sh} fill="var(--paper-2)" />
        <line x1="0" y1={sh * 0.26} x2={sw} y2={sh * 0.26} stroke="var(--ink-4)" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="0" y1={yMid} x2={sw} y2={yMid} stroke="var(--ink-4)" strokeWidth="0.5" />
        {paPts}
        <path d={profPath(1.0)} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
        <path d={profPath(0.55)} fill="none" stroke="#c0392b" strokeWidth="1.3" strokeDasharray="3 2" />
        <path d={profPath(-0.32, 0.08)} fill="none" stroke="#2b6fc0" strokeWidth="1.3" strokeDasharray="1 2" />
        <text x={4} y={sh * 0.24 - 2} fontSize="8" fontFamily="var(--font-mono)" fill="var(--ink-3)">P.A.</text>
        <text x={sw - 4} y={yMid - span * 0.85} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--ink)">I</text>
        <text x={sw - 4} y={yMid - span * 0.5} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="#c0392b">L</text>
        <text x={sw - 4} y={yMid + span * 0.25} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="#2b6fc0">V</text>
      </g>;
      caption = "Stokes I, L, V + P.A.";
      axes = "↳ the hidden 4th axis";
    }
    return (
      <svg width={sw + 4} height={sh + 30} viewBox={`0 0 ${sw + 4} ${sh + 30}`} style={{ display: "block" }}>
        <rect x={1} y={1} width={sw + 2} height={sh + 2} fill="none" stroke="var(--green)" strokeWidth="1.2" />
        <g transform="translate(2, 2)">{body}</g>
        <text x={(sw + 4) / 2} y={sh + 14} textAnchor="middle" fontSize="10" fontFamily="var(--font-body)" fill="var(--ink-2)">{caption}</text>
        <text x={(sw + 4) / 2} y={sh + 26} textAnchor="middle" fontSize="9" fontFamily="var(--font-hand)" fill="var(--ink-3)">{axes}</text>
      </svg>
    );
  }

  return (
    <div style={{ userSelect: "none", touchAction: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} onPointerDown={onDown} style={{ display: "block", cursor: dragRef.current ? "grabbing" : "grab", flex: "0 0 auto", overflow: "visible" }}>
        <defs>
          <pattern id="dci-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(14,59,46,.45)" strokeWidth="1.2" />
          </pattern>
          <pattern id="dci-dots" width="8" height="8" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(14,59,46,.5)" />
          </pattern>
        </defs>
        {/* ghost cubes for the four Stokes parameters — they fan out from
            under the main cube when the user hovers the pol chip, then
            collapse back.  Drawn first so they live behind the main cube. */}
        {(() => {
          const polActive = hl === "pol";
          // four positions: I (center, behind), Q/U/V fanned to the side
          const stokes = [
            { k: "I", color: "var(--ink)",   tx:  0, ty: 0,  delay: 0 },
            { k: "Q", color: "#c0392b",      tx: 70, ty: 14, delay: 80 },
            { k: "U", color: "#2b8c4b",      tx: 70, ty: -10, delay: 140 },
            { k: "V", color: "#2b6fc0",      tx: 70, ty: 38, delay: 200 },
          ];
          return stokes.slice(1).map((sk) => {
            const off = polActive ? 1 : 0;
            const gx = sk.tx * off;
            const gy = sk.ty * off;
            const scale = polActive ? 0.62 : 1;
            const op = polActive ? 0.85 : 0;
            return (
              <g key={sk.k}
                 style={{
                   transition: `transform 380ms cubic-bezier(.22,1,.36,1) ${sk.delay}ms, opacity 380ms ${sk.delay}ms`,
                   transform: `translate(${gx}px, ${gy}px) scale(${scale})`,
                   transformOrigin: `${cx}px ${cy}px`,
                   opacity: op,
                 }}>
                <path d={top}   fill="rgba(255,255,255,.6)" stroke={sk.color} strokeWidth="1.2" />
                <path d={right} fill="rgba(255,255,255,.4)" stroke={sk.color} strokeWidth="1.2" />
                <path d={left}  fill="rgba(255,255,255,.25)" stroke={sk.color} strokeWidth="1.2" />
                <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill={sk.color}>{sk.k}</text>
              </g>
            );
          });
        })()}
        {/* main cube */}
        <g style={{
              transition: "transform 380ms cubic-bezier(.22,1,.36,1)",
              transform: hl === "pol" ? `translate(-12px, -8px) scale(0.92)` : "none",
              transformOrigin: `${cx}px ${cy}px`,
           }}>
          {/* top = phase face */}
          <path d={top}   fill={hl === "phase" ? FACE_ON : "url(#dci-dots)"} stroke="var(--ink)" strokeWidth="1.5" />
          {/* right = freq face */}
          <path d={right} fill={hl === "freq"  ? FACE_ON : "url(#dci-stripes)"} stroke="var(--ink)" strokeWidth="1.5" />
          {/* left = time face */}
          <path d={left}  fill={hl === "time"  ? FACE_ON : FACE_OFF} stroke="var(--ink)" strokeWidth="1.5" />
          {/* pulse on the front edge */}
          <path d={`M ${cx - dxL + 4} ${cy - 6} L ${cx - dxL + s * 0.5} ${cy - 6} L ${cx - dxL + s * 0.6} ${cy - 26} L ${cx - dxL + s * 0.72} ${cy - 6} L ${cx} ${cy + dy - 4}`}
            fill="none" stroke="var(--plot-warm)" strokeWidth="1.8" />
          {hl === "pol" && (
            <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="13" fontWeight="700" fill="var(--ink)">I</text>
          )}
        </g>
        <text x={cx + dx + 4}  y={cy - dz / 2}     fontSize="13" fontFamily="var(--font-mono)" fill="var(--green)">freq</text>
        <text x={cx - dxL - 36} y={cy - dz / 2}    fontSize="13" fontFamily="var(--font-mono)" fill="var(--green)">time</text>
        <text x={cx - 18}      y={cy - dz - dy - 6} fontSize="13" fontFamily="var(--font-mono)" fill="var(--green)">phase</text>
        {hl === "pol" && (
          <text x={cx + 70} y={cy + dy + 22} textAnchor="middle" fontSize="10" fontFamily="var(--font-hand)" fill="var(--ink-3)">
            pol is a 4th axis — one cube per Stokes parameter
          </text>
        )}
      </svg>
      <div style={{ width: 150, minHeight: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {hl ? <Slice /> : <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-4)", textAlign: "center", padding: 8, border: "1px dashed var(--ink-4)", borderRadius: 6 }}>hover a chip<br/>to project a slice</div>}
      </div>
      </div>
      <div className="sk-row sk-gap-6" style={{ marginTop: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {[
          ["phase",     "phase"],
          ["freq",      "frequency"],
          ["time",      "time"],
          ["pol",       "Stokes I,Q,U,V"],
        ].map(([k, lbl]) => (
          <button key={k}
            onMouseEnter={() => setHl(k)} onMouseLeave={() => setHl(null)}
            className={"sk-chip" + (hl === k ? " green fill" : " green")}
            style={{ cursor: "pointer", border: "1px solid var(--green)" }}
          >{lbl}</button>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 6, fontSize: 11, fontFamily: "var(--font-body)", color: "var(--ink-3)" }}>
        drag the cube · hover a chip to highlight its axis
      </div>
    </div>
  );
}

/* ============================================================
   3 · RFI MORPH — drag the slider from "raw" to "zapped"
   ============================================================ */
/* RfiMorph — crossfade between real PSRCHIVE freq×phase plots before/after
   `paz -r`.  The PNGs were generated by `tools/generate_plots.sh` against a
   live archive (see plots/MANIFEST.json), so what the reader sees is what
   the command actually produces — not a synthesized stand-in. */
function RfiMorph({ w = 520, h = 280, before = "plots/landing/rfi-before.png", after = "plots/landing/rfi-after.png" }) {
  const [t, setT] = useState(0); // 0 = raw, 1 = cleaned
  const [playing, setPlaying] = useState(false);
  const [autoT] = useAutoTime(playing, setPlaying, 3500, false);
  const z = playing ? autoT : t;
  const [loadedBefore, setLoadedBefore] = useState(true);
  const [loadedAfter, setLoadedAfter] = useState(true);
  return (
    <div>
      <div style={{ position: "relative", width: w, height: h, background: "#000", borderRadius: 4, overflow: "hidden" }}>
        {/* before (visible at t=0) */}
        {loadedBefore && (
          <img src={before} onError={() => setLoadedBefore(false)} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 1 - z, transition: playing ? "none" : "opacity 80ms linear" }} />
        )}
        {/* after (visible at t=1) */}
        {loadedAfter && (
          <img src={after} onError={() => setLoadedAfter(false)} alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: z, transition: playing ? "none" : "opacity 80ms linear" }} />
        )}
        {/* fallback message if neither image loaded */}
        {!loadedBefore && !loadedAfter && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#9fbeae", fontFamily: "var(--font-mono)", fontSize: 12, padding: 24, textAlign: "center" }}>
            real PSRCHIVE before/after PNGs unavailable.<br/>
            Run <code>tools/generate_plots.sh</code> to populate
            <code>plots/landing/rfi-before.png</code> and <code>rfi-after.png</code>.
          </div>
        )}
        {/* state badge */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          background: "var(--green)", color: "var(--paper)",
          padding: "4px 10px", borderRadius: 12,
          fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
        }}>
          {z < 0.05 ? "raw" : z > 0.95 ? "zapped ✓" : `paz ${Math.round(z * 100)}%`}
        </div>
        {/* phase / freq axis hints overlaid */}
        <div style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%) rotate(-90deg)", transformOrigin: "left center", color: "#bbb", fontFamily: "var(--font-body)", fontSize: 11, opacity: 0.7, pointerEvents: "none" }}>frequency</div>
        <div style={{ position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", color: "#bbb", fontFamily: "var(--font-body)", fontSize: 11, opacity: 0.7, pointerEvents: "none" }}>pulse phase</div>
      </div>
      <ScrubBar t={z} setT={setT} playing={playing} setPlaying={setPlaying}
        label="paz -r" steps={[{ lbl: "raw", t: 0 }, { lbl: "zapped", t: 1 }]} />
      <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-3)" }}>
        real frequency × phase plots from a MeerKAT J0437-4715 archive — slide to see what <code>paz -r</code> actually removes.
      </div>
    </div>
  );
}

/* ============================================================
   4 · SCRUNCH — step through fscrunch / tscrunch / bscrunch
   ============================================================ */
function ScrunchAnim() {
  const STEPS = [
    { lbl: "raw",         fz: 1,   tz: 1,   bz: 1,   cmd: "(none)",                  hand: "1024 ch · 128 sub · 1024 bin" },
    { lbl: "fscrunch ×4", fz: 0.5, tz: 1,   bz: 1,   cmd: "pam --setnchn 256 -e f4", hand: "256 ch · 128 sub · 1024 bin" },
    { lbl: "tscrunch all",fz: 0.5, tz: 0.18, bz: 1,  cmd: "pam -T -e Tscr",          hand: "256 ch · 1 sub · 1024 bin" },
    { lbl: "bscrunch ×2", fz: 0.5, tz: 0.18, bz: 0.6,cmd: "pam --bscrunch 2",        hand: "256 ch · 1 sub · 512 bin" },
  ];
  const [idx, setIdx] = useState(0);
  const cur = STEPS[idx];
  // smoothly animate the cube dimensions
  const [anim, setAnim] = useState({ fz: 1, tz: 1, bz: 1 });
  useEffect(() => {
    let raf, start;
    const from = anim;
    const to = { fz: cur.fz, tz: cur.tz, bz: cur.bz };
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 600);
      const ease = 1 - Math.pow(1 - p, 3);
      setAnim({
        fz: from.fz + (to.fz - from.fz) * ease,
        tz: from.tz + (to.tz - from.tz) * ease,
        bz: from.bz + (to.bz - from.bz) * ease,
      });
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);
  const size = 220;
  const W = size, H = size * 0.95;
  const cx = W / 2, cy = H * 0.55;
  const s = size * 0.32;
  const dx = s * anim.fz, dy = s * 0.55 * anim.tz, dz = s * 0.9 * anim.bz;
  const top   = `M ${cx} ${cy - dz - dy} L ${cx + dx} ${cy - dz} L ${cx} ${cy - dz + dy} L ${cx - dx} ${cy - dz} Z`;
  const right = `M ${cx + dx} ${cy - dz} L ${cx + dx} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;
  const left  = `M ${cx - dx} ${cy - dz} L ${cx - dx} ${cy} L ${cx} ${cy + dy} L ${cx} ${cy - dz + dy} Z`;
  return (
    <div>
      <div className="sk-row" style={{ gap: 16, alignItems: "stretch" }}>
        <div className="sk-box" style={{ padding: 16, flex: 1, textAlign: "center" }}>
          <div className="sk-h3" style={{ marginBottom: 6 }}>{cur.lbl}</div>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>
            <defs>
              <pattern id="sca-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(14,59,46,.45)" strokeWidth="1.2" />
              </pattern>
              <pattern id="sca-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(14,59,46,.5)" />
              </pattern>
            </defs>
            <path d={top}   fill="url(#sca-dots)"    stroke="var(--ink)" strokeWidth="1.5" />
            <path d={right} fill="url(#sca-stripes)" stroke="var(--ink)" strokeWidth="1.5" />
            <path d={left}  fill="rgba(14,59,46,.06)" stroke="var(--ink)" strokeWidth="1.5" />
            <text x={cx + dx + 4}  y={cy - dz / 2}     fontSize="11" fontFamily="var(--font-mono)" fill="var(--green)">freq</text>
            <text x={cx - dx - 30} y={cy - dz / 2}     fontSize="11" fontFamily="var(--font-mono)" fill="var(--green)">time</text>
            <text x={cx - 14}      y={cy - dz - dy - 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--green)">phase</text>
          </svg>
          <div className="sk-label" style={{ marginTop: 6 }}>{cur.hand}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{
                textAlign: "left", padding: "10px 14px", borderRadius: 6,
                border: i === idx ? "1px solid var(--green)" : "1px solid var(--ink-4)",
                background: i === idx ? "var(--green-mute)" : "var(--card)",
                color: "var(--ink)", cursor: "pointer", fontFamily: "var(--font-body)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{s.lbl}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>step {i + 1}</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>$ {s.cmd}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   5 · TEMPLATE STACKING — N noisy profiles stack, smooth curve draws
   ============================================================ */
function TemplateStacking({ w = 460, h = 220 }) {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useAutoTime(playing, setPlaying, 7500);
  // realistic asymmetric J0437-style profile (see diagrams.jsx)
  const profileBase = (phase) => (typeof realisticProfile === "function")
    ? realisticProfile(phase) * 0.85
    : (0.85 * Math.exp(-Math.pow((phase - 0.42) / 0.04, 2))
       + 0.45 * Math.exp(-Math.pow((phase - 0.55) / 0.025, 2)));
  const profiles = useMemo(() => {
    const rng = mulberry32(31);
    const arr = [];
    for (let k = 0; k < 8; k++) {
      const seed = [];
      for (let i = 0; i < 200; i++) {
        const phase = i / 200;
        seed.push(profileBase(phase) + (rng() - 0.5) * 0.18);
      }
      arr.push(seed);
    }
    return arr;
  }, []);
  // first 6/8 t goes to showing profiles 1..8 layered. Last 2/8 the smooth curve draws across.
  const shown = Math.min(profiles.length, Math.floor(t * 11));
  const drawSmooth = Math.max(0, (t - 0.7) / 0.3);
  const polyFor = (arr) => {
    return arr.map((v, i) => {
      const x = 36 + (w - 56) * (i / (arr.length - 1));
      const y = h - 30 - v * (h - 80);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };
  const smoothPath = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 200; i++) {
      const phase = i / 200;
      const x = 36 + (w - 56) * phase;
      const y = h - 30 - profileBase(phase) * (h - 80);
      pts.push([x, y]);
    }
    return pts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
  const dashLen = 1200;
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", background: "var(--card-2)", borderRadius: 6 }}>
        <line x1="36" y1={h - 30} x2={w - 12} y2={h - 30} stroke="var(--ink-4)" strokeWidth="1" />
        <line x1="36" y1="14" x2="36" y2={h - 30} stroke="var(--ink-4)" strokeWidth="1" />
        {profiles.slice(0, shown).map((p, i) => (
          <path key={i} d={polyFor(p)} fill="none" stroke="var(--ink-3)" strokeWidth="1" opacity={0.55 - i * 0.04} />
        ))}
        {/* the smoothed template draws on top */}
        <path
          d={`M ${smoothPath[0][0]} ${smoothPath[0][1]} ${smoothPath.slice(1).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")}`}
          fill="none" stroke="var(--green)" strokeWidth="2.6"
          strokeDasharray={dashLen}
          strokeDashoffset={dashLen * (1 - drawSmooth)}
          opacity={drawSmooth > 0 ? 1 : 0}
        />
        <text x={w - 14} y={28} textAnchor="end" fontSize="12" fontFamily="var(--font-mono)" fontWeight="700" fill="var(--green)">
          {drawSmooth > 0 ? "smoothed template" : `obs #${shown}/${profiles.length}`}
        </text>
        <text x={w / 2} y={h - 8} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">pulse phase</text>
      </svg>
      <ScrubBar t={t} setT={setT} playing={playing} setPlaying={setPlaying}
        label={drawSmooth > 0 ? "psrsmooth" : "stack obs"} />
    </div>
  );
}

Object.assign(window, {
  FoldingAnim, DataCubeInteractive, RfiMorph, ScrunchAnim, TemplateStacking,
});
