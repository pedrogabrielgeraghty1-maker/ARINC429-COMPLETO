// Punto de extension opcional. No se abre ningun puerto serial en esta simulacion.
// Para integrar hardware, instalar serialport y enviar el word binario en el
// orden de bytes definido por el adaptador ARINC/serial de destino.
async function sendOverSerial(_code) {
  throw new Error('El envio serial no esta configurado; esta aplicacion solo simula.');
}

module.exports = { sendOverSerial };
