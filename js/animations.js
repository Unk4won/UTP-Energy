/**
 * @file animations.js
 * Capa de presentación de UTP Energy: curva de carga con Chart.js y
 * animación del vehículo y del capacitor con GSAP.
 *
 * Requiere las bibliotecas globales Chart y gsap (cargadas con `defer` antes
 * que este script). No contiene lógica física: solo representa datos ya calculados.
 */

const canvasContext = document
  .getElementById("chargeCurveChart")
  .getContext("2d");
const elVehicle = document.getElementById("vehicle");
const elChargeLevel = document.getElementById("chargeLevel");

// Referencias vivas a las instancias activas, necesarias para liberarlas
// antes de cada nueva simulación.
let chargeChart = null;
let gsapTimeline = null;

const visualEngine = {
  /**
   * Dibuja la curva V(t) del capacitor.
   *
   * Chart.js asocia cada instancia a un único <canvas>; crear una segunda sobre
   * el mismo elemento lanza un error. Por ello se destruye la instancia previa
   * (también libera sus listeners y el observador de redimensionado).
   *
   * Los colores se declaran como literales porque el contexto de <canvas> no
   * resuelve variables CSS. Deben mantenerse sincronizados con los tokens de
   * `:root` en style.css.
   * @param {string[]} timeData Etiquetas del eje X (s).
   * @param {string[]} voltageData Valores del eje Y (V).
   */
  renderChart: (timeData, voltageData) => {
    if (chargeChart) chargeChart.destroy();

    chargeChart = new Chart(canvasContext, {
      type: "line",
      data: {
        labels: timeData,
        datasets: [
          {
            label: "Voltaje en el Capacitor V(t)",
            data: voltageData,
            borderColor: "#cc0000",
            backgroundColor: "rgba(204, 0, 0, 0.1)",
            borderWidth: 2,
            fill: true,
            pointRadius: 0,
            tension: 0.4,
          },
        ],
      },
      options: {
        // Con maintainAspectRatio desactivado, el canvas ocupa la altura de
        // .chart-container en lugar de conservar una proporción fija.
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: "Tiempo (s)", color: "#d9d9d9" },
            ticks: { color: "#707070" },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
          },
          y: {
            title: { display: true, text: "Voltaje (V)", color: "#d9d9d9" },
            ticks: { color: "#707070" },
            grid: { color: "rgba(255, 255, 255, 0.05)" },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
              font: { family: "'Poppins', sans-serif" },
            },
          },
        },
      },
    });
  },

  /**
   * Reproduce la animación de frenado y carga.
   *
   * Se invoca `kill()` sobre la línea de tiempo previa para evitar que dos
   * animaciones compitan por las mismas propiedades si el usuario relanza la
   * simulación. Ambos tweens parten en la posición 0 con igual duración y
   * easing, de modo que la carga del capacitor avanza sincronizada con la
   * desaceleración del vehículo.
   *
   * El desplazamiento de 400 px es un valor puramente visual; no se deriva del
   * modelo físico. La duración (2 s) está acoplada al temporizador de
   * desbloqueo de `runSimulation` en app.js.
   */
  playSimulations: () => {
    if (gsapTimeline) gsapTimeline.kill();

    gsap.set(elVehicle, { x: 0 });
    gsap.set(elChargeLevel, {
      height: "0%",
      backgroundColor: "var(--color-rojo-oscuro)",
    });

    gsapTimeline = gsap.timeline();

    // `power3.out` produce una desaceleración progresiva coherente con un frenado.
    gsapTimeline.to(
      elVehicle,
      {
        x: 400,
        duration: 2,
        ease: "power3.out",
      },
      0,
    );

    gsapTimeline.to(
      elChargeLevel,
      {
        height: "100%",
        backgroundColor: "#ff3333",
        duration: 2,
        ease: "power3.out",
      },
      0,
    );
  },
};
