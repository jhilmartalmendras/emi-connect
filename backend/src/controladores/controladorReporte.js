const { servicioReporte } = require('../servicios/servicioReporte');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorReporte = {
  /** POST /api/reportes */
  crear: asincrono(async (req, res) => {
    const resultado = await servicioReporte.crearReporte(req.usuario, {
      tipo: req.body.tipo,
      objetivoId: req.body.objetivoId,
      motivo: req.body.motivo,
      descripcion: req.body.descripcion || '',
    });
    return respuestaExito(res, resultado, resultado.mensaje, 201);
  }),

  /** GET /api/reportes/mios */
  listarMios: asincrono(async (req, res) => {
    const resultado = await servicioReporte.listarMisReportes(req.usuario._id, req.query);
    return respuestaExito(res, resultado, 'Tus reportes fueron obtenidos correctamente.');
  }),

  /** GET /api/reportes (administracion) */
  listar: asincrono(async (req, res) => {
    const resultado = await servicioReporte.listarReportes(req.query, req.usuario);
    return respuestaExito(res, resultado, 'Reportes obtenidos correctamente.');
  }),

  /** PATCH /api/reportes/:id (administracion) */
  resolver: asincrono(async (req, res) => {
    const resultado = await servicioReporte.resolverReporte(req.params.id, req.usuario, {
      estado: req.body.estado,
      notaRevision: req.body.notaRevision || '',
      accion: req.body.accion || 'ninguna',
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),
};

module.exports = { controladorReporte };
