const { servicioMensaje } = require('../servicios/servicioMensaje');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorMensaje = {
  /** GET /api/mensajes/conversaciones */
  listarConversaciones: asincrono(async (req, res) => {
    const resultado = await servicioMensaje.listarConversaciones(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Conversaciones obtenidas correctamente.');
  }),

  /** POST /api/mensajes/conversaciones (abre o crea la conversacion con un usuario) */
  abrirConversacion: asincrono(async (req, res) => {
    const conversacion = await servicioMensaje.obtenerOCrearConversacion(
      req.usuario._id,
      req.body.usuarioId
    );
    return respuestaExito(res, { conversacion }, 'Conversacion lista.');
  }),

  /** GET /api/mensajes/conversaciones/:id */
  listarMensajes: asincrono(async (req, res) => {
    const resultado = await servicioMensaje.listarMensajes(req.params.id, req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Mensajes obtenidos correctamente.');
  }),

  /** POST /api/mensajes */
  enviar: asincrono(async (req, res) => {
    const mensaje = await servicioMensaje.enviarMensaje(req.usuario, {
      conversacionId: req.body.conversacionId,
      destinatarioId: req.body.destinatarioId,
      contenido: req.body.contenido,
      imagen: req.body.imagen,
    });
    return respuestaExito(res, { mensaje }, 'Mensaje enviado correctamente.', 201);
  }),

  /** PATCH /api/mensajes/conversaciones/:id/leidos */
  marcarLeidos: asincrono(async (req, res) => {
    const resultado = await servicioMensaje.marcarComoLeidos(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/mensajes/no-leidos */
  contarNoLeidos: asincrono(async (req, res) => {
    const total = await servicioMensaje.contarNoLeidosTotales(req.usuario._id);
    return respuestaExito(res, { total }, 'Contador de mensajes obtenido.');
  }),

  /** DELETE /api/mensajes/conversaciones/:id */
  eliminarConversacion: asincrono(async (req, res) => {
    const resultado = await servicioMensaje.eliminarConversacion(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/mensajes/imagen (sube una imagen y la envia) */
  enviarImagen: asincrono(async (req, res) => {
    const mensaje = await servicioMensaje.enviarMensaje(req.usuario, {
      conversacionId: req.body.conversacionId,
      destinatarioId: req.body.destinatarioId,
      contenido: req.body.contenido || '',
      imagen: req.file ? `/uploads/publicaciones/${req.file.filename}` : '',
    });
    return respuestaExito(res, { mensaje }, 'Imagen enviada correctamente.', 201);
  }),
};

module.exports = { controladorMensaje };
