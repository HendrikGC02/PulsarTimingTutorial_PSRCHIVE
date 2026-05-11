/* global React, SiteHeader, PulseProfile, DataCube, PhaseFreqPlot, Residuals, TerminalLine, ABTag */

/* ============================================================
   V2 · LANDING PAGE
   Distill-style visual essay (was "A"), with the pipeline overview
   from "C" merged in as a sticky/hero anchor + per-section progress.
   Refined type: Space Grotesk headings, Caveat reserved for diagram
   annotations only, no wavy underlines.
   ============================================================ */

const V2_LANDING_W = 1240;
const V2_LANDING_H = 2350;

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
    <div className="sk-page" style={{ width: V2_LANDING_W, height: V2_LANDING_H, overflow: "hidden" }}>
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
      <div style={{ padding: "30px 160px 20px" }}>
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
      <div style={{ padding: "40px 160px", display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 48 }}>
        <div>
          <StepHeader idx={0} title="Pulsars & pulse profiles" />
          <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)" }}>
            A pulsar is a rotating neutron star whose beamed radio emission sweeps past Earth.
            A single rotation is buried in noise — fold many of them on the known period and the noise
            averages down. What's left is the <i>pulse profile</i>.
          </div>
        </div>
        <div className="sk-box" style={{ padding: 18 }}>
          <div className="sk-label">fig 1 · folding 10⁴ rotations</div>
          <div style={{ marginTop: 8 }}>
            <PulseProfile w={460} h={140} />
          </div>
          <div className="sk-row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
            <span className="sk-label">N rotations →</span>
            <div className="sk-row sk-gap-4">
              <span className="sk-chip">1</span>
              <span className="sk-chip">100</span>
              <span className="sk-chip green fill">10 000</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 02 · data cube ---------- */}
      <div style={{ padding: "30px 160px" }}>
        <StepHeader idx={1} title="The data cube" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          A PSRCHIVE archive is a four-dimensional block of numbers — <b>phase</b>, <b>frequency</b>, <b>time</b>,
          <b> polarisation</b>. Almost every command underneath is a projection, slice, or sum along one of these axes.
        </div>
        <div className="sk-box" style={{ marginTop: 18, padding: 28, display: "flex", gap: 36, alignItems: "center", background: "rgba(255,255,255,.5)" }}>
          <DataCube size={250} animated />
          <div style={{ flex: 1 }}>
            <div className="sk-h3" style={{ marginBottom: 10 }}>The four axes</div>
            <div className="sk-col sk-gap-6">
              <div className="sk-row" style={{ alignItems: "center", gap: 10 }}><span className="sk-chip green fill" style={{ minWidth: 110, justifyContent: "center" }}>phase</span> <span style={{ fontSize: 13, color: "var(--ink-2)" }}>pulse rotation, [0, 1)</span></div>
              <div className="sk-row" style={{ alignItems: "center", gap: 10 }}><span className="sk-chip green"  style={{ minWidth: 110, justifyContent: "center" }}>frequency</span> <span style={{ fontSize: 13, color: "var(--ink-2)" }}>radio channel</span></div>
              <div className="sk-row" style={{ alignItems: "center", gap: 10 }}><span className="sk-chip green"  style={{ minWidth: 110, justifyContent: "center" }}>time</span> <span style={{ fontSize: 13, color: "var(--ink-2)" }}>sub-integration</span></div>
              <div className="sk-row" style={{ alignItems: "center", gap: 10 }}><span className="sk-chip green"  style={{ minWidth: 110, justifyContent: "center" }}>pol</span> <span style={{ fontSize: 13, color: "var(--ink-2)" }}>Stokes I, Q, U, V</span></div>
            </div>
          </div>
        </div>
        <div className="sk-row sk-gap-10" style={{ marginTop: 16, alignItems: "center" }}>
          <span className="sk-marker green" style={{ fontSize: 19 }}>↑ drag to rotate</span>
          <span style={{ color: "var(--ink-3)", fontSize: 13 }}>· every projection you see later is a flattening of this cube</span>
        </div>
      </div>

      {/* ---------- 04 · zap RFI (skipping 03 dedisperse in the visible wireframe to fit) ---------- */}
      <div style={{ padding: "40px 160px" }}>
        <StepHeader idx={3} title="Zapping radio frequency interference" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          Satellites, microwaves, that one bored undergrad — corrupt channels and sub-integrations. <b>paz</b>,
          <b> clfd</b>, or a careful manual zap mark them as zero-weight so they don't contaminate the average.
        </div>
        <div className="sk-row sk-gap-20" style={{ marginTop: 18, alignItems: "stretch" }}>
          <div className="sk-box" style={{ padding: 8, flex: 1 }}>
            <div className="sk-label" style={{ textAlign: "center", margin: "2px 0 6px" }}>before</div>
            <PhaseFreqPlot w={520} h={260} cleaned={false} />
          </div>
          <div className="sk-box green" style={{ padding: 8, flex: 1, position: "relative" }}>
            <div className="sk-label green" style={{ textAlign: "center", margin: "2px 0 6px" }}>after  ✓</div>
            <PhaseFreqPlot w={520} h={260} cleaned={true} />
          </div>
        </div>
        <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
          <span className="sk-chip green">paz</span>
          <span className="sk-chip green">clfd</span>
          <span className="sk-chip green">psrzap (manual)</span>
          <span style={{ marginLeft: "auto" }} className="sk-label">try this in playground →</span>
        </div>
      </div>

      {/* ---------- 06 · scrunch ---------- */}
      <div style={{ padding: "40px 160px" }}>
        <StepHeader idx={5} title="Scrunching — averaging axes away" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          <b>tscrunch</b>, <b>fscrunch</b>, <b>bscrunch</b>: collapse the time, frequency, or phase axis by
          summing groups. You trade resolution for signal-to-noise.
        </div>
        <div className="sk-row sk-gap-16" style={{ marginTop: 18 }}>
          {[
            { lbl: "before",       cube: 230, hand: "1024 ch · 128 sub",  cmd: "" },
            { lbl: "fscrunch ×4",  cube: 200, hand: "256 ch · 128 sub",   cmd: "pam --setnchn 256 -e f4" },
            { lbl: "tscrunch all", cube: 170, hand: "256 ch · 1 sub",     cmd: "pam -T -e Tscr" },
          ].map((s, i) => (
            <div key={i} className="sk-box" style={{ padding: 16, flex: 1, textAlign: "center" }}>
              <div className="sk-h3" style={{ marginBottom: 6 }}>{s.lbl}</div>
              <div style={{ display: "flex", justifyContent: "center" }}><DataCube size={s.cube} /></div>
              <div className="sk-label" style={{ marginTop: 6 }}>{s.hand}</div>
              {s.cmd && (
                <div className="sk-code" style={{ marginTop: 10, textAlign: "left", fontSize: 11 }}>
                  <span className="prompt">$</span> {s.cmd}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---------- 07 · template ---------- */}
      <div style={{ padding: "40px 160px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center" }}>
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
          <div className="sk-label">fig · stack of obs → smooth template</div>
          <svg width="100%" height="180" viewBox="0 0 460 180" style={{ marginTop: 6 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <path key={i}
                d={`M 0 ${156 - i * 2} C 90 ${150 - i * 2}, 140 ${30 + i * 10}, 200 ${30 + i * 10} C 260 ${30 + i * 10}, 300 ${150 - i * 2}, 460 ${152 - i * 2}`}
                fill="none" stroke="var(--ink-4)" strokeWidth="1" opacity={0.5} />
            ))}
            <path d="M 0 156 C 90 150, 140 28, 200 28 C 260 28, 300 150, 460 152" fill="none" stroke="var(--green)" strokeWidth="2.4" />
            <text x="210" y="22" fontSize="11" fontFamily="var(--font-hand)" fill="var(--green)">smoothed template</text>
          </svg>
        </div>
      </div>

      {/* ---------- 08 · TOAs + residuals ---------- */}
      <div style={{ padding: "40px 160px" }}>
        <StepHeader idx={7} title="TOAs & timing residuals" />
        <div style={{ fontSize: 15.5, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 820 }}>
          Cross-correlate observation × template with <b>pat</b>. The phase shift becomes a time-of-arrival.
          Feed many TOAs into a timing model, and what's left is <i>residuals</i> — the heartbeat of pulsar timing.
        </div>
        <div className="sk-row sk-gap-20" style={{ marginTop: 18 }}>
          <div className="sk-box" style={{ padding: 16, flex: 1 }}>
            <div className="sk-label">observation × template → Δφ</div>
            <svg width="100%" height="160" viewBox="0 0 460 160" style={{ marginTop: 6 }}>
              <path d="M 10 120 C 90 115, 140 28, 220 28 C 300 28, 340 115, 450 118" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" />
              <path d="M 36 122 C 116 118, 166 38, 246 38 C 326 38, 366 118, 450 120" fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="220" y1="20" x2="246" y2="20" stroke="var(--plot-warm)" strokeWidth="2.5" />
              <text x="206" y="14" fontSize="12" fontFamily="var(--font-hand)" fill="var(--plot-warm)">Δφ</text>
              <text x="20" y="148" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-3)">template (dashed) vs observation</text>
            </svg>
          </div>
          <div className="sk-box" style={{ padding: 16, flex: 1 }}>
            <div className="sk-label">residuals vs MJD</div>
            <Residuals w={440} h={160} />
          </div>
        </div>
      </div>

      {/* ---------- CTA ---------- */}
      <div style={{ padding: "40px 160px 60px", borderTop: "1px solid var(--ink-4)", marginTop: 30 }}>
        <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="sk-accent green">next</span>
            <h2 className="sk-h2" style={{ marginTop: 6 }}>Now try it on a real archive →</h2>
          </div>
          <div className="sk-row sk-gap-10">
            <span className="sk-btn green" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 }}>Open the playground</span>
            <span className="sk-btn ghost" style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 500 }}>Command reference</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingV2, V2_LANDING_W, V2_LANDING_H });
