/* global React, ReactDOM,
   DesignCanvas, DCSection, DCArtboard,
   LandingA, LandingB, LandingC, LandingD, LANDING_W, LANDING_H,
   InteractiveE, InteractiveF, InteractiveG, IPG_W, IPG_H,
   ReferenceH, ReferenceI, RPG_W, RPG_H */

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="landing"
        title="Tutorial · landing page"
        subtitle="Visual essay that explains the PSRCHIVE pipeline — 4 structural directions, mid-fi"
      >
        <DCArtboard id="landing-a" label="A · Visual essay (Distill-style)" width={LANDING_W} height={LANDING_H}>
          <LandingA />
        </DCArtboard>
        <DCArtboard id="landing-b" label="B · Sidebar TOC + reading column" width={LANDING_W} height={LANDING_H}>
          <LandingB />
        </DCArtboard>
        <DCArtboard id="landing-c" label="C · Horizontal pipeline story" width={LANDING_W} height={LANDING_H}>
          <LandingC />
        </DCArtboard>
        <DCArtboard id="landing-d" label="D · Concept-map mosaic" width={LANDING_W} height={LANDING_H}>
          <LandingD />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="play"
        title="Try it · interactive playground"
        subtitle="VSCode-feel; precomputed plots + a gallery of commands the user can browse and remix"
      >
        <DCArtboard id="play-e" label="E · VSCode-style IDE (recommended)" width={IPG_W} height={IPG_H}>
          <InteractiveE />
        </DCArtboard>
        <DCArtboard id="play-f" label="F · Stacked terminal + plot + gallery" width={IPG_W} height={IPG_H}>
          <InteractiveF />
        </DCArtboard>
        <DCArtboard id="play-g" label="G · Pipeline chainer (psradd → pam → psrplot)" width={IPG_W} height={IPG_H}>
          <InteractiveG />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="ref"
        title="Reference · command cards"
        subtitle="Searchable, one card per PSRCHIVE command — mirror of the upstream docs, restyled"
      >
        <DCArtboard id="ref-h" label="H · Searchable card grid" width={RPG_W} height={RPG_H}>
          <ReferenceH />
        </DCArtboard>
        <DCArtboard id="ref-i" label="I · Two-pane (list + detail)" width={RPG_W} height={RPG_H}>
          <ReferenceI />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
