const { Router } = require('express');
const { controladorReporte } = require('../controladores/controladorReporte');
const { autenticar } = require('../middlewares/autenticacion');
const { soloAdministracion } = require('../middlewares/autorizacion');
const { validarCampos } = require('../middlewares/validacion');
const { limitadorEscritura } = require('../middlewares/limitadores');
const { validarCrearReporte, validarResolverReporte } = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.post('/', autenticar, limitadorEscritura, validarCrearReporte, validarCampos, controladorReporte.crear);
enrutador.get('/mios', autenticar, validarPaginacion, validarCampos, controladorReporte.listarMios);

// Revision de reportes (solo moderadores y administradores)
enrutador.get('/', autenticar, soloAdministracion, validarPaginacion, validarCampos, controladorReporte.listar);
enrutador.patch(
  '/:id',
  autenticar,
  soloAdministracion,
  validarIdentificador(),
  validarResolverReporte,
  validarCampos,
  controladorReporte.resolver
);

module.exports = { rutasReportes: enrutador };
