const rateLimit = require('express-rate-limit');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/** Respuesta uniforme cuando se supera el limite de peticiones. */
const manejadorLimite = (req, res, next, opciones) => {
  next(
    ErrorAplicacion.demasiadasSolicitudes(
      `Demasiadas solicitudes. Intenta nuevamente en ${Math.ceil(opciones.windowMs / 60000)} minuto(s).`
    )
  );
};

/** Limite general para toda la API. */
const limitadorGlobal = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: manejadorLimite,
  skip: (req) => req.method === 'OPTIONS',
});

/** Limite estricto para autenticacion (evita ataques de fuerza bruta). */
const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  handler: manejadorLimite,
  message: 'Demasiados intentos de autenticacion.',
});

/** Limite para el envio de codigos por correo. */
const limitadorCorreo = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, opciones) =>
    next(
      ErrorAplicacion.demasiadasSolicitudes(
        'Se alcanzo el limite de envios de codigo por correo. Intenta mas tarde.'
      )
    ),
});

/** Limite para acciones de escritura (publicar, comentar, reaccionar). */
const limitadorEscritura = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: manejadorLimite,
});

/** Limite para el envio de mensajes privados. */
const limitadorMensajes = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) =>
    next(ErrorAplicacion.demasiadasSolicitudes('Estas enviando mensajes demasiado rapido. Espera un momento.')),
});

/** Limite para la subida de archivos. */
const limitadorSubidas = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: manejadorLimite,
});

module.exports = {
  limitadorGlobal,
  limitadorAutenticacion,
  limitadorCorreo,
  limitadorEscritura,
  limitadorMensajes,
  limitadorSubidas,
};
