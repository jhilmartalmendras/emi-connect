const { servicioNotificacion } = require('../servicios/servicioNotificacion');
const { servicioAmistad } = require('../servicios/servicioAmistad');
const { servicioMensaje } = require('../servicios/servicioMensaje');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorNotificacion = {
  /** GET /api/notificaciones */
  listar: asincrono(async (req, res) => {
    const resultado = await servicioNotificacion.listar(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Notificaciones obtenidas correctamente.');
  }),

  /** GET /api/notificaciones/contadores (badges del menu superior) */
  contadores: asincrono(async (req, res) => {
    const [notificaciones, solicitudes, mensajes] = await Promise.all([
      servicioNotificacion.contarNoLeidas(req.usuario._id),
      servicioAmistad.contarPendientes(req.usuario._id),
      servicioMensaje.contarNoLeidosTotales(req.usuario._id),
    ]);

    return respuestaExito(
      res,
      { notificaciones, solicitudes, mensajes },
      'Contadores obtenidos correctamente.'
    );
  }),

  /** PATCH /api/notificaciones/:id/leer */
  marcarLeida: asincrono(async (req, res) => {
    const notificacion = await servicioNotificacion.marcarLeida(req.params.id, req.usuario._id);
    return respuestaExito(res, { notificacion }, 'Notificacion marcada como leida.');
  }),

  /** PATCH /api/notificaciones/leer-todas */
  marcarTodasLeidas: asincrono(async (req, res) => {
    await servicioNotificacion.marcarTodasLeidas(req.usuario._id);
    return respuestaExito(res, {}, 'Todas las notificaciones fueron marcadas como leidas.');
  }),

  /** DELETE /api/notificaciones/:id */
  eliminar: asincrono(async (req, res) => {
    await servicioNotificacion.eliminar(req.params.id, req.usuario._id);
    return respuestaExito(res, {}, 'Notificacion eliminada correctamente.');
  }),
};

module.exports = { controladorNotificacion };
