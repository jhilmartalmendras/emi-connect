const { Router } = require('express');
const { controladorProducto } = require('../controladores/controladorProducto');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { crearSubida, validarFirmaArchivos } = require('../middlewares/subidaArchivos');
const { limitadorEscritura, limitadorSubidas } = require('../middlewares/limitadores');
const { validarCrearProducto, validarActualizarProducto } = require('../validaciones/validacionesContenido');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');

const enrutador = Router();

enrutador.get('/mios', autenticar, validarPaginacion, validarCampos, controladorProducto.listarMios);
enrutador.get('/', autenticacionOpcional, validarPaginacion, validarCampos, controladorProducto.listar);
enrutador.post(
  '/',
  autenticar,
  limitadorEscritura,
  crearSubida('productos', { maximo: 6 }),
  validarFirmaArchivos('productos'),
  validarCrearProducto,
  validarCampos,
  controladorProducto.crear
);

enrutador.get('/:id', autenticacionOpcional, validarIdentificador(), validarCampos, controladorProducto.obtener);
enrutador.put(
  '/:id',
  autenticar,
  validarIdentificador(),
  validarActualizarProducto,
  validarCampos,
  controladorProducto.actualizar
);
enrutador.delete('/:id', autenticar, validarIdentificador(), validarCampos, controladorProducto.eliminar);
enrutador.post('/:id/contactar', autenticar, validarIdentificador(), validarCampos, controladorProducto.contactar);

module.exports = { rutasProductos: enrutador };
