/* global React, ReactDOM, DesignCanvas, DCSection, DCArtboard,
   LandingV2, V2_LANDING_W, V2_LANDING_H,
   InteractiveV2, V2_IPG_W, V2_IPG_H,
   ReferenceV2, V2_RPG_W, V2_RPG_H */

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="v2"
        title="Refined v2 · the three pages"
        subtitle="Landing (A + pipeline merged in) · Try-it (E with chaining) · Reference (I) — sleeker type, no wavy underlines, real heat-colormap plots"
      >
        <DCArtboard id="v2-landing" label="Landing · visual essay + pipeline" width={V2_LANDING_W} height={V2_LANDING_H}>
          <LandingV2 />
        </DCArtboard>
        <DCArtboard id="v2-play" label="Try it · IDE with pipeline chaining" width={V2_IPG_W} height={V2_IPG_H}>
          <InteractiveV2 />
        </DCArtboard>
        <DCArtboard id="v2-ref" label="Reference · two-pane (list + detail)" width={V2_RPG_W} height={V2_RPG_H}>
          <ReferenceV2 />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
