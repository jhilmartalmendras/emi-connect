const { servicioAdministracion } = require('../servicios/servicioAdministracion');
const { servicioEstadistica } = require('../servicios/servicioEstadistica');
const { servicioUsuario } = require('../servicios/servicioUsuario');
const { servicioReporte } = require('../servicios/servicioReporte');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

/**
 * Controlador del panel administrativo.
 * Resumen, gestion de usuarios, publicaciones, comunidades, reportes y estadisticas.
 */
const controladorAdmin = {
  /** GET /api/admin/resumen */
  resumen: asincrono(async (req, res) => {
    servicioAdministracion.validarAdministracion(req.usuario);
    const resumen = await servicioEstadistica.obtenerResumen();
    return respuestaExito(res, { resumen }, 'Resumen del panel obtenido correctamente.');
  }),

  /** GET /api/admin/estadisticas */
  estadisticas: asincrono(async (req, res) => {
    servicioAdministracion.validarAdministracion(req.usuario);
    const [crecimiento, actividad] = await Promise.all([
      servicioEstadistica.obtenerCrecimiento(req.query),
      servicioEstadistica.obtenerActividadReciente(req.usuario),
    ]);
    return respuestaExito(res, { crecimiento, actividad }, 'Estadisticas obtenidas correctamente.');
  }),

  /** GET /api/admin/usuarios */
  listarUsuarios: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.listarUsuarios(req.query, req.usuario);
    return respuestaExito(res, resultado, 'Usuarios listados correctamente.');
  }),

  /** PATCH /api/admin/usuarios/:id/bloqueo */
  bloquearUsuario: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.cambiarBloqueoUsuario(req.params.id, req.usuario, {
      bloqueado: req.body.bloqueado !== false,
      motivo: req.body.motivo || '',
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** PATCH /api/admin/usuarios/:id/estado */
  cambiarEstadoUsuario: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.cambiarEstadoCuenta(
      req.params.id,
      req.usuario,
      req.body.activo !== false
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** PATCH /api/admin/usuarios/:id/rol */
  cambiarRol: asincrono(async (req, res) => {
    servicioAdministracion.validarAdministracion(req.usuario);
    const usuario = await servicioUsuario.cambiarRol(req.params.id, req.body.rol, req.usuario._id);
    return respuestaExito(res, { usuario }, 'Rol actualizado correctamente.');
  }),

  /** DELETE /api/admin/usuarios/:id */
  eliminarUsuario: asincrono(async (req, res) => {
    servicioAdministracion.validarAdministracion(req.usuario);
    const resultado = await servicioUsuario.eliminarUsuario(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/admin/publicaciones */
  listarPublicaciones: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.listarPublicaciones(req.query, req.usuario);
    return respuestaExito(res, resultado, 'Publicaciones listadas correctamente.');
  }),

  /** PATCH /api/admin/publicaciones/:id/restaurar */
  restaurarPublicacion: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.restaurarPublicacion(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/admin/publicaciones/:id/definitivo */
  eliminarPublicacionDefinitiva: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.eliminarPublicacionDefinitiva(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/admin/comunidades */
  listarComunidades: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.listarComunidades(req.query, req.usuario);
    return respuestaExito(res, resultado, 'Comunidades listadas correctamente.');
  }),

  /** PATCH /api/admin/comunidades/:id/estado */
  cambiarEstadoComunidad: asincrono(async (req, res) => {
    const resultado = await servicioAdministracion.cambiarEstadoComunidad(
      req.params.id,
      req.usuario,
      req.body.activa !== false
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/admin/reportes */
  listarReportes: asincrono(async (req, res) => {
    const resultado = await servicioReporte.listarReportes(req.query, req.usuario);
    return respuestaExito(res, resultado, 'Reportes listados correctamente.');
  }),

  /** GET /api/admin/reportes/pendientes */
  reportesPendientes: asincrono(async (req, res) => {
    const reportes = await servicioAdministracion.listarReportesPendientes(req.usuario);
    return respuestaExito(res, { reportes }, 'Reportes pendientes obtenidos correctamente.');
  }),
};

module.exports = { controladorAdmin };
