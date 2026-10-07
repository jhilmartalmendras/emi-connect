const { Router } = require('express');
const { body } = require('express-validator');
const { controladorAmistad } = require('../controladores/controladorAmistad');
const { autenticar } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { limitadorEscritura } = require('../middlewares/limitadores');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/', autenticar, validarPaginacion, validarCampos, controladorAmistad.listarAmigos);

enrutador.post(
  '/solicitudes',
  autenticar,
  limitadorEscritura,
  body('usuarioId').isMongoId().withMessage('El usuario indicado no es valido.'),
  body('mensaje').optional().trim().isLength({ max: 200 }).withMessage('El mensaje es demasiado largo.'),
  validarCampos,
  controladorAmistad.enviarSolicitud
);

enrutador.get('/solicitudes/recibidas', autenticar, validarPaginacion, validarCampos, controladorAmistad.listarRecibidas);
enrutador.get('/solicitudes/enviadas', autenticar, validarPaginacion, validarCampos, controladorAmistad.listarEnviadas);

enrutador.patch('/solicitudes/:id/aceptar', autenticar, validarIdentificador(), validarCampos, controladorAmistad.aceptar);
enrutador.patch('/solicitudes/:id/rechazar', autenticar, validarIdentificador(), validarCampos, controladorAmistad.rechazar);
enrutador.patch('/solicitudes/:id/cancelar', autenticar, validarIdentificador(), validarCampos, controladorAmistad.cancelar);

enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorAmistad.eliminarAmistad);

module.exports = { rutasAmistades: enrutador };
