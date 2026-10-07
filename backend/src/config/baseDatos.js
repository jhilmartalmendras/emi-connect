const mongoose = require('mongoose');
const { variablesEntorno } = require('./variablesEntorno');

// Desactiva la creacion automatica de indices duplicados.
mongoose.set('strictQuery', true);

/**
 * Establece la conexion con MongoDB.
 * Centraliza la configuracion para que ningun modelo o servicio abra conexiones propias.
 */
async function conectarBaseDatos(uri = variablesEntorno.baseDatos.uri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  mongoose.connection.on('conectado', () => {});
  mongoose.connection.on('error', (error) => {
    console.error('[base-datos] Error de conexion:', error.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[base-datos] Conexion cerrada.');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
    maxPoolSize: 10,
    autoIndex: true,
  });

  console.log(`[base-datos] Conectado a ${mongoose.connection.name}`);
  return mongoose.connection;
}

async function desconectarBaseDatos() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

module.exports = { conectarBaseDatos, desconectarBaseDatos, mongoose };
