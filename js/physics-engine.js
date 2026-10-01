/**
 * @file physics-engine.js
 * Modelo físico del sistema de frenado regenerativo con almacenamiento capacitivo.
 *
 * Módulo de cálculo puro: no accede al DOM ni emite eventos. La lectura de la
 * interfaz y la reacción a eventos son responsabilidad de app.js.
 */

/* ==========================================
   ESTADO
   ========================================== */

/**
 * Parámetros de entrada del modelo, en unidades del SI.
 * Se actualiza exclusivamente mediante `physicsEngine.updateState`.
 */
const physicsState = {
  mass: 1200, // kg
  velocity: 25, // m/s
  capacitance: 50, // F
  resistance: 2.5, // Ω
};

/* ==========================================
   MOTOR DE CÁLCULO
   ========================================== */
const physicsEngine = {
  /**
   * Sincroniza el estado interno con los valores de los controles.
   * Los inputs de tipo range entregan cadenas, por lo que se convierten
   * explícitamente a número para evitar concatenaciones o comparaciones léxicas.
   * @param {string|number} m Masa (kg).
   * @param {string|number} v Velocidad inicial (m/s).
   * @param {string|number} c Capacitancia (F).
   * @param {string|number} r Resistencia (Ω).
   */
  updateState: (m, v, c, r) => {
    physicsState.mass = Number(m);
    physicsState.velocity = Number(v);
    physicsState.capacitance = Number(c);
    physicsState.resistance = Number(r);
  },

  /**
   * Energía cinética inicial del vehículo: E_k = ½·m·v².
   * @returns {number} Energía en julios (J).
   */
  getKineticEnergy: () => {
    return 0.5 * physicsState.mass * Math.pow(physicsState.velocity, 2);
  },

  /**
   * Constante de tiempo del circuito RC: τ = R·C.
   * Representa el tiempo en que el capacitor alcanza ≈63.2 % de su valor final.
   * @returns {number} Tiempo en segundos (s).
   */
  getTau: () => {
    return physicsState.resistance * physicsState.capacitance;
  },

  /**
   * Voltaje final del capacitor, obtenido al despejar V de U = ½·C·V²
   * e igualar U a la energía cinética disponible (V = √(2·E_k / C)).
   * Supone una transferencia ideal de energía, sin pérdidas en la conversión.
   * @returns {number} Voltaje en voltios (V).
   */
  getInitialVoltage: () => {
    const kinetic = physicsEngine.getKineticEnergy();
    return Math.sqrt((2 * kinetic) / physicsState.capacitance);
  },

  /**
   * Energía almacenada en el capacitor: U = ½·C·V².
   *
   * NOTA: como V se deriva de E_k (ver `getInitialVoltage`), el resultado
   * coincide con E_k salvo error de punto flotante. El modelo actual no
   * contempla ninguna fuente de pérdida entre ambas magnitudes.
   * @returns {number} Energía en julios (J).
   */
  getStoredEnergy: () => {
    const voltage = physicsEngine.getInitialVoltage();
    return 0.5 * physicsState.capacitance * Math.pow(voltage, 2);
  },

  /**
   * Energía disipada por efecto Joule, calculada como la diferencia entre la
   * energía cinética y la almacenada. `Math.max` descarta valores negativos
   * originados por redondeo en coma flotante.
   *
   * NOTA: con el modelo vigente (ver `getStoredEnergy`) este valor es
   * prácticamente nulo para cualquier combinación de parámetros.
   * @returns {number} Energía en julios (J).
   */
  getJouleLosses: () => {
    const kinetic = physicsEngine.getKineticEnergy();
    const stored = physicsEngine.getStoredEnergy();
    return Math.max(0, kinetic - stored);
  },

  /**
   * Muestrea la curva de carga V(t) = V_max·(1 − e^(−t/τ)).
   * El intervalo cubre [0, 5τ]; en 5τ el voltaje alcanza ≈99.3 % de V_max,
   * por lo que el transitorio queda prácticamente completo en la gráfica.
   * Complejidad temporal y espacial: O(points).
   * @param {number} [points=50] Número de intervalos; se generan points + 1 muestras.
   * @returns {{timeData: string[], voltageData: string[]}} Series en segundos y
   *   voltios, formateadas a 2 decimales (cadenas, tal como las consume Chart.js).
   */
  generateChargeCurve: (points = 50) => {
    const tau = physicsEngine.getTau();
    const maxTime = tau * 5;
    const dt = maxTime / points;
    const voltageMax = physicsEngine.getInitialVoltage();

    const timeData = [];
    const voltageData = [];

    for (let i = 0; i <= points; i++) {
      let t = i * dt;
      let v_t = voltageMax * (1 - Math.exp(-t / tau));

      timeData.push(t.toFixed(2));
      voltageData.push(v_t.toFixed(2));
    }

    return { timeData, voltageData };
  },
};
