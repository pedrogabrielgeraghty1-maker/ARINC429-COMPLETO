const DATA_SCALE = 100;
const DATA_MIN = -(2 ** 18);
const DATA_MAX = (2 ** 18) - 1;

// Etiquetas octales de demostracion: sustituyalas por las asignadas al sistema.
const INSTRUMENTS = Object.freeze({
  altitud: { label: 0o203 },
  velocidad: { label: 0o210 },
  temperatura: { label: 0o214 },
  presion: { label: 0o220 }
});

function reverseByte(value) {
  let reversed = 0;
  for (let bit = 0; bit < 8; bit += 1) {
    reversed = (reversed << 1) | ((value >> bit) & 1);
  }
  return reversed;
}

function generateArinc429(value, label, sdi = 0) {
  if (!Number.isFinite(value)) {
    throw new TypeError('El valor del envio debe ser un numero finito.');
  }
  if (!Number.isInteger(label) || label < 0 || label > 0o377) {
    throw new RangeError('La etiqueta debe estar entre 000 y 377 octal.');
  }
  if (!Number.isInteger(sdi) || sdi < 0 || sdi > 3) {
    throw new RangeError('El SDI debe estar entre 0 y 3.');
  }

  const scaledValue = Math.round(value * DATA_SCALE);
  if (scaledValue < DATA_MIN || scaledValue > DATA_MAX) {
    throw new RangeError(`El valor debe estar entre ${DATA_MIN / DATA_SCALE} y ${DATA_MAX / DATA_SCALE}.`);
  }

  // Bits 11-29: dato BNR en complemento a dos, con resolucion de 0.01.
  const data = scaledValue & 0x7ffff;
  let word = reverseByte(label) | (sdi << 8) | (data << 10);
  // SSM 00 representa dato normal positivo; 11 representa dato negativo.
  if (scaledValue < 0) {
    word |= 0b11 << 29;
  }

  // El bit 32 completa paridad impar sobre la palabra de 32 bits.
  let ones = 0;
  for (let bit = 0; bit < 31; bit += 1) {
    ones += (word >>> bit) & 1;
  }
  if (ones % 2 === 0) {
    word = (word | 0x80000000) >>> 0;
  }

  return word.toString(2).padStart(32, '0');
}

function createArincCode(instrumento, value) {
  const config = INSTRUMENTS[instrumento];
  if (!config) {
    throw new RangeError('Instrumento no soportado.');
  }
  return generateArinc429(value, config.label);
}

module.exports = {
  DATA_SCALE,
  INSTRUMENTS,
  createArincCode,
  generateArinc429
};
