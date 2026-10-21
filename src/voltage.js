const VOLTS_PER_UNIT = 0.01;
const MAX_SIMULATED_VOLTAGE = 10;

function calculateVoltage(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError('El valor para calcular la tension debe ser finito.');
  }

  const voltage = value * VOLTS_PER_UNIT;
  return Number(Math.max(-MAX_SIMULATED_VOLTAGE, Math.min(MAX_SIMULATED_VOLTAGE, voltage)).toFixed(3));
}

module.exports = { calculateVoltage };
