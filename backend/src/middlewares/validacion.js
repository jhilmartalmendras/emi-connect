const { validationResult } = require('express-validator');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Revisa el resultado de las cadenas de validacion y detiene la peticion
 * si existen errores. Los mensajes se devuelven con estructura uniforme.
 */
function validarCampos(req, res, next) {
  const resultado = validationResult(req);

  if (!resultado.isEmpty()) {
    const errores = resultado.array().map((error) => ({
      campo: error.path,
      mensaje: error.msg,
      valor: error.value !== undefined ? String(error.value).slice(0, 60) : undefined,
    }));

    const primerMensaje = errores[0]?.mensaje || 'Los datos enviados no son validos.';
    return next(ErrorAplicacion.solicitudInvalida(primerMensaje, errores));
  }

  return next();
}

module.exports = { validarCampos };
