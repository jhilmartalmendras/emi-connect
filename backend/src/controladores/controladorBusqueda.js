const { servicioBusqueda } = require('../servicios/servicioBusqueda');
const { servicioRecomendacion } = require('../servicios/servicioRecomendacion');
const { servicioAsistenteIA } = require('../servicios/servicioAsistenteIA');
const { servicioEstadistica } = require('../servicios/servicioEstadistica');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');

const controladorBusqueda = {
  /** GET /api/busqueda */
  buscar: asincrono(async (req, res) => {
    const resultado = await servicioBusqueda.buscar(req.usuario?._id || null, req.query);
    return respuestaExito(res, resultado, 'Busqueda realizada correctamente.');
  }),

  /** GET /api/recomendaciones */
  recomendaciones: asincrono(async (req, res) => {
    const resultado = await servicioRecomendacion.obtenerRecomendaciones(req.usuario._id, {
      usuarios: Number(req.query.usuarios) || 5,
      comunidades: Number(req.query.comunidades) || 4,
      eventos: Number(req.query.eventos) || 4,
      publicaciones: Number(req.query.publicaciones) || 4,
    });
    return respuestaExito(res, resultado, 'Recomendaciones obtenidas correctamente.');
  }),

  /** GET /api/resumen-inicio (panel derecho y tarjetas del inicio) */
  resumenInicio: asincrono(async (req, res) => {
    const [recomendaciones, resumen, comunidadesSugeridas] = await Promise.all([
      servicioRecomendacion.obtenerRecomendaciones(req.usuario._id, {
        usuarios: 3,
        comunidades: 3,
        eventos: 2,
        publicaciones: 2,
      }),
      servicioEstadistica.obtenerResumenUsuario(req.usuario._id),
      servicioRecomendacion.recomendarComunidades(req.usuario._id, 4),
    ]);

    return respuestaExito(
      res,
      { recomendaciones, resumen, comunidadesSugeridas },
      'Resumen del inicio obtenido correctamente.'
    );
  }),

  // ------------------------------------------------------------------
  // ASISTENTE (preparacion para IA)
  // ------------------------------------------------------------------

  /** POST /api/asistente/consultar */
  consultarAsistente: asincrono(async (req, res) => {
    const resultado = await servicioAsistenteIA.responder(req.usuario._id, req.body.consulta);
    return respuestaExito(res, resultado, 'Consulta procesada correctamente.');
  }),

  /** GET /api/asistente/sugerencias */
  sugerenciasAsistente: asincrono(async (req, res) => {
    return respuestaExito(res, { sugerencias: servicioAsistenteIA.sugerencias() }, 'Sugerencias obtenidas.');
  }),
};

module.exports = { controladorBusqueda };
