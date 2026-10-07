const { Router } = require('express');
const { controladorPublicacion } = require('../controladores/controladorPublicacion');
const { controladorComentario } = require('../controladores/controladorComentario');
const { controladorReaccion } = require('../controladores/controladorReaccion');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorEscritura, limitadorSubidas } = require('../middlewares/limitadores');
const {
  validarCrearPublicacion,
  validarActualizarPublicacion,
  validarCompartir,
  validarCrearComentario,
  validarActualizarComentario,
  validarReaccion,
  validarCrearHistoria,
} = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

// ------------------------------------------------------------------ Historia (debe ir antes de /:id)
enrutador.get('/historias', autenticar, controladorPublicacion.listarHistorias);
enrutador.post(
  '/historias',
  autenticar,
  limitadorSubidas,
  crearSubida('publicaciones'),
  validarFirmaArchivos('publicaciones'),
  validarCrearHistoria,
  validarCampos,
  controladorPublicacion.crearHistoria
);
enrutador.post(
  '/historias/:id/visualizacion',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorPublicacion.registrarVisualizacion
);
enrutador.delete(
  '/historias/:id',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorPublicacion.eliminarHistoria
);

// ------------------------------------------------------------------ Publicaciones guardadas
enrutador.get('/guardadas', autenticar, validarPaginacion, validarCampos, controladorPublicacion.listarGuardadas);

// ------------------------------------------------------------------ Feed
enrutador.get('/', autenticar, validarPaginacion, validarCampos, controladorPublicacion.obtenerFeed);
enrutador.get('/explorar', autenticar, validarPaginacion, validarCampos, controladorPublicacion.explorar);

// ------------------------------------------------------------------ Crear publicacion (acepta imagenes)
enrutador.post(
  '/',
  autenticar,
  limitadorEscritura,
  crearSubida('publicaciones', { maximo: 10 }),
  validarFirmaArchivos('publicaciones'),
  validarCrearPublicacion,
  validarCampos,
  controladorPublicacion.crear
);

// ------------------------------------------------------------------ Listados por contexto
enrutador.get(
  '/usuario/:id',
  autenticacionOpcional,
  validarIdentificador(),
  validarPaginacion,
  validarCampos,
  controladorPublicacion.listarPorUsuario
);
enrutador.get(
  '/comunidad/:id',
  autenticacionOpcional,
  validarIdentificador(),
  validarPaginacion,
  validarCampos,
  controladorPublicacion.listarPorComunidad
);

// ------------------------------------------------------------------ Acciones sobre una publicacion
enrutador.get('/:id', autenticacionOpcional, validarIdentificador(), validarCampos, controladorPublicacion.obtener);
enrutador.put(
  '/:id',
  autenticar,
  validarIdentificador(),
  validarActualizarPublicacion,
  validarCampos,
  controladorPublicacion.actualizar
);
enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorPublicacion.eliminar);
enrutador.post(
  '/:id/compartir',
  autenticar,
  limitadorEscritura,
  validarIdentificador(),
  validarCompartir,
  validarCampos,
  controladorPublicacion.compartir
);
enrutador.post(
  '/:id/guardar',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorPublicacion.alternarGuardado
);
enrutador.delete(
  '/:id/imagen',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorPublicacion.eliminarImagen
);

// ------------------------------------------------------------------ Comentarios
enrutador.get(
  '/:id/comentarios',
  autenticacionOpcional,
  validarIdentificador(),
  validarPaginacion,
  validarCampos,
  controladorComentario.listarPorPublicacion
);
enrutador.post(
  '/:id/comentarios',
  autenticar,
  limitadorEscritura,
  validarIdentificador(),
  validarCrearComentario,
  validarCampos,
  controladorComentario.crear
);

// ------------------------------------------------------------------ Reacciones sobre publicaciones
enrutador.post(
  '/:id/reaccionar',
  autenticar,
  limitadorEscritura,
  validarIdentificador(),
  validarCampos,
  (req, res, next) => {
    req.body.objetivoId = req.params.id;
    req.body.objetivoModelo = 'Publicacion';
    return controladorReaccion.reaccionar(req, res, next);
  }
);

module.exports = { rutasPublicaciones: enrutador, validarReaccion };
