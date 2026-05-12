/* global React, SiteHeader, SiteFooter, PulseProfile, DataCube, PhaseFreqPlot, Residuals, TerminalLine, FoldingAnim, DataCubeInteractive, RfiMorph, ScrunchAnim, TemplateStacking, DedispCurves, CalibPolar, realisticProfile */

/* ============================================================
   V2 · LANDING PAGE
   Distill-style visual essay (was "A"), with the pipeline overview
   from "C" merged in as a sticky/hero anchor + per-section progress.
   Refined type: Space Grotesk headings, Caveat reserved for diagram
   annotations only, no wavy underlines.
   ============================================================ */

const V2_LANDING_W = 1240;
const V2_LANDING_H = 3650;  // give breathing room for taller step sections

const PIPELINE = [
  { n: "01", t: "Pulsar & profile", short: "fold rotations" },
  { n: "02", t: "Data cube",        short: "4-D archive" },
  { n: "03", t: "Dedisperse",       short: "remove ν⁻² delay" },
  { n: "04", t: "Zap RFI",          short: "paz · clfd" },
  { n: "05", t: "Calibrate",        short: "pac · pcm" },
  { n: "06", t: "Scrunch",          short: "pam -T/-F/-B" },
  { n: "07", t: "Template",         short: "paas · psrsmooth" },
  { n: "08", t: "TOAs & residuals", short: "pat → tempo2" },
];

function PipelineRail({ activeIdx = -1, compact = false }) {
  return (
    <div style={{ position: "relative" }}>
      <svg width="100%" height="2" style={{ position: "absolute", left: 0, top: compact ? 18 : 26 }} preserveAspectRatio="none" viewBox="0 0 100 2">
        <line x1="2" y1="1" x2="98" y2="1" stroke="var(--green)" strokeWidth="0.4" strokeDasharray="1 1" />
      </svg>
      <div className="sk-row" style={{ gap: 0, alignItems: "flex-start", position: "relative" }}>
        {PIPELINE.map((s, i) => {
          const active = i === activeIdx;
          return (
            <div key={i} className="sk-col" style={{ flex: 1, alignItems: "center", textAlign: "center", padding: "0 4px" }}>
              <div style={{
                width: compact ? 36 : 52, height: compact ? 36 : 52, borderRadius: "50%",
                border: "1.5px solid var(--green)",
                background: active ? "var(--green)" : "var(--paper)",
                color: active ? "var(--paper)" : "var(--green)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-display)", fontSize: compact ? 13 : 15, fontWeight: 600,
                letterSpacing: 0,
              }}>{s.n}</div>
              {!compact && (
                <>
                  <div className="sk-h3" style={{ fontSize: 13, marginTop: 8, fontWeight: 600 }}>{s.t}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.25 }}>{s.short}</div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepHeader({ idx, title, kicker }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <PipelineRail activeIdx={idx} compact />
      <div className="sk-row" style={{ alignItems: "baseline", gap: 14, marginTop: 18 }}>
        <span className="sk-accent green">step {PIPELINE[idx].n} · {kicker || PIPELINE[idx].t}</span>
      </div>
      <h2 className="sk-h1" style={{ fontSize: 38, marginTop: 6 }}>{title}</h2>
    </div>
  );
}

function LandingV2() {
  return (
    <div className="sk-page" style={{ width: V2_LANDING_W, minHeight: V2_LANDING_H }}>
      <SiteHeader active="landing" />

      {/* ---------- HERO ---------- */}
      <div style={{ padding: "70px 160px 30px" }}>
        <span className="sk-accent">A visual tutorial</span>
        <h1 className="sk-h1" style={{ fontSize: 68, marginTop: 14, lineHeight: 1.02, maxWidth: 900 }}>
          What is <span style={{ color: "var(--green)" }}>PSRCHIVE</span>, really?
        </h1>
        <div style={{ fontSize: 18, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 760, marginTop: 18 }}>
          A walk through the pipeline that takes raw, folded pulsar data and turns it into times of arrival —
          explained with diagrams you can poke at.
        </div>
        <div className="sk-row sk-gap-10" style={{ marginTop: 26 }}>
          <span className="sk-btn green" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 }}>Start reading ↓</span>
          <span className="sk-btn ghost" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 }}>Skip to playground</span>
        </div>
      </div>

      {/* ---------- PIPELINE OVERVIEW (merged from C) ---------- */}
      <div style={{ padding: "30px 160px 40px" }}>
        <div className="sk-box" style={{ padding: 28, background: "rgba(255,255,255,.5)" }}>
          <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
            <div>
              <span className="sk-accent green">the pipeline at a glance</span>
              <h2 className="sk-h2" style={{ marginTop: 6 }}>From photons to residuals.</h2>
            </div>
            <span className="sk-label">jump to any step ↓</span>
          </div>
          <PipelineRail />
        </div>
      </div>

      {/* ---------- 01 · pulsar & profile ---------- */}
      <div style={{ padding: "70px 160px", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 48 }}>
        <div>
          <StepHeader idx={0} title="Pulsars & pulse profiles" />
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
            A pulsar is a rotating neutron star whose beamed radio emission sweeps past Earth.
            A single rotation is buried in noise — fold many of them on the known period and the noise
            averages down. What's left is the <i>pulse profile</i>.
          </div>
        </div>
        <div className="sk-box" style={{ padding: 18 }}>
          <div className="sk-label">fig 1 · folding rotations into a profile</div>
          <div style={{ marginTop: 8 }}>
            <FoldingAnim w={460} h={200} />
          </div>
        </div>
      </div>

      {/* ---------- 02 · data cube ---------- */}
      <div style={{ padding: "50px 160px" }}>
        <StepHeader idx={1} title="The data cube" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          A PSRCHIVE archive is a four-dimensional block of numbers — <b>phase</b>, <b>frequency</b>, <b>time</b>,
          <b> polarisation</b>. Almost every command underneath is a projection, slice, or sum along one of these axes.
        </div>
        <div className="sk-box" style={{ marginTop: 18, padding: 28, display: "flex", gap: 36, alignItems: "center" }}>
          <DataCubeInteractive size={280} />
          <div style={{ flex: 1 }}>
            <div className="sk-h3" style={{ marginBottom: 10 }}>The four axes</div>
            <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
              Every command you'll see is a projection, slice, or sum along one of these. <b>psrplot</b> picks two axes and flattens the others; <b>pam</b> shrinks an axis in place; <b>paz</b> nulls bits of one.
            </div>
            <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.7 }}>
              <li><b>phase</b> — pulse rotation, [0, 1)</li>
              <li><b>frequency</b> — radio channel</li>
              <li><b>time</b> — sub-integration</li>
              <li><b>pol</b> — Stokes I, Q, U, V</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ---------- 03 · dedisperse ---------- */}
      <div style={{ padding: "70px 160px", display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <StepHeader idx={2} title="Dedispersion — undoing the ν⁻² delay" />
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
            Radio waves at different frequencies travel through the ionised interstellar medium at slightly different
            speeds. Low-frequency components arrive <i>later</i> than high-frequency ones, with the delay scaling as
            <b> Δt ∝ DM · ν⁻²</b>. Left uncorrected, the pulse smears across the band.
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 14 }}>
            <b>pam -d</b> applies an <i>incoherent</i> dedispersion — shifting each channel by its own delay so all
            channels line up at the same phase. Coherent dedispersion happens earlier, at the backend, by convolving
            the raw voltages with the inverse transfer function of the ISM.
          </div>
          <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
            <span className="sk-chip green">pam -d</span>
            <span className="sk-chip green">psrplot -j D</span>
            <span className="sk-chip">DM in archive header</span>
          </div>
        </div>
        <div className="sk-box" style={{ padding: 18 }}>
          <div className="sk-label">fig · channels aligning after dedispersion</div>
          <div style={{ marginTop: 8 }}>
            <DedispCurves w={460} h={240} />
          </div>
        </div>
      </div>

      {/* ---------- 04 · zap RFI ---------- */}
      <div style={{ padding: "70px 160px" }}>
        <StepHeader idx={3} title="Zapping radio frequency interference" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          Satellites, microwaves, that one bored undergrad — corrupt channels and sub-integrations. <b>paz</b>,
          <b> clfd</b>, or a careful manual zap mark them as zero-weight so they don't contaminate the average.
        </div>
        <div className="sk-box" style={{ marginTop: 18, padding: 12 }}>
          <RfiMorph w={1080} h={300} />
        </div>
        <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
          <span className="sk-chip green">paz</span>
          <span className="sk-chip green">clfd</span>
          <span className="sk-chip green">psrzap (manual)</span>
          <span style={{ marginLeft: "auto" }} className="sk-label">try this in playground →</span>
        </div>
      </div>

      {/* ---------- 05 · calibrate ---------- */}
      <div style={{ padding: "70px 160px", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 48, alignItems: "center" }}>
        <div className="sk-box" style={{ padding: 18 }}>
          <div className="sk-label">fig · Stokes profile before / after pac</div>
          <div style={{ marginTop: 8 }}>
            <CalibPolar w={460} h={240} />
          </div>
        </div>
        <div>
          <StepHeader idx={4} title="Polarisation calibration" />
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
            The receiver's two probes never have perfectly equal gain, perfectly orthogonal feeds, or zero cross-leakage.
            Without correcting these, the polarisation profile is a smeared, rotated lie. <b>pac</b> applies a known
            instrumental response derived from a noise diode or a calibrator pulsar.
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 14 }}>
            For the toughest receivers, <b>pcm</b> fits a full Measurement Equation model — gain, differential phase,
            ellipticity and orientation — per channel, often using a pulsar as its own polarisation reference.
          </div>
          <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
            <span className="sk-chip green">pac</span>
            <span className="sk-chip green">pcm</span>
            <span className="sk-chip">noise diode</span>
            <span className="sk-chip">MEM model</span>
          </div>
        </div>
      </div>

      {/* ---------- 06 · scrunch ---------- */}
      <div style={{ padding: "70px 160px" }}>
        <StepHeader idx={5} title="Scrunching — averaging axes away" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          <b>tscrunch</b>, <b>fscrunch</b>, <b>bscrunch</b>: collapse the time, frequency, or phase axis by
          summing groups. You trade resolution for signal-to-noise.
        </div>
        <div style={{ marginTop: 18 }}>
          <ScrunchAnim />
        </div>
      </div>

      {/* ---------- 07 · template ---------- */}
      <div style={{ padding: "70px 160px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}>
        <div>
          <StepHeader idx={6} title="Building a standard profile" />
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
            Fit gaussian components to a high-S/N observation with <b>paas</b>, or smooth wavelet-style with
            <b> psrsmooth</b>. This becomes the noise-free yardstick we cross-correlate every observation against.
          </div>
          <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
            <span className="sk-chip green">paas</span>
            <span className="sk-chip green">psrsmooth</span>
          </div>
        </div>
        <div className="sk-box" style={{ padding: 20 }}>
          <div className="sk-label">fig · stack of obs → smoothed template</div>
          <div style={{ marginTop: 8 }}>
            <TemplateStacking w={460} h={220} />
          </div>
        </div>
      </div>

      {/* ---------- 08 · TOAs + residuals ---------- */}
      <div style={{ padding: "70px 160px" }}>
        <StepHeader idx={7} title="TOAs & timing residuals" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          Cross-correlate observation × template with <b>pat</b>. The phase shift becomes a time-of-arrival.
          Feed many TOAs into a timing model, and what's left is <i>residuals</i> — the heartbeat of pulsar timing.
        </div>
        <div className="sk-row sk-gap-20" style={{ marginTop: 18, alignItems: "stretch" }}>
          <div className="sk-box" style={{ padding: 16, flex: 1 }}>
            <div className="sk-label">observation × template → Δφ</div>
            {/* template-and-observation overlay using realisticProfile.
                Template is the smoothed reference (dashed); observation is the
                same profile shifted by Δφ ≈ 0.012 in phase (orange marker). */}
            {(() => {
              const W = 460, H = 160;
              const NP = 240;
              const baseline = H - 22;
              const peak = 16;
              const span = baseline - peak;
              const shift = 0.015; // observation lags template by Δφ
              const phasePath = (off) => {
                const pts = [];
                for (let i = 0; i < NP; i++) {
                  const phase = i / NP;
                  const v = (typeof realisticProfile === "function")
                    ? realisticProfile(phase + off)
                    : 0.85 * Math.exp(-Math.pow((phase + off - 0.42)/0.04, 2));
                  const x = 16 + (W - 30) * phase;
                  const y = baseline - v * span;
                  pts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
                }
                return pts.join(" ");
              };
              const tipX = 16 + (W - 30) * 0.42;
              return (
                <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ marginTop: 6 }}>
                  <line x1="16" y1={baseline} x2={W-14} y2={baseline} stroke="var(--ink-4)" strokeWidth="1" />
                  {/* observation (solid, shifted) */}
                  <path d={phasePath(-shift)} fill="none" stroke="var(--ink)" strokeWidth="1.7" />
                  {/* template (dashed, unshifted) */}
                  <path d={phasePath(0)} fill="none" stroke="var(--green)" strokeWidth="1.8" strokeDasharray="4 3" />
                  {/* Δφ marker */}
                  <line x1={tipX} y1={peak - 2} x2={tipX + (W - 30) * shift} y2={peak - 2} stroke="var(--plot-warm)" strokeWidth="2.5" />
                  <text x={tipX - 4} y={peak - 6} fontSize="12" fontFamily="var(--font-hand)" fill="var(--plot-warm)">Δφ</text>
                  <text x="20" y={H - 4} fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">template (dashed) vs observation — phase shift Δφ becomes the TOA</text>
                </svg>
              );
            })()}
          </div>
          <div className="sk-box" style={{ padding: 16, flex: 1 }}>
            <div className="sk-label">residuals vs MJD</div>
            <Residuals w={440} h={160} />
          </div>
        </div>
        <div className="sk-box" style={{ marginTop: 18, padding: 16, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 auto" }}>
            <div className="sk-label">real smoothed template</div>
            <img src="plots/landing/template-stack.png" alt="Smoothed template profile"
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              style={{ display: "block", marginTop: 6, maxWidth: 280, maxHeight: 180, border: "1px solid var(--ink-4)", background: "#000" }} />
          </div>
          <div style={{ flex: 1, minWidth: 280, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
            What the cross-correlation is matching against in practice: a noise-free reference profile,
            built once from a high-S/N observation with <code>psrsmooth</code> or <code>paas</code> and reused
            for every TOA. The closer this template is to the truth, the smaller the residuals at the right.
          </div>
        </div>
      </div>

      {/* ---------- CTA ---------- */}
      <div style={{ padding: "40px 160px 60px", borderTop: "1px solid var(--ink-4)", marginTop: 30 }}>
        <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
          <div>
            <span className="sk-accent green">next</span>
            <h2 className="sk-h2" style={{ marginTop: 6 }}>Now try it on a real archive →</h2>
          </div>
          <div className="sk-row sk-gap-10">
            <a href="try-it.html" className="sk-btn green" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>Open the playground</a>
            <a href="reference.html" className="sk-btn ghost" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500, textDecoration: "none", color: "var(--ink)" }}>Command reference</a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

Object.assign(window, { LandingV2, V2_LANDING_W, V2_LANDING_H });
