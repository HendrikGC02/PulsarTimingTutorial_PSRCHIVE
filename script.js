const scenarios = {
  "Y_I_0": {
    image: "assets/precomputed/psrplot_pY_jI_N0.svg",
    caption: "Scenario: pulse profile, total intensity, no normalization."
  },
  "Y_I_1": {
    image: "assets/precomputed/psrplot_pY_jI_N1.svg",
    caption: "Scenario: pulse profile, total intensity, normalization enabled."
  },
  "S_I_0": {
    image: "assets/precomputed/psrplot_pS_jI_N0.svg",
    caption: "Scenario: phase vs frequency plot, total intensity, no normalization."
  },
  "S_S_1": {
    image: "assets/precomputed/psrplot_pS_jS_N1.svg",
    caption: "Scenario: phase vs frequency plot, Stokes polarization, normalization enabled."
  }
};

const form = document.getElementById("scenario-form");
const commandEl = document.getElementById("command");
const imageEl = document.getElementById("output-image");
const captionEl = document.getElementById("output-caption");

function updateScenario() {
  const plot = document.getElementById("plot").value;
  const pol = document.getElementById("pol").value;
  const norm = document.getElementById("norm").value;

  const key = `${plot}_${pol}_${norm}`;
  const fallback = scenarios["Y_I_0"];
  const scenario = scenarios[key] || fallback;

  commandEl.textContent = `psrplot -p ${plot} -j ${pol} -N ${norm} example.ar`;
  imageEl.src = scenario.image;
  captionEl.textContent = scenario.caption;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  updateScenario();
});
