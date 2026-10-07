const { Router } = require('express');
const { body } = require('express-validator');
const { controladorMensaje } = require('../controladores/controladorMensaje');
const { autenticar } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorMensajes, limitadorSubidas } = require('../middlewares/limitadores');
const { validarEnviarMensaje } = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/conversaciones', autenticar, validarPaginacion, validarCampos, controladorMensaje.listarConversaciones);
enrutador.post(
  '/conversaciones',
  autenticar,
  body('usuarioId').isMongoId().withMessage('El usuario indicado no es valido.'),
  validarCampos,
  controladorMensaje.abrirConversacion
);
enrutador.get(
  '/conversaciones/:id',
  autenticar,
  validarIdentificador(),
  validarPaginacion,
  validarCampos,
  controladorMensaje.listarMensajes
);
enrutador.patch(
  '/conversaciones/:id/leidos',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorMensaje.marcarLeidos
);
enrutador.delete(
  '/conversaciones/:id',
  autenticar,
  validarIdentificador(),
  validarCampos,
  controladorMensaje.eliminarConversacion
);

enrutador.get('/no-leidos', autenticar, controladorMensaje.contarNoLeidos);
enrutador.post('/', autenticar, limitadorMensajes, validarEnviarMensaje, validarCampos, controladorMensaje.enviar);

enrutador.post(
  '/imagen',
  autenticar,
  limitadorSubidas,
  crearSubida('publicaciones'),
  validarFirmaArchivos('publicaciones'),
  body('conversacionId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Conversacion invalida.'),
  body('destinatarioId')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Destinatario invalido.'),
  validarCampos,
  controladorMensaje.enviarImagen
);

module.exports = { rutasMensajes: enrutador };
