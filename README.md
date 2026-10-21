# Simulador ARINC 429

Aplicacion local de demostracion con Node.js, Express, mysql2 y una interfaz web sencilla. La API genera una trama de 32 bits y un valor de tension simulado por registro; no controla hardware ni transmite por bus ARINC/audio.

## Requisitos

- Node.js 18 o superior
- MySQL 8 (o compatible)

## Instalacion y arranque

1. Cree la base de datos y la tabla ejecutando `schema.sql` en MySQL.
2. Copie `.env.example` a `.env` y configure las credenciales.
3. Ejecute `npm install`.
4. Inicie con `npm start` (o `npm run dev` durante el desarrollo).
5. Abra `http://localhost:3000`.

Las pruebas unitarias sin conexion a la base se ejecutan con `npm test`.

## API

- `GET /api/envios`: lista todos los registros.
- `GET /api/envios/:id`: consulta un registro.
- `POST /api/envios`: crea `{ "instrumento": "altitud", "valor": 123.45 }`.
- `PUT /api/envios/:id`: actualiza instrumento y valor con el mismo formato.
- `DELETE /api/envios/:id`: elimina un registro.

La trama y la tension se recalculan al crear o actualizar. Los errores de entrada responden con HTTP 400 y los registros inexistentes con HTTP 404.

## Supuestos de simulacion

- Las etiquetas octales de `src/arinc429.js` son valores de demostracion, no una asignacion aeronáutica universal. Deben configurarse según el equipo/interfaz que se quiera simular.
- La palabra representa, de bit 1 a bit 32: etiqueta (bits 1-8, orden de bits invertido para transmision ARINC), SDI (9-10), dato BNR (11-29, complemento a dos con resolucion 0.01), SSM (30-31) y paridad impar (32).
- La tension simulada usa `0.01 V` por unidad y se limita a `+/-10 V`. No se conecta a una salida de audio real.
- `src/serial.js` deja un punto de extension explícito. No incluye `serialport` ni abre puertos.

## Seguridad y operacion

Use este proyecto solo en un entorno de desarrollo/simulacion. Configure `CORS_ORIGIN` a un origen concreto si la interfaz se sirve desde otro host. No conecte esta codificacion de demostracion a equipos avionicos sin validar el formato, etiquetas, unidades y requisitos de certificacion correspondientes.
