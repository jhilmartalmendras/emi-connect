const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { respuestaError } = require('../utilidades/respuesta');
const { variablesEntorno } = require('../config/variablesEntorno');

/**
 * Traduce errores tecnicos (MongoDB, Multer, JWT) a mensajes comprensibles.
 * El usuario nunca ve detalles internos del servidor.
 */
function traducirError(error) {
  // Errores controlados por la aplicacion.
  if (error instanceof ErrorAplicacion) return error;

  // Clave duplicada en MongoDB.
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || {}).join(', ') || 'campo';
    if (campo.includes('correo')) return ErrorAplicacion.conflicto('Este correo ya se encuentra registrado.');
    return ErrorAplicacion.conflicto(`Ya existe un registro con el mismo valor en: ${campo}.`);
  }

  // Error de conversion de ObjectId u otros tipos.
  if (error.name === 'CastError') {
    return ErrorAplicacion.solicitudInvalida('El identificador enviado no es valido.');
  }

  // Errores de validacion de Mongoose.
  if (error.name === 'ValidationError') {
    const errores = Object.values(error.errors || {}).map((detalle) => ({
      campo: detalle.path,
      mensaje: detalle.message,
    }));
    return new ErrorAplicacion('Los datos enviados no son validos.', 400, errores);
  }

  // Documento no encontrado en operaciones findByIdAndUpdate.
  if (error.name === 'DocumentNotFoundError') {
    return ErrorAplicacion.noEncontrado('El recurso solicitado no existe.');
  }

  // Errores de Multer (subida de archivos).
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      const limiteMb = Math.round(variablesEntorno.archivos.tamanoMaximoBytes / (1024 * 1024));
      return new ErrorAplicacion(`La imagen supera el tamano maximo permitido (${limiteMb} MB).`, 413);
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return ErrorAplicacion.solicitudInvalida('Se envio una cantidad de archivos mayor a la permitida.');
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return ErrorAplicacion.solicitudInvalida('El nombre del campo del archivo no es valido.');
    }
    return ErrorAplicacion.solicitudInvalida('No se pudo procesar el archivo enviado.');
  }

  // Errores de JSON mal formado en el cuerpo de la peticion.
  if (error.type === 'entity.parse.failed') {
    return ErrorAplicacion.solicitudInvalida('El cuerpo de la peticion no es un JSON valido.');
  }

  // Error de tiempo de espera de MongoDB.
  if (error.name === 'MongooseServerSelectionError' || error.name === 'MongoNetworkError') {
    return new ErrorAplicacion('No se pudo conectar con la base de datos. Intenta nuevamente.', 503);
  }

  return ErrorAplicacion.interno();
}

/** Manejador global de errores: siempre responde con la estructura uniforme. */
function manejadorErrores(error, req, res, next) {
  const errorTraducido = traducirError(error);
  const codigoEstado = errorTraducido.codigoEstado || 500;

  // Los errores inesperados se registran completos para diagnostico.
  if (codigoEstado >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, error);
  } else if (!variablesEntorno.esProduccion) {
    console.warn(`[aviso] ${req.method} ${req.originalUrl} -> ${errorTraducido.message}`);
  }

  return respuestaError(
    res,
    errorTraducido.message,
    errorTraducido.errores || [],
    codigoEstado
  );
}

/** Respuesta uniforme para rutas inexistentes. */
function rutaNoEncontrada(req, res) {
  return respuestaError(res, `La ruta solicitada no existe: ${req.method} ${req.originalUrl}`, [], 404);
}

module.exports = { manejadorErrores, rutaNoEncontrada, traducirError };
