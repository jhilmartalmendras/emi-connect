const { Router } = require('express');
const { controladorComentario } = require('../controladores/controladorComentario');
const { controladorReaccion } = require('../controladores/controladorReaccion');
const { autenticar } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { limitadorEscritura } = require('../middlewares/limitadores');
const {
  validarActualizarComentario,
  validarReaccion,
} = require('../validaciones/validacionesContenido');
const { validarIdentificador } = require('../validaciones/validacionesComunes');

// ---------------------------------------------------------------- Comentarios
const rutasComentarios = Router();
rutasComentarios.put(
  '/:id',
  autenticar,
  limitadorEscritura,
  validarIdentificador(),
  validarActualizarComentario,
  validarCampos,
  controladorComentario.actualizar
);
rutasComentarios.delete(
  '/:id',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorComentario.eliminar
);

// ---------------------------------------------------------------- Reacciones
const rutasReacciones = Router();
rutasReacciones.post('/', autenticar, limitadorEscritura, validarReaccion, validarCampos, controladorReaccion.reaccionar);
rutasReacciones.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorReaccion.quitar);
rutasReacciones.get('/:id/resumen', autenticar, validarIdentificador(), validarCampos, controladorReaccion.resumen);

module.exports = { rutasComentarios, rutasReacciones };
