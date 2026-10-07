const { verificarTokenSesion } = require('../utilidades/tokenJwt');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Toma el token del encabezado Authorization (formato "Bearer <token>").
 */
function extraerToken(req) {
  const encabezado = req.headers.authorization || '';
  if (!encabezado.startsWith('Bearer ')) return null;
  const token = encabezado.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Middleware obligatorio: valida el token y adjunta el usuario en req.usuario.
 * Toda ruta privada debe pasar por aqui.
 */
async function autenticar(req, res, next) {
  try {
    const token = extraerToken(req);
    if (!token) throw ErrorAplicacion.noAutorizado('Debes iniciar sesion para acceder a este recurso.');

    const datos = verificarTokenSesion(token);
    const usuario = await repositorioUsuario.buscarPorId(datos.id);

    if (!usuario) throw ErrorAplicacion.noAutorizado('La cuenta asociada al token ya no existe.');
    if (usuario.bloqueado) throw ErrorAplicacion.prohibido('Tu cuenta esta bloqueada.');
    if (!usuario.activo || usuario.cuentaEliminada) {
      throw ErrorAplicacion.prohibido('Tu cuenta no esta habilitada.');
    }
    if (!usuario.verificado) {
      throw ErrorAplicacion.prohibido('Debes verificar tu correo institucional para continuar.');
    }

    req.usuario = usuario;
    req.idUsuario = String(usuario._id);
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Middleware opcional: si hay token valido carga el usuario, si no continua.
 * Se usa en rutas publicas que cambian su respuesta segun la sesion.
 */
async function autenticacionOpcional(req, res, next) {
  try {
    const token = extraerToken(req);
    if (!token) return next();

    const datos = verificarTokenSesion(token);
    const usuario = await repositorioUsuario.buscarPorId(datos.id);
    if (usuario && usuario.activo && !usuario.bloqueado) {
      req.usuario = usuario;
      req.idUsuario = String(usuario._id);
    }
    return next();
  } catch (error) {
    // En rutas opcionales un token invalido no debe bloquear la peticion.
    return next();
  }
}

module.exports = { autenticar, autenticacionOpcional, extraerToken };
