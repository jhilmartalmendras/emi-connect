const { servicioComunidad } = require('../servicios/servicioComunidad');
const { servicioArchivo } = require('../servicios/servicioArchivo');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');

const controladorComunidad = {
  /** GET /api/comunidades */
  listar: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.listarComunidades(req.query, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Comunidades obtenidas correctamente.');
  }),

  /** GET /api/comunidades/:id */
  obtener: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.obtenerComunidad(req.params.id, req.usuario?._id || null);
    return respuestaExito(res, resultado, 'Comunidad obtenida correctamente.');
  }),

  /** POST /api/comunidades */
  crear: asincrono(async (req, res) => {
    const imagen = req.files?.find?.((archivo) => archivo.fieldname === 'imagen');
    const portada = req.files?.find?.((archivo) => archivo.fieldname === 'portada');

    const comunidad = await servicioComunidad.crearComunidad(req.usuario, {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      categoria: req.body.categoria,
      reglas: req.body.reglas || [],
      esPrivada: req.body.esPrivada === true || req.body.esPrivada === 'true',
      imagen: imagen ? `/uploads/comunidades/${imagen.filename}` : req.body.imagen || '',
      portada: portada ? `/uploads/comunidades/${portada.filename}` : req.body.portada || '',
    });

    return respuestaExito(res, { comunidad }, 'Comunidad creada correctamente.', 201);
  }),

  /** PUT /api/comunidades/:id */
  actualizar: asincrono(async (req, res) => {
    const comunidad = await servicioComunidad.actualizarComunidad(req.params.id, req.usuario, req.body);
    return respuestaExito(res, { comunidad }, 'Comunidad actualizada correctamente.');
  }),

  /** DELETE /api/comunidades/:id */
  eliminar: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.eliminarComunidad(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/comunidades/:id/unirse */
  unirse: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.unirseComunidad(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/comunidades/:id/salir */
  salir: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.salirComunidad(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/comunidades/:id/miembros */
  listarMiembros: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.listarMiembros(req.params.id, req.query);
    return respuestaExito(res, resultado, 'Miembros obtenidos correctamente.');
  }),

  /** GET /api/comunidades/:id/solicitudes */
  listarSolicitudes: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.listarSolicitudes(req.params.id, req.usuario);
    return respuestaExito(res, resultado, 'Solicitudes obtenidas correctamente.');
  }),

  /** PATCH /api/comunidades/:id/solicitudes/:miembroId */
  gestionarSolicitud: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.gestionarSolicitud(
      req.params.id,
      req.params.miembroId,
      req.usuario,
      req.body.accion
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/comunidades/:id/invitaciones */
  invitar: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.invitarMiembro(
      req.params.id,
      req.usuario,
      req.body.usuarioId
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/comunidades/:id/amigos-invitables */
  amigosInvitables: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.listarAmigosInvitables(req.params.id, req.usuario._id);
    return respuestaExito(res, resultado, 'Amigos disponibles obtenidos correctamente.');
  }),

  /** DELETE /api/comunidades/:id/miembros/:usuarioId */
  expulsar: asincrono(async (req, res) => {
    const resultado = await servicioComunidad.expulsarMiembro(
      req.params.id,
      req.params.usuarioId,
      null,
      req.usuario
    );
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/comunidades/:id/imagen */
  subirImagen: asincrono(async (req, res) => {
    if (!req.file) throw ErrorAplicacion.solicitudInvalida('No se recibio ninguna imagen.');

    const tipo = req.body.tipo === 'portada' ? 'portada' : 'imagen';
    const ruta = `/uploads/comunidades/${req.file.filename}`;

    const comunidad = await servicioComunidad.actualizarComunidad(req.params.id, req.usuario, {
      [tipo]: ruta,
    });
    servicioArchivo.eliminar(tipo === 'portada' ? comunidad.portada : comunidad.imagen);

    return respuestaExito(res, { comunidad, ruta }, 'Imagen actualizada correctamente.');
  }),

  /** GET /api/comunidades/sugeridas */
  sugeridas: asincrono(async (req, res) => {
    const comunidades = await servicioComunidad.sugerirComunidades(req.usuario?._id || null, 5);
    return respuestaExito(res, { comunidades }, 'Comunidades sugeridas obtenidas correctamente.');
  }),
};

module.exports = { controladorComunidad };
