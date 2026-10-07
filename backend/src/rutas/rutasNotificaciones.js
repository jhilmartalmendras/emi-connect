const { Router } = require('express');
const { controladorNotificacion } = require('../controladores/controladorNotificacion');
const { autenticar } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/', autenticar, validarPaginacion, validarCampos, controladorNotificacion.listar);
enrutador.get('/contadores', autenticar, controladorNotificacion.contadores);
enrutador.patch('/leer-todas', autenticar, controladorNotificacion.marcarTodasLeidas);
enrutador.patch('/:id/leer', autenticar, validarIdentificador(), validarCampos, controladorNotificacion.marcarLeida);
enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorNotificacion.eliminar);

module.exports = { rutasNotificaciones: enrutador };
