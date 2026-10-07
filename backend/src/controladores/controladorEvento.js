const { servicioEvento } = require('../servicios/servicioEvento');
const { servicioArchivo } = require('../servicios/servicioArchivo');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorEvento = {
  /** GET /api/eventos */
  listar: asincrono(async (req, res) => {
    const resultado = await servicioEvento.listarEventos(req.query, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Eventos obtenidos correctamente.');
  }),

  /** GET /api/eventos/proximos */
  proximos: asincrono(async (req, res) => {
    const eventos = await servicioEvento.listarProximos(Number(req.query.limite) || 5);
    return respuestaExito(res, { eventos }, 'Eventos proximos obtenidos correctamente.');
  }),

  /** GET /api/eventos/:id */
  obtener: asincrono(async (req, res) => {
    const resultado = await servicioEvento.obtenerEvento(req.params.id, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Evento obtenido correctamente.');
  }),

  /** POST /api/eventos */
  crear: asincrono(async (req, res) => {
    const imagen = req.file ? `/uploads/eventos/${req.file.filename}` : req.body.imagen || '';

    const evento = await servicioEvento.crearEvento(req.usuario, {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      fecha: req.body.fecha,
      horaFin: req.body.horaFin,
      ubicacion: req.body.ubicacion,
      categoria: req.body.categoria,
      cupos: req.body.cupos,
      esInstitucional: req.body.esInstitucional === true || req.body.esInstitucional === 'true',
      comunidad: req.body.comunidad || null,
      imagen,
    });

    return respuestaExito(res, { evento }, 'Evento creado correctamente.', 201);
  }),

  /** PUT /api/eventos/:id */
  actualizar: asincrono(async (req, res) => {
    const evento = await servicioEvento.actualizarEvento(req.params.id, req.usuario, req.body);
    return respuestaExito(res, { evento }, 'Evento actualizado correctamente.');
  }),

  /** DELETE /api/eventos/:id */
  eliminar: asincrono(async (req, res) => {
    const resultado = await servicioEvento.eliminarEvento(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/eventos/:id/asistencia */
  confirmarAsistencia: asincrono(async (req, res) => {
    const resultado = await servicioEvento.confirmarAsistencia(req.params.id, req.usuario, req.body.estado);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/eventos/:id/imagen */
  subirImagen: asincrono(async (req, res) => {
    const ruta = req.file ? `/uploads/eventos/${req.file.filename}` : '';
    const evento = await servicioEvento.actualizarEvento(req.params.id, req.usuario, { imagen: ruta });
    return respuestaExito(res, { evento, ruta }, 'Imagen del evento actualizada.');
  }),

  /** DELETE /api/eventos/:id/imagen */
  eliminarImagen: asincrono(async (req, res) => {
    const evento = await servicioEvento.actualizarEvento(req.params.id, req.usuario, { imagen: '' });
    if (req.body.ruta) servicioArchivo.eliminar(req.body.ruta);
    return respuestaExito(res, { evento }, 'Imagen eliminada correctamente.');
  }),
};

module.exports = { controladorEvento };
