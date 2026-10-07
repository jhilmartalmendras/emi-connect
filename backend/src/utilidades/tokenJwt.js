const jwt = require('jsonwebtoken');
const { variablesEntorno } = require('../config/variablesEntorno');
const { ErrorAplicacion } = require('./ErrorAplicacion');

/**
 * Firma un token de sesion. El payload solo contiene datos no sensibles.
 */
function generarTokenSesion(usuario) {
  return jwt.sign(
    {
      id: String(usuario._id),
      rol: usuario.rol,
      correo: usuario.correo,
    },
    variablesEntorno.jwt.secreto,
    { expiresIn: variablesEntorno.jwt.expiracion }
  );
}

/**
 * Verifica un token de sesion. Lanza error controlado si expiro o es invalido.
 */
function verificarTokenSesion(token) {
  try {
    return jwt.verify(token, variablesEntorno.jwt.secreto);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ErrorAplicacion.noAutorizado('La sesion expiro. Inicia sesion nuevamente.');
    }
    throw ErrorAplicacion.noAutorizado('Token de sesion invalido.');
  }
}

/**
 * Genera un token temporal para restablecer contrasena.
 * Se diferencia del token de sesion mediante el campo "tipo".
 */
function generarTokenRestablecimiento(usuario) {
  return jwt.sign(
    { id: String(usuario._id), tipo: 'restablecimiento' },
    variablesEntorno.jwt.secreto,
    { expiresIn: '30m' }
  );
}

function verificarTokenRestablecimiento(token) {
  try {
    const datos = jwt.verify(token, variablesEntorno.jwt.secreto);
    if (datos.tipo !== 'restablecimiento') {
      throw ErrorAplicacion.noAutorizado('Token de restablecimiento invalido.');
    }
    return datos;
  } catch (error) {
    if (error instanceof ErrorAplicacion) throw error;
    throw ErrorAplicacion.noAutorizado('El enlace de recuperacion expiro o no es valido.');
  }
}

module.exports = {
  generarTokenSesion,
  verificarTokenSesion,
  generarTokenRestablecimiento,
  verificarTokenRestablecimiento,
};
