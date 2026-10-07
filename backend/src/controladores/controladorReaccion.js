const { servicioReaccion } = require('../servicios/servicioReaccion');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorReaccion = {
  /** POST /api/reacciones */
  reaccionar: asincrono(async (req, res) => {
    const resultado = await servicioReaccion.reaccionar(req.usuario, {
      objetivoId: req.body.objetivoId,
      objetivoModelo: req.body.objetivoModelo || 'Publicacion',
      tipo: req.body.tipo,
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** DELETE /api/reacciones/:id (retira la reaccion de un objetivo) */
  quitar: asincrono(async (req, res) => {
    const resultado = await servicioReaccion.quitarReaccion(req.usuario._id, {
      objetivoId: req.params.id,
      objetivoModelo: req.query.objetivoModelo || 'Publicacion',
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/reacciones/:id/resumen */
  resumen: asincrono(async (req, res) => {
    const resumen = await servicioReaccion.obtenerResumen(req.params.id);
    return respuestaExito(res, resumen, 'Resumen de reacciones obtenido.');
  }),
};

module.exports = { controladorReaccion };
