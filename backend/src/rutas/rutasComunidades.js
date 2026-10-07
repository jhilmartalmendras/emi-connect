const { Router } = require('express');
const { body } = require('express-validator');
const { controladorComunidad } = require('../controladores/controladorComunidad');
const { controladorPublicacion } = require('../controladores/controladorPublicacion');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorEscritura, limitadorSubidas } = require('../middlewares/limitadores');
const { validarCrearComunidad, validarActualizarComunidad } = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/sugeridas', autenticar, controladorComunidad.sugeridas);
enrutador.get('/', autenticacionOpcional, validarPaginacion, validarCampos, controladorComunidad.listar);
enrutador.post(
  '/',
  autenticar,
  limitadorEscritura,
  validarCrearComunidad,
  validarCampos,
  controladorComunidad.crear
);

enrutador.get('/:id', autenticacionOpcional, validarIdentificador(), validarCampos, controladorComunidad.obtener);
enrutador.put(
  '/:id',
  autenticar,
  validarIdentificador(),
  validarActualizarComunidad,
  validarCampos,
  controladorComunidad.actualizar
);
enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorComunidad.eliminar);

enrutador.post('/:id/unirse', autenticar, validarIdentificador(), validarCampos, controladorComunidad.unirse);
enrutador.delete('/:id/salir', autenticar, validarIdentificador(), validarCampos, controladorComunidad.salir);

enrutador.get('/:id/miembros', validarIdentificador(), validarPaginacion, validarCampos, controladorComunidad.listarMiembros);
enrutador.delete(
  '/:id/miembros/:usuarioId',
  autenticar,
  validarIdentificador('id'),
  validarIdentificador('usuarioId'),
  validarCampos,
  controladorComunidad.expulsar
);

enrutador.get('/:id/solicitudes', autenticar, validarIdentificador(), validarCampos, controladorComunidad.listarSolicitudes);
enrutador.patch(
  '/:id/solicitudes/:miembroId',
  autenticar,
  validarIdentificador('id'),
  validarIdentificador('miembroId'),
  body('accion').isIn(['aprobar', 'rechazar']).withMessage('La accion indicada no es valida.'),
  validarCampos,
  controladorComunidad.gestionarSolicitud
);

enrutador.get('/:id/amigos-invitables', autenticar, validarIdentificador(), validarCampos, controladorComunidad.amigosInvitables);
enrutador.post(
  '/:id/invitaciones',
  autenticar,
  validarIdentificador(),
  body('usuarioId').isMongoId().withMessage('El usuario indicado no es valido.'),
  validarCampos,
  controladorComunidad.invitar
);

enrutador.post(
  '/:id/imagen',
  autenticar,
  limitadorSubidas,
  validarIdentificador(),
  crearSubida('comunidades'),
  validarFirmaArchivos('comunidades'),
  controladorComunidad.subirImagen
);

// Publicaciones dentro de una comunidad
enrutador.get(
  '/:id/publicaciones',
  autenticacionOpcional,
  validarIdentificador(),
  validarPaginacion,
  validarCampos,
  controladorPublicacion.listarPorComunidad
);

module.exports = { rutasComunidades: enrutador };
