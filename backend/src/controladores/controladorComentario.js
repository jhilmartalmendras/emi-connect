const { servicioComentario } = require('../servicios/servicioComentario');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorComentario = {
  /** GET /api/comentarios/publicacion/:id */
  listarPorPublicacion: asincrono(async (req, res) => {
    const resultado = await servicioComentario.listarComentarios(
      req.params.id,
      req.usuario?._id || null,
      req.query
    );
    return respuestaExito(res, resultado, 'Comentarios obtenidos correctamente.');
  }),

  /** POST /api/comentarios/publicacion/:id */
  crear: asincrono(async (req, res) => {
    const comentario = await servicioComentario.crearComentario(req.usuario, {
      publicacionId: req.params.id,
      contenido: req.body.contenido,
      comentarioPadreId: req.body.comentarioPadreId || null,
    });
    return respuestaExito(res, { comentario }, 'Comentario publicado correctamente.', 201);
  }),

  /** PUT /api/comentarios/:id */
  actualizar: asincrono(async (req, res) => {
    const comentario = await servicioComentario.actualizarComentario(
      req.params.id,
      req.usuario,
      req.body.contenido
    );
    return respuestaExito(res, { comentario }, 'Comentario actualizado correctamente.');
  }),

  /** DELETE /api/comentarios/:id */
  eliminar: asincrono(async (req, res) => {
    const resultado = await servicioComentario.eliminarComentario(req.params.id, req.usuario);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),
};

module.exports = { controladorComentario };
