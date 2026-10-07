const { servicioAmistad } = require('../servicios/servicioAmistad');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorAmistad = {
  /** POST /api/amistades/solicitudes */
  enviarSolicitud: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.enviarSolicitud(
      req.usuario._id,
      req.body.usuarioId,
      req.body.mensaje || ''
    );
    return respuestaExito(res, resultado, resultado.mensaje, 201);
  }),

  /** GET /api/amistades/solicitudes/recibidas */
  listarRecibidas: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.listarSolicitudesRecibidas(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Solicitudes recibidas obtenidas correctamente.');
  }),

  /** GET /api/amistades/solicitudes/enviadas */
  listarEnviadas: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.listarSolicitudesEnviadas(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Solicitudes enviadas obtenidas correctamente.');
  }),

  /** GET /api/amistades */
  listarAmigos: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.listarAmigos(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Amigos obtenidos correctamente.');
  }),

  /** PATCH /api/amistades/solicitudes/:id/aceptar */
  aceptar: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.aceptarSolicitud(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** PATCH /api/amistades/solicitudes/:id/rechazar */
  rechazar: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.rechazarSolicitud(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** PATCH /api/amistades/solicitudes/:id/cancelar */
  cancelar: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.cancelarSolicitud(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/amistades/:id */
  eliminarAmistad: asincrono(async (req, res) => {
    const resultado = await servicioAmistad.eliminarAmistad(req.usuario._id, req.params.id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),
};

module.exports = { controladorAmistad };
