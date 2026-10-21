const test = require('node:test');
const assert = require('node:assert/strict');
const { createArincCode, generateArinc429 } = require('../src/arinc429');
const { calculateVoltage } = require('../src/voltage');

test('genera una palabra ARINC de 32 bits con paridad impar', () => {
  const code = createArincCode('altitud', 123.45);
  assert.match(code, /^[01]{32}$/);
  assert.equal([...code].filter((bit) => bit === '1').length % 2, 1);
});

test('codifica valores negativos y conserva paridad impar', () => {
  const code = createArincCode('temperatura', -12.34);
  assert.equal(code.length, 32);
  assert.equal([...code].filter((bit) => bit === '1').length % 2, 1);
});

test('rechaza etiqueta, SDI y valores fuera de rango', () => {
  assert.throws(() => generateArinc429(1, 256), RangeError);
  assert.throws(() => generateArinc429(1, 1, 4), RangeError);
  assert.throws(() => createArincCode('altitud', 3000), RangeError);
});

test('calcula tension proporcional con saturacion simulada de +/-10 V', () => {
  assert.equal(calculateVoltage(125), 1.25);
  assert.equal(calculateVoltage(-125), -1.25);
  assert.equal(calculateVoltage(2000), 10);
});
