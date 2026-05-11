/* global React, SiteHeader, Annotate, PulseProfile, DataCube, PhaseFreqPlot, Residuals, TerminalLine, ABTag */

/* ============================================================
   LANDING PAGE — 4 directions
   A · Distill-style visual essay  (single column, inline diagrams)
   B · Sidebar TOC + reading column
   C · Pipeline / horizontal story
   D · Concept-map mosaic
   ============================================================ */

const PAGE_W = 1200;
const PAGE_H = 1700;

/* ---------- A · Visual essay (Distill-inspired) ---------- */
function LandingA() {
  return (
    <div className="sk-page" style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden" }}>
      <ABTag tone="green">A · visual essay  (long-scroll, inline diagrams)</ABTag>
      <SiteHeader active="landing" />

      {/* Hero */}
      <div style={{ padding: "60px 140px 30px" }}>
        <div className="sk-hand" style={{ fontSize: 14, color: "var(--green)", letterSpacing: 2 }}>A VISUAL TUTORIAL</div>
        <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 64, margin: "8px 0 14px", lineHeight: 1.05, fontWeight: 700 }}>
          What is <span style={{ color: "var(--green)" }}>PSRCHIVE</span>, really?
        </h1>
        <div style={{ fontSize: 17, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 760 }}>
          A walk through the pipeline that takes raw, folded pulsar data and turns it into times of arrival
          — explained with diagrams you can poke at.
        </div>
        <div className="sk-row sk-gap-10" style={{ marginTop: 22 }}>
          <span className="sk-btn green">Start ↓</span>
          <span className="sk-btn ghost">Jump to the commands</span>
        </div>
      </div>

      {/* Hero diagram — animated data cube */}
      <div style={{ padding: "10px 140px 40px", position: "relative" }}>
        <div className="sk-box" style={{ padding: 28, display: "flex", gap: 32, alignItems: "center", background: "rgba(255,255,255,.5)" }}>
          <DataCube size={240} animated />
          <div style={{ flex: 1 }}>
            <div className="sk-marker green" style={{ fontSize: 22, marginBottom: 6 }}>The data cube</div>
            <div style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink-2)" }}>
              Every archive is a 4-D block: <b>phase × frequency × time × polarisation</b>.
              Everything PSRCHIVE does is a projection, a slice, or a sum along these axes.
            </div>
            <div className="sk-row sk-gap-8" style={{ marginTop: 12, flexWrap: "wrap" }}>
              <span className="sk-chip green">phase</span>
              <span className="sk-chip green">frequency</span>
              <span className="sk-chip green">time</span>
              <span className="sk-chip green">pol</span>
            </div>
          </div>
        </div>
        <div className="sk-sticky sk-tilt-r" style={{ right: 80, top: 8 }}>drag to rotate the cube ↻</div>
      </div>

      {/* Section: what is a pulsar */}
      <div style={{ padding: "20px 140px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: 34, margin: "0 0 8px", color: "var(--green)" }} className="sk-underline">1 · Pulsars & pulse profiles</h2>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
            A pulsar is a rotating neutron star whose beamed radio emission sweeps past Earth.
            Fold many rotations on its known period and the noise averages down — what's left is
            the <i>pulse profile</i>.
          </div>
          <div className="sk-row sk-gap-6" style={{ marginTop: 10 }}>
            <div className="sk-line long" />
          </div>
          <div className="sk-row sk-gap-6" style={{ marginTop: 6 }}>
            <div className="sk-line med" />
          </div>
        </div>
        <div className="sk-box" style={{ padding: 18 }}>
          <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>fig 1 — folding 10⁴ rotations</div>
          <div style={{ marginTop: 6 }}>
            <PulseProfile w={420} h={120} />
          </div>
          <div className="sk-row sk-gap-8" style={{ marginTop: 6, justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
            <span>0.0</span><span>0.5 (phase)</span><span>1.0</span>
          </div>
          <div className="sk-row" style={{ marginTop: 10, justifyContent: "space-between", alignItems: "center" }}>
            <span className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>N rotations →</span>
            <div className="sk-row sk-gap-4">
              <span className="sk-chip">1</span>
              <span className="sk-chip">100</span>
              <span className="sk-chip green fill">10 000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section: scrunching */}
      <div style={{ padding: "40px 140px" }}>
        <h2 style={{ fontFamily: "var(--font-hand)", fontSize: 34, margin: "0 0 8px", color: "var(--green)" }} className="sk-underline">2 · Scrunching — averaging axes away</h2>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 780 }}>
          <b>tscrunch</b>, <b>fscrunch</b>, <b>bscrunch</b>: collapse the time, frequency, or phase axis by
          summing groups together. Trades resolution for signal-to-noise.
        </div>
        <div className="sk-row sk-gap-16" style={{ marginTop: 18 }}>
          {[
            { lbl: "before", cube: 240, hand: "8 freq × 32 time" },
            { lbl: "fscrunch 2", cube: 200, hand: "4 freq × 32 time" },
            { lbl: "tscrunch all", cube: 160, hand: "4 freq × 1 time" },
          ].map((s, i) => (
            <div key={i} className="sk-box" style={{ padding: 14, flex: 1, textAlign: "center" }}>
              <div className="sk-marker green" style={{ fontSize: 18 }}>{s.lbl}</div>
              <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}><DataCube size={s.cube} /></div>
              <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>{s.hand}</div>
              <div className="sk-code" style={{ marginTop: 8, textAlign: "left" }}>
                <span className="prompt">$</span> pam -<span className="flag">{i === 0 ? "" : i === 1 ? "F" : "T"}</span> file.ar
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section: RFI */}
      <div style={{ padding: "40px 140px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 36 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: 34, margin: "0 0 8px", color: "var(--green)" }} className="sk-underline">3 · Zapping RFI</h2>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
            Radio frequency interference — satellites, microwaves, that one bored undergrad — corrupts
            channels and sub-integrations. <b>paz</b>, <b>clfd</b>, or a careful manual zap mark them as bad.
            Compare the two heatmaps to see the difference.
          </div>
          <div className="sk-row sk-gap-8" style={{ marginTop: 14 }}>
            <span className="sk-chip">paz</span>
            <span className="sk-chip">clfd</span>
            <span className="sk-chip">psrzap (manual)</span>
          </div>
        </div>
        <div className="sk-row sk-gap-10">
          <div className="sk-box" style={{ padding: 6, flex: 1 }}>
            <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", margin: "2px 0 4px" }}>before</div>
            <PhaseFreqPlot w={260} h={200} cleaned={false} />
          </div>
          <div className="sk-box green" style={{ padding: 6, flex: 1 }}>
            <div className="sk-hand" style={{ fontSize: 12, color: "var(--green)", textAlign: "center", margin: "2px 0 4px" }}>after  ✓</div>
            <PhaseFreqPlot w={260} h={200} cleaned={true} />
          </div>
        </div>
      </div>

      {/* Section: template */}
      <div style={{ padding: "40px 140px", display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 36, alignItems: "center" }}>
        <div className="sk-box" style={{ padding: 20 }}>
          <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>building a standard profile</div>
          <svg width="100%" height="160" viewBox="0 0 400 160">
            {[0, 1, 2, 3].map(i => (
              <path key={i}
                d={`M 0 ${140 - i * 2} C 80 ${130 - i * 2}, 120 ${20 + i * 8}, 170 ${20 + i * 8} C 220 ${20 + i * 8}, 260 ${130 - i * 2}, 400 ${135 - i * 2}`}
                fill="none" stroke="var(--ink-4)" strokeWidth="1" opacity={0.4} />
            ))}
            <path d="M 0 140 C 80 130, 120 20, 170 20 C 220 20, 260 130, 400 135" fill="none" stroke="var(--green)" strokeWidth="2.2" />
            <text x="180" y="14" fontSize="12" fontFamily="var(--font-hand)" fill="var(--green)">smoothed template</text>
          </svg>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-hand)", fontSize: 34, margin: "0 0 8px", color: "var(--green)" }} className="sk-underline">4 · Standard profile (template)</h2>
          <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>
            Fit gaussian components to a high-S/N observation with <b>paas</b>, or smooth wavelet-style with <b>psrsmooth</b>.
            This becomes the noise-free yardstick we cross-correlate every observation against.
          </div>
        </div>
      </div>

      {/* Section: TOAs + residuals */}
      <div style={{ padding: "40px 140px" }}>
        <h2 style={{ fontFamily: "var(--font-hand)", fontSize: 34, margin: "0 0 8px", color: "var(--green)" }} className="sk-underline">5 · TOAs & timing residuals</h2>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)", maxWidth: 780 }}>
          Cross-correlate observation × template with <b>pat</b>. The phase shift gives a time-of-arrival.
          Many TOAs, fit against a timing model, become <i>residuals</i> — the heartbeat of pulsar timing.
        </div>
        <div className="sk-row sk-gap-16" style={{ marginTop: 16 }}>
          <div className="sk-box" style={{ padding: 14, flex: 1 }}>
            <div className="sk-marker green" style={{ fontSize: 16 }}>obs × template → TOA</div>
            <svg width="100%" height="120" viewBox="0 0 400 120">
              <path d="M 10 90 C 80 85, 120 20, 180 20 C 240 20, 280 85, 390 88" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" />
              <path d="M 30 92 C 100 88, 140 30, 200 30 C 260 30, 300 88, 390 90" fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="3 2" />
              <line x1="180" y1="20" x2="200" y2="20" stroke="var(--plot-warm)" strokeWidth="2" />
              <text x="170" y="14" fontSize="12" fontFamily="var(--font-hand)" fill="var(--plot-warm)">Δφ</text>
            </svg>
          </div>
          <div className="sk-box" style={{ padding: 14, flex: 1 }}>
            <div className="sk-marker green" style={{ fontSize: 16 }}>residuals vs time</div>
            <Residuals w={360} h={140} />
          </div>
        </div>
      </div>

      {/* Footer / CTA */}
      <div style={{ padding: "40px 140px 0", borderTop: "1.5px dashed var(--ink-4)" }}>
        <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div className="sk-marker" style={{ fontSize: 22, color: "var(--green)" }}>Try it yourself →</div>
          <div className="sk-row sk-gap-10">
            <span className="sk-btn green">Open the playground</span>
            <span className="sk-btn ghost">Command reference</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- B · Sidebar TOC docs-style ---------- */
function LandingB() {
  const toc = [
    "What's a pulsar?",
    "The data cube",
    "Folding & integration",
    "Dedispersion",
    "Scrunching",
    "RFI zapping",
    "Calibration (pac)",
    "Rotation measure",
    "Template (paas, psrsmooth)",
    "TOAs (pat)",
    "Residuals",
  ];
  return (
    <div className="sk-page" style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden" }}>
      <ABTag tone="green">B · sidebar TOC  (scroll-anchored, more reference-like)</ABTag>
      <SiteHeader active="landing" />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", height: PAGE_H - 70 }}>
        {/* Sidebar */}
        <div style={{ borderRight: "1.5px dashed var(--ink-4)", padding: "30px 22px", background: "rgba(255,255,255,.35)" }}>
          <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)", letterSpacing: 1.4 }}>ON THIS PAGE</div>
          <div className="sk-col sk-gap-4" style={{ marginTop: 12 }}>
            {toc.map((t, i) => (
              <div key={i} className="sk-row" style={{ alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 4, background: i === 1 ? "var(--green-mute)" : "transparent" }}>
                <span style={{ width: 4, height: 4, borderRadius: 4, background: i === 1 ? "var(--green)" : "var(--ink-4)" }} />
                <span style={{ fontFamily: "var(--font-hand)", fontSize: 17, color: i === 1 ? "var(--green)" : "var(--ink-2)", fontWeight: i === 1 ? 700 : 400 }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 28 }}>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)", letterSpacing: 1.4 }}>JUMP TO</div>
            <div className="sk-col sk-gap-6" style={{ marginTop: 8 }}>
              <span className="sk-btn green">Playground →</span>
              <span className="sk-btn ghost">Reference →</span>
            </div>
          </div>
        </div>

        {/* Main reading column */}
        <div style={{ padding: "30px 80px", overflow: "hidden" }}>
          <div className="sk-hand" style={{ fontSize: 13, color: "var(--green)", letterSpacing: 2 }}>SECTION 02</div>
          <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 52, margin: "4px 0 18px", color: "var(--ink)", lineHeight: 1 }}>
            The data cube
          </h1>
          <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-2)", maxWidth: 680 }}>
            A PSRCHIVE archive is a four-dimensional block of numbers — phase, frequency, time, polarisation —
            and almost every command you'll run is, underneath, a projection, slice or sum along one of these axes.
          </div>

          <div className="sk-row sk-gap-20" style={{ marginTop: 24, alignItems: "center" }}>
            <DataCube size={260} animated />
            <div className="sk-col sk-gap-8">
              <div className="sk-chip green fill">phase  (pulse rotation)</div>
              <div className="sk-chip green">frequency  (radio channel)</div>
              <div className="sk-chip green">time  (sub-integration)</div>
              <div className="sk-chip green">polarisation  (I, Q, U, V)</div>
            </div>
          </div>

          <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 22, maxWidth: 680 }}>
            <p>Different plotting and processing commands collapse different axes. <b>psrplot -p flux</b> sums
            frequency and time to leave a 1-D profile; <b>-p freq</b> sums time to leave a 2-D phase×freq map
            like the one below.</p>
          </div>

          <div className="sk-box" style={{ padding: 8, marginTop: 14, maxWidth: 540 }}>
            <PhaseFreqPlot w={520} h={220} cleaned={true} />
            <div className="sk-row" style={{ justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-hand)" }}>
              <span>fig 2 — collapse the time axis →</span>
              <span>psrplot -p freq file.ar</span>
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>NEXT</div>
            <div className="sk-row sk-gap-10" style={{ marginTop: 6 }}>
              <span className="sk-btn ghost">← What's a pulsar?</span>
              <span className="sk-btn green">Folding & integration →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- C · Horizontal pipeline story ---------- */
function LandingC() {
  const steps = [
    { n: "01", t: "Raw archive", d: "telescope voltages folded on a known period →", icon: "📡" },
    { n: "02", t: "Dedisperse", d: "remove frequency-dependent delay" },
    { n: "03", t: "Zap RFI", d: "paz / clfd / manual" },
    { n: "04", t: "Calibrate pol", d: "pac with a noise diode" },
    { n: "05", t: "Scrunch", d: "tscrunch / fscrunch / bscrunch" },
    { n: "06", t: "Make template", d: "paas, psrsmooth" },
    { n: "07", t: "TOAs", d: "pat against template" },
    { n: "08", t: "Residuals", d: "feed into tempo2 / pint" },
  ];
  return (
    <div className="sk-page" style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden" }}>
      <ABTag tone="green">C · pipeline story  (horizontal flow, every node is a chapter)</ABTag>
      <SiteHeader active="landing" />
      <div style={{ padding: "50px 60px 20px" }}>
        <div className="sk-hand" style={{ fontSize: 14, color: "var(--green)", letterSpacing: 2 }}>FOLLOW THE BITS</div>
        <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 60, margin: "6px 0 8px", lineHeight: 1 }}>
          From <span style={{ color: "var(--green)" }}>photons</span> to <span style={{ color: "var(--green)" }}>residuals</span>
        </h1>
        <div style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 760 }}>
          Click any node to expand. Scrub the slider to play the whole pipeline as a story.
        </div>
      </div>

      {/* The pipeline itself */}
      <div style={{ padding: "10px 60px", position: "relative" }}>
        {/* connecting line */}
        <svg width="100%" height="40" viewBox="0 0 1080 40" style={{ position: "absolute", left: 60, right: 60, top: 70 }}>
          <path d="M 20 20 Q 540 -30 1060 20" fill="none" stroke="var(--green)" strokeWidth="2" strokeDasharray="4 4" />
        </svg>
        <div className="sk-row" style={{ gap: 4, alignItems: "flex-start", overflow: "hidden" }}>
          {steps.map((s, i) => (
            <div key={i} className="sk-col" style={{ flex: 1, alignItems: "center", textAlign: "center", padding: "10px 4px", position: "relative" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%",
                border: "1.8px solid var(--green)",
                background: i === 2 ? "var(--green)" : "var(--paper)",
                color: i === 2 ? "var(--paper)" : "var(--green)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-hand)", fontSize: 18, fontWeight: 700,
              }}>{s.n}</div>
              <div className="sk-marker" style={{ fontSize: 17, marginTop: 8 }}>{s.t}</div>
              <div className="sk-hand" style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.2, maxWidth: 110 }}>{s.d}</div>
            </div>
          ))}
        </div>
        {/* scrubber */}
        <div className="sk-row" style={{ marginTop: 24, alignItems: "center", gap: 14 }}>
          <span className="sk-btn green">▶ play</span>
          <div style={{ flex: 1, height: 4, background: "var(--ink-4)", borderRadius: 4, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "32%", background: "var(--green)", borderRadius: 4 }} />
            <div style={{ position: "absolute", left: "32%", top: -6, width: 14, height: 14, borderRadius: 14, background: "var(--green)", border: "2px solid var(--paper)" }} />
          </div>
          <div className="sk-hand" style={{ fontSize: 14, color: "var(--ink-3)" }}>step 3 of 8</div>
        </div>
      </div>

      {/* Expanded current step */}
      <div style={{ padding: "30px 60px" }}>
        <div className="sk-box green" style={{ padding: 0, overflow: "hidden", background: "rgba(255,255,255,.6)" }}>
          <div className="sk-row" style={{ borderBottom: "1.5px solid var(--green)", padding: "10px 18px", background: "var(--green)", color: "var(--paper)", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 18 }}>STEP 03</span>
            <span style={{ fontFamily: "var(--font-hand)", fontSize: 26 }}>Zap the RFI</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12 }}>paz · clfd · psrzap</span>
          </div>
          <div className="sk-row" style={{ padding: 24, gap: 28 }}>
            <div style={{ flex: 1.2 }}>
              <div style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-2)" }}>
                The dynamic spectrum shows bad channels as horizontal stripes and bad sub-integrations as
                vertical streaks. Mark them as zero-weight so they don't contaminate the average.
              </div>
              <div className="sk-row sk-gap-10" style={{ marginTop: 14 }}>
                <div className="sk-box" style={{ padding: 6 }}>
                  <div className="sk-hand" style={{ fontSize: 11, color: "var(--ink-3)", textAlign: "center" }}>before</div>
                  <PhaseFreqPlot w={200} h={140} cleaned={false} />
                </div>
                <div className="sk-box green" style={{ padding: 6 }}>
                  <div className="sk-hand" style={{ fontSize: 11, color: "var(--green)", textAlign: "center" }}>after</div>
                  <PhaseFreqPlot w={200} h={140} cleaned={true} />
                </div>
              </div>
            </div>
            <div className="sk-col sk-gap-8" style={{ flex: 1 }}>
              <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)" }}>TRY IT</div>
              <TerminalLine>paz -r -e zap file.ar</TerminalLine>
              <TerminalLine>clfd --processes 4 file.ar</TerminalLine>
              <div className="sk-row sk-gap-8" style={{ marginTop: 8 }}>
                <span className="sk-btn green">Open in playground →</span>
                <span className="sk-btn ghost">Read flags</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- D · Concept-map mosaic ---------- */
function LandingD() {
  const tiles = [
    { t: "Pulsars 101", k: "intro", d: "rotating neutron stars, beamed emission" },
    { t: "Data cube", k: "core", d: "phase × freq × time × pol", featured: true },
    { t: "Folding", k: "core", d: "noise → profile" },
    { t: "Dedispersion", k: "step", d: "remove ν⁻² delay" },
    { t: "Scrunching", k: "step", d: "tscrunch / fscrunch / bscrunch" },
    { t: "RFI zap", k: "step", d: "paz · clfd · manual" },
    { t: "Pol calibration", k: "step", d: "pac with noise diode" },
    { t: "Rotation measure", k: "step", d: "RM fitting" },
    { t: "Template", k: "build", d: "paas · psrsmooth" },
    { t: "TOA generation", k: "build", d: "pat against template" },
    { t: "Residuals", k: "out", d: "tempo2 / pint feed" },
    { t: "File formats", k: "ref", d: "PSRFITS internals" },
  ];
  const tone = {
    intro: "var(--paper-2)",
    core: "var(--green-mute)",
    step: "var(--paper)",
    build: "var(--paper)",
    out: "var(--green-mute)",
    ref: "var(--paper-2)",
  };
  return (
    <div className="sk-page" style={{ width: PAGE_W, height: PAGE_H, overflow: "hidden" }}>
      <ABTag tone="green">D · concept map  (mosaic of tiles, click to read)</ABTag>
      <SiteHeader active="landing" />
      <div style={{ padding: "44px 80px 20px" }}>
        <div className="sk-hand" style={{ fontSize: 14, color: "var(--green)", letterSpacing: 2 }}>PICK YOUR ENTRY POINT</div>
        <h1 style={{ fontFamily: "var(--font-hand)", fontSize: 56, margin: "6px 0 6px", lineHeight: 1 }}>
          Everything in <span style={{ color: "var(--green)" }}>PSRCHIVE</span>, on one wall.
        </h1>
        <div style={{ fontSize: 16, color: "var(--ink-2)", maxWidth: 720 }}>
          Each tile opens an animated explainer. Linked tiles share a colour. Start anywhere.
        </div>
      </div>
      {/* Mosaic */}
      <div style={{
        padding: "10px 80px 40px",
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gridAutoRows: "180px",
        gap: 12,
      }}>
        {tiles.map((tile, i) => {
          const big = tile.featured;
          const span = big ? { gridColumn: "span 2", gridRow: "span 2" } : {};
          return (
            <div key={i} className="sk-box" style={{
              ...span,
              padding: 14, background: tone[tile.k],
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              borderColor: big ? "var(--green)" : "var(--ink-2)",
              borderWidth: big ? 2 : 1.5,
            }}>
              <div className="sk-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className={"sk-marker" + (big ? " green" : "")} style={{ fontSize: big ? 26 : 18 }}>{tile.t}</div>
                <span className="sk-badge ghost">{tile.k}</span>
              </div>
              {big && (
                <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
                  <DataCube size={200} animated />
                </div>
              )}
              <div className="sk-hand" style={{ fontSize: 13, color: "var(--ink-3)", lineHeight: 1.3 }}>{tile.d}</div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "0 80px" }}>
        <div className="sk-hand" style={{ fontSize: 14, color: "var(--ink-3)" }}>colour key →</div>
        <div className="sk-row sk-gap-10" style={{ marginTop: 6, flexWrap: "wrap" }}>
          <span className="sk-chip" style={{ background: "var(--green-mute)" }}>core ideas</span>
          <span className="sk-chip">pipeline step</span>
          <span className="sk-chip" style={{ background: "var(--paper-2)" }}>reference</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LandingA, LandingB, LandingC, LandingD, LANDING_W: PAGE_W, LANDING_H: PAGE_H });
