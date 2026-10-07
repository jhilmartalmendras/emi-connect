/**
 * Respuestas uniformes de la API REST.
 *
 * Exito:  { "exito": true,  "mensaje": "...", "datos": {} }
 * Error:  { "exito": false, "mensaje": "...", "errores": [] }
 */
function respuestaExito(res, datos = {}, mensaje = 'Operacion realizada correctamente', codigoEstado = 200) {
  return res.status(codigoEstado).json({
    exito: true,
    mensaje,
    datos,
  });
}

function respuestaError(res, mensaje = 'No se pudo completar la operacion', errores = [], codigoEstado = 400) {
  return res.status(codigoEstado).json({
    exito: false,
    mensaje,
    errores: Array.isArray(errores) ? errores : [errores],
  });
}

module.exports = { respuestaExito, respuestaError };
