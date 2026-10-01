/**
 * @file app.js
 * Controlador principal de UTP Energy. Conecta la interfaz con el motor
 * físico (physics-engine.js) y con la capa visual (animations.js).
 *
 * Dependencias: el orden de carga en index.html debe ser physics-engine.js,
 * animations.js y app.js, ya que este último consume los objetos globales
 * `physicsEngine` y `visualEngine`.
 */

/* ==========================================
   REFERENCIAS AL DOM
   ========================================== */
const inputMass = document.getElementById("mass");
const inputVelocity = document.getElementById("velocity");
const inputCapacitance = document.getElementById("capacitance");
const inputResistance = document.getElementById("resistance");

const valMass = document.getElementById("massValue");
const valVelocity = document.getElementById("velocityValue");
const valCapacitance = document.getElementById("capacitanceValue");
const valResistance = document.getElementById("resistanceValue");

const outEnergy = document.getElementById("outputEnergy");
const outLosses = document.getElementById("outputLosses");
const outTau = document.getElementById("outputTau");

const btnSimulate = document.getElementById("btnSimulate");

/* ==========================================
   ESTADO
   ========================================== */

// Impide reentradas mientras la animación está en curso.
let isSimulating = false;

/* ==========================================
   FUNCIONES
   ========================================== */

/**
 * Sincroniza las etiquetas numéricas con el valor actual de cada slider.
 * Se enlaza al evento `input`, que se emite de forma continua durante el
 * arrastre, a diferencia de `change`, que solo lo hace al soltar el control.
 */
function updateSliderLabels() {
  valMass.textContent = `${inputMass.value} kg`;
  valVelocity.textContent = `${inputVelocity.value} m/s`;
  valCapacitance.textContent = `${inputCapacitance.value} F`;
  valResistance.textContent = `${inputResistance.value} Ω`;
}

/**
 * Transfiere los valores de los sliders al motor físico y actualiza las
 * tarjetas de métricas. Es el único punto donde se sincroniza `physicsState`,
 * por lo que debe ejecutarse antes de cualquier cálculo.
 * La energía se muestra en kJ para mantener cifras legibles, ya que los
 * valores en julios alcanzan el orden de 10⁵–10⁶.
 */
function printMetrics() {
  physicsEngine.updateState(
    inputMass.value,
    inputVelocity.value,
    inputCapacitance.value,
    inputResistance.value,
  );

  const energy = physicsEngine.getStoredEnergy();
  const losses = physicsEngine.getJouleLosses();
  const tau = physicsEngine.getTau();

  outEnergy.textContent = `${(energy / 1000).toFixed(2)} kJ`;
  outLosses.textContent = `${(losses / 1000).toFixed(2)} kJ`;
  outTau.textContent = `${tau.toFixed(2)} s`;
}

/**
 * Orquesta una simulación completa: métricas, curva de carga y animación.
 * El orden es relevante: `printMetrics` debe ejecutarse primero porque
 * actualiza el estado del que dependen los cálculos posteriores.
 */
function runSimulation() {
  if (isSimulating) return;
  isSimulating = true;

  printMetrics();

  const curveData = physicsEngine.generateChargeCurve();
  visualEngine.renderChart(curveData.timeData, curveData.voltageData);

  visualEngine.playSimulations();

  console.log(
    "Simulación ejecutada con éxito. Tau (s):",
    physicsEngine.getTau(),
  );

  // El tiempo de bloqueo replica la duración de la animación GSAP (2 s);
  // ambos valores deben modificarse de forma conjunta.
  setTimeout(() => {
    isSimulating = false;
  }, 2000);
}

/* ==========================================
   EVENT LISTENERS
   ========================================== */
inputMass.addEventListener("input", updateSliderLabels);
inputVelocity.addEventListener("input", updateSliderLabels);
inputCapacitance.addEventListener("input", updateSliderLabels);
inputResistance.addEventListener("input", updateSliderLabels);

btnSimulate.addEventListener("click", runSimulation);

document.addEventListener("DOMContentLoaded", () => {
  updateSliderLabels();
  runSimulation();
});
