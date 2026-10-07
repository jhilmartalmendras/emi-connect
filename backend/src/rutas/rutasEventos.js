const { Router } = require('express');
const { controladorEvento } = require('../controladores/controladorEvento');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorEscritura, limitadorSubidas } = require('../middlewares/limitadores');
const { validarCrearEvento, validarAsistencia } = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/proximos', autenticacionOpcional, controladorEvento.proximos);
enrutador.get('/', autenticacionOpcional, validarPaginacion, validarCampos, controladorEvento.listar);
enrutador.post(
  '/',
  autenticar,
  limitadorEscritura,
  validarCrearEvento,
  validarCampos,
  controladorEvento.crear
);

enrutador.get('/:id', autenticacionOpcional, validarIdentificador(), validarCampos, controladorEvento.obtener);
enrutador.put('/:id', autenticar, validarIdentificador(), validarCampos, controladorEvento.actualizar);
enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorEvento.eliminar);

enrutador.post(
  '/:id/asistencia',
  autenticar,
  validarIdentificador(),
  validarAsistencia,
  validarCampos,
  controladorEvento.confirmarAsistencia
);

enrutador.post(
  '/:id/imagen',
  autenticar,
  limitadorSubidas,
  validarIdentificador(),
  crearSubida('eventos'),
  validarFirmaArchivos('eventos'),
  controladorEvento.subirImagen
);

module.exports = { rutasEventos: enrutador };
