/**
 * Error controlado de la aplicacion.
 * Permite lanzar errores con codigo HTTP y mensajes comprensibles para el usuario
 * sin exponer detalles internos de MongoDB o del servidor.
 */
class ErrorAplicacion extends Error {
  constructor(mensaje, codigoEstado = 400, errores = []) {
    super(mensaje);
    this.nombre = 'ErrorAplicacion';
    this.codigoEstado = codigoEstado;
    this.errores = errores;
    this.esOperacional = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static solicitudInvalida(mensaje = 'La solicitud contiene datos invalidos', errores = []) {
    return new ErrorAplicacion(mensaje, 400, errores);
  }

  static noAutorizado(mensaje = 'Debes iniciar sesion para continuar') {
    return new ErrorAplicacion(mensaje, 401);
  }

  static prohibido(mensaje = 'No tienes permisos para realizar esta accion') {
    return new ErrorAplicacion(mensaje, 403);
  }

  static noEncontrado(mensaje = 'El recurso solicitado no existe') {
    return new ErrorAplicacion(mensaje, 404);
  }

  static conflicto(mensaje = 'La operacion entra en conflicto con datos existentes') {
    return new ErrorAplicacion(mensaje, 409);
  }

  static demasiadasSolicitudes(mensaje = 'Demasiados intentos. Intenta nuevamente mas tarde.') {
    return new ErrorAplicacion(mensaje, 429);
  }

  static interno(mensaje = 'Ocurrio un error interno en el servidor') {
    return new ErrorAplicacion(mensaje, 500);
  }
}

module.exports = { ErrorAplicacion };
