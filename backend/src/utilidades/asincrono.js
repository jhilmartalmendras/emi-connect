/**
 * Envuelve controladores asincronos para que cualquier error rechazado
 * llegue al manejador global de errores en lugar de bloquear la peticion.
 */
function asincrono(fn) {
  return function controladorEnvuelto(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asincrono };
