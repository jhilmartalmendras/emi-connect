const { servicioPublicacion } = require('../servicios/servicioPublicacion');
const { servicioArchivo } = require('../servicios/servicioArchivo');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

/**
 * Controlador de publicaciones.
 * Cubre el feed, la creacion con imagenes, comentarios anidados (en su controlador),
 * compartir, guardar e historias.
 */
const controladorPublicacion = {
  /** GET /api/publicaciones (feed personalizado) */
  obtenerFeed: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.obtenerFeed(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Feed obtenido correctamente.');
  }),

  /** GET /api/publicaciones/explorar (publicaciones de toda la plataforma) */
  explorar: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.obtenerFeed(req.usuario._id, { ...req.query, categoria: undefined });
    return respuestaExito(res, resultado, 'Publicaciones obtenidas correctamente.');
  }),

  /** POST /api/publicaciones */
  crear: asincrono(async (req, res) => {
    // Las imagenes pueden llegar como archivos subidos o como rutas ya guardadas.
    const imagenes = req.files && req.files.length > 0
      ? req.files.map((archivo) => `/uploads/publicaciones/${archivo.filename}`)
      : req.body.imagenes || [];

    const publicacion = await servicioPublicacion.crearPublicacion(req.usuario, {
      contenido: req.body.contenido,
      categoria: req.body.categoria,
      comunidad: req.body.comunidad || null,
      evento: req.body.evento || null,
      producto: req.body.producto || null,
      etiquetas: req.body.etiquetas || [],
      enlace: req.body.enlace,
      imagenes,
    });

    return respuestaExito(res, { publicacion }, 'Publicacion creada correctamente.', 201);
  }),

  /** GET /api/publicaciones/:id */
  obtener: asincrono(async (req, res) => {
    const publicacion = await servicioPublicacion.obtenerPublicacion(req.params.id, req.usuario?._id || null);
    return respuestaExito(res, { publicacion }, 'Publicacion obtenida correctamente.');
  }),

  /** GET /api/publicaciones/usuario/:id */
  listarPorUsuario: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.listarPorUsuario(
      req.params.id,
      req.usuario?._id || null,
      req.query
    );
    return respuestaExito(res, resultado, 'Publicaciones del usuario obtenidas correctamente.');
  }),

  /** GET /api/publicaciones/comunidad/:id */
  listarPorComunidad: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.listarPorComunidad(
      req.params.id,
      req.usuario?._id || null,
      req.query
    );
    return respuestaExito(res, resultado, 'Publicaciones de la comunidad obtenidas correctamente.');
  }),

  /** PUT /api/publicaciones/:id */
  actualizar: asincrono(async (req, res) => {
    const publicacion = await servicioPublicacion.actualizarPublicacion(req.params.id, req.usuario, req.body);
    return respuestaExito(res, { publicacion }, 'Publicacion actualizada correctamente.');
  }),

  /** DELETE /api/publicaciones/:id */
  eliminar: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.eliminarPublicacion(
      req.params.id,
      req.usuario,
      req.body.motivo || ''
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/publicaciones/:id/compartir */
  compartir: asincrono(async (req, res) => {
    const publicacion = await servicioPublicacion.compartirPublicacion(
      req.params.id,
      req.usuario,
      req.body.comentario || ''
    );
    return respuestaExito(res, { publicacion }, 'Publicacion compartida correctamente.', 201);
  }),

  /** POST /api/publicaciones/:id/guardar (alterna guardado) */
  alternarGuardado: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.alternarGuardado(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/publicaciones/guardadas */
  listarGuardadas: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.listarGuardadas(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Publicaciones guardadas obtenidas correctamente.');
  }),

  /** DELETE /api/publicaciones/:id/imagen */
  eliminarImagen: asincrono(async (req, res) => {
    const publicacion = await servicioPublicacion.obtenerPublicacion(req.params.id, req.usuario._id);
    const ruta = req.body.ruta;

    if (!ruta || !publicacion.imagenes.includes(ruta)) {
      throw ErrorAplicacion.solicitudInvalida('La imagen indicada no pertenece a esta publicacion.');
    }

    const imagenes = publicacion.imagenes.filter((imagen) => imagen !== ruta);
    await servicioPublicacion.actualizarPublicacion(req.params.id, req.usuario, { imagenes });
    servicioArchivo.eliminar(ruta);

    return respuestaExito(res, { imagenes }, 'Imagen eliminada correctamente.');
  }),

  // ------------------------------------------------------------------
  // HISTORIAS
  // ------------------------------------------------------------------

  /** POST /api/publicaciones/historias */
  crearHistoria: asincrono(async (req, res) => {
    const imagen = req.file ? `/uploads/publicaciones/${req.file.filename}` : req.body.imagen || '';
    const historia = await servicioPublicacion.crearHistoria(req.usuario._id, {
      texto: req.body.texto || '',
      imagen,
      colorFondo: req.body.colorFondo || '#0b2039',
    });
    return respuestaExito(res, { historia }, 'Historia publicada. Estara visible por 24 horas.', 201);
  }),

  /** GET /api/publicaciones/historias */
  listarHistorias: asincrono(async (req, res) => {
    const historias = await servicioPublicacion.listarHistorias(req.usuario._id);
    return respuestaExito(res, { historias }, 'Historias obtenidas correctamente.');
  }),

  /** POST /api/publicaciones/historias/:id/visualizacion */
  registrarVisualizacion: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.registrarVisualizacionHistoria(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/publicaciones/historias/:id */
  eliminarHistoria: asincrono(async (req, res) => {
    const resultado = await servicioPublicacion.eliminarHistoria(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),
};

module.exports = { controladorPublicacion };
