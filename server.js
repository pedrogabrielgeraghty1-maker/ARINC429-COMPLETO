require('dotenv').config();

const path = require('node:path');
const express = require('express');
const cors = require('cors');
const pool = require('./src/db');
const { INSTRUMENTS, createArincCode } = require('./src/arinc429');
const { calculateVoltage } = require('./src/voltage');

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function parseEnvioInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('El cuerpo de la solicitud debe ser un objeto JSON.');
    error.status = 400;
    throw error;
  }
  const instrumento = typeof body.instrumento === 'string' ? body.instrumento : '';
  const valor = body.valor;

  if (!Object.hasOwn(INSTRUMENTS, instrumento)) {
    const error = new Error('Seleccione un instrumento valido.');
    error.status = 400;
    throw error;
  }
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    const error = new Error('El valor debe ser un numero finito.');
    error.status = 400;
    throw error;
  }

  try {
    return {
      instrumento,
      valor,
      codigo_arinc: createArincCode(instrumento, valor),
      tension: calculateVoltage(valor)
    };
  } catch (error) {
    error.status = 400;
    throw error;
  }
}

function parseEnvioId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    const error = new Error('El id debe ser un entero positivo.');
    error.status = 400;
    throw error;
  }
  return Number(value);
}

app.get('/api/envios', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, instrumento, valor, codigo_arinc, tension, fecha_creacion FROM envios ORDER BY fecha_creacion DESC, id DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.get('/api/envios/:id', async (req, res, next) => {
  try {
    const id = parseEnvioId(req.params.id);
    const [rows] = await pool.execute(
      'SELECT id, instrumento, valor, codigo_arinc, tension, fecha_creacion FROM envios WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Envio no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/envios', async (req, res, next) => {
  try {
    const envio = parseEnvioInput(req.body);
    const [result] = await pool.execute(
      'INSERT INTO envios (instrumento, valor, codigo_arinc, tension) VALUES (?, ?, ?, ?)',
      [envio.instrumento, envio.valor, envio.codigo_arinc, envio.tension]
    );
    const [rows] = await pool.execute('SELECT * FROM envios WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/envios/:id', async (req, res, next) => {
  try {
    const id = parseEnvioId(req.params.id);
    const envio = parseEnvioInput(req.body);
    await pool.execute(
      'UPDATE envios SET instrumento = ?, valor = ?, codigo_arinc = ?, tension = ? WHERE id = ?',
      [envio.instrumento, envio.valor, envio.codigo_arinc, envio.tension, id]
    );
    const [rows] = await pool.execute('SELECT * FROM envios WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Envio no encontrado.' });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/envios/:id', async (req, res, next) => {
  try {
    const id = parseEnvioId(req.params.id);
    const [result] = await pool.execute('DELETE FROM envios WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Envio no encontrado.' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor.' : error.message
  });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    app.listen(port, () => {
      console.log(`Simulador ARINC 429 disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No fue posible conectar con MySQL. Verifique .env y schema.sql.', error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, parseEnvioInput, startServer };
