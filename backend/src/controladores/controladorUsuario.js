const { servicioUsuario } = require('../servicios/servicioUsuario');
const { servicioArchivo } = require('../servicios/servicioArchivo');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

/**
 * Controlador de usuarios.
 * Incluye perfil propio y publico, edicion, privacidad y bloqueos.
 */
const controladorUsuario = {
  /** GET /api/usuarios/perfil/:id */
  obtenerPerfil: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.obtenerPerfil(req.params.id, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Perfil obtenido correctamente.');
  }),

  /** GET /api/usuarios/mi-perfil */
  obtenerMiPerfil: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.obtenerPerfil(req.usuario._id, req.usuario._id);
    return respuestaExito(res, resultado, 'Perfil obtenido correctamente.');
  }),

  /** PUT /api/usuarios/mi-perfil */
  actualizarMiPerfil: asincrono(async (req, res) => {
    const usuario = await servicioUsuario.actualizarPerfil(req.usuario._id, req.body);
    return respuestaExito(res, { usuario }, 'Perfil actualizado correctamente.');
  }),

  /** GET /api/usuarios */
  listarUsuarios: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.listarUsuarios(req.query, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Usuarios listados correctamente.');
  }),

  /** GET /api/usuarios/privacidad */
  obtenerPrivacidad: asincrono(async (req, res) => {
    const privacidad = await servicioUsuario.obtenerPrivacidad(req.usuario._id);
    return respuestaExito(res, { privacidad }, 'Configuracion de privacidad obtenida.');
  }),

  /** PUT /api/usuarios/privacidad */
  actualizarPrivacidad: asincrono(async (req, res) => {
    const privacidad = await servicioUsuario.actualizarPrivacidad(req.usuario._id, req.body);
    return respuestaExito(res, { privacidad }, 'Configuracion de privacidad actualizada.');
  }),

  /** POST /api/usuarios/bloqueos/:id */
  bloquearUsuario: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.bloquearUsuario(
      req.usuario._id,
      req.params.id,
      req.body.motivo || ''
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/usuarios/bloqueos/:id */
  desbloquearUsuario: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.desbloquearUsuario(req.usuario._id, req.params.id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/usuarios/bloqueos */
  listarBloqueados: asincrono(async (req, res) => {
    const bloqueados = await servicioUsuario.listarBloqueados(req.usuario._id);
    return respuestaExito(res, { bloqueados }, 'Usuarios bloqueados listados correctamente.');
  }),

  // ------------------------------------------------------------------
  // SUBIDA DE IMAGENES (foto de perfil y portada)
  // ------------------------------------------------------------------

  /** POST /api/usuarios/mi-perfil/foto */
  subirFotoPerfil: asincrono(async (req, res) => {
    if (!req.file) {
      return respuestaExito(res, {}, 'No se recibio ninguna imagen.', 200);
    }

    const rutaAnterior = req.usuario.fotoPerfil;
    const rutaPublica = `/uploads/perfiles/${req.file.filename}`;

    const usuario = await servicioUsuario.actualizarPerfil(req.usuario._id, { fotoPerfil: rutaPublica });
    if (rutaAnterior) servicioArchivo.eliminar(rutaAnterior);

    return respuestaExito(res, { usuario, ruta: rutaPublica }, 'Foto de perfil actualizada.');
  }),

  /** POST /api/usuarios/mi-perfil/portada */
  subirFotoPortada: asincrono(async (req, res) => {
    if (!req.file) {
      return respuestaExito(res, {}, 'No se recibio ninguna imagen.', 200);
    }

    const rutaAnterior = req.usuario.fotoPortada;
    const rutaPublica = `/uploads/perfiles/${req.file.filename}`;

    const usuario = await servicioUsuario.actualizarPerfil(req.usuario._id, { fotoPortada: rutaPublica });
    if (rutaAnterior) servicioArchivo.eliminar(rutaAnterior);

    return respuestaExito(res, { usuario, ruta: rutaPublica }, 'Foto de portada actualizada.');
  }),

  /** DELETE /api/usuarios/mi-perfil */
  eliminarMiCuenta: asincrono(async (req, res) => {
    const resultado = await servicioUsuario.desactivarCuenta(req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),
};

module.exports = { controladorUsuario };
