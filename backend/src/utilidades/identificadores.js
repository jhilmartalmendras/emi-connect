const crypto = require('crypto');
const mongoose = require('mongoose');

/**
 * Genera un codigo numerico de 6 digitos (usando criptografia segura).
 * Se usa para verificar cuentas y restablecer contrasenas.
 */
function generarCodigoNumerico(longitud = 6) {
  const maximo = 10 ** longitud;
  const numero = crypto.randomInt(0, maximo);
  return String(numero).padStart(longitud, '0');
}

/** Genera un identificador unico seguro para nombres de archivo. */
function generarIdentificadorUnico() {
  return crypto.randomBytes(16).toString('hex');
}

/** Convierte un texto en una version segura para nombres de archivo. */
function normalizarNombreArchivo(texto = 'archivo') {
  return String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 60);
}

/** Comprueba si un valor es un ObjectId valido de MongoDB. */
function esIdentificadorValido(valor) {
  return mongoose.Types.ObjectId.isValid(String(valor || ''));
}

/** Convierte una cadena en ObjectId, lanzando null si no es valido. */
function aObjectId(valor) {
  return esIdentificadorValido(valor) ? new mongoose.Types.ObjectId(String(valor)) : null;
}

module.exports = {
  generarCodigoNumerico,
  generarIdentificadorUnico,
  normalizarNombreArchivo,
  esIdentificadorValido,
  aObjectId,
};
