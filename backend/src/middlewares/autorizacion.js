const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { ROLES_ADMINISTRACION, ROLES } = require('../constantes/roles');

/**
 * Permite el acceso solo a los roles indicados.
 * Se usa despues del middleware "autenticar".
 */
function autorizarRoles(...rolesPermitidos) {
  return function verificarRol(req, res, next) {
    if (!req.usuario) {
      return next(ErrorAplicacion.noAutorizado('Debes iniciar sesion para continuar.'));
    }
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return next(ErrorAplicacion.prohibido('No tienes permisos para realizar esta accion.'));
    }
    return next();
  };
}

/** Solo administradores de la plataforma. */
const soloAdministrador = autorizarRoles(ROLES.ADMINISTRADOR);

/** Moderadores y administradores (acceso al panel administrativo). */
const soloAdministracion = autorizarRoles(...ROLES_ADMINISTRACION);

/**
 * Verifica que el usuario autenticado sea el propietario del recurso
 * o que pertenezca a la administracion. El identificador se lee de req.params.
 */
function autorizarPropietarioOAdministracion(campoParametro = 'id') {
  return function verificarPropietario(req, res, next) {
    if (!req.usuario) {
      return next(ErrorAplicacion.noAutorizado('Debes iniciar sesion para continuar.'));
    }

    const esPropietario = String(req.params[campoParametro]) === String(req.usuario._id);
    const esAdministracion = ROLES_ADMINISTRACION.includes(req.usuario.rol);

    if (!esPropietario && !esAdministracion) {
      return next(ErrorAplicacion.prohibido('Solo el propietario puede realizar esta accion.'));
    }
    return next();
  };
}

module.exports = {
  autorizarRoles,
  soloAdministrador,
  soloAdministracion,
  autorizarPropietarioOAdministracion,
};
