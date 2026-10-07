const { Router } = require('express');
const { body } = require('express-validator');
const { controladorBusqueda } = require('../controladores/controladorBusqueda');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { validarBusquedaGlobal } = require('../validaciones/validacionesContenido');

const enrutador = Router();

// Busqueda global: usuarios, publicaciones, comunidades, eventos y productos
enrutador.get('/busqueda', autenticacionOpcional, validarBusquedaGlobal, validarCampos, controladorBusqueda.buscar);

// Recomendaciones personalizadas (sistema de reglas preparado para IA)
enrutador.get('/recomendaciones', autenticar, controladorBusqueda.recomendaciones);

// Resumen de la pagina de inicio
enrutador.get('/resumen-inicio', autenticar, controladorBusqueda.resumenInicio);

// Asistente EMI Connect (capa preparada para IA)
enrutador.get('/asistente/sugerencias', autenticar, controladorBusqueda.sugerenciasAsistente);
enrutador.post(
  '/asistente/consultar',
  autenticar,
  body('consulta')
    .trim()
    .isLength({ min: 3, max: 300 })
    .withMessage('La consulta debe tener entre 3 y 300 caracteres.'),
  validarCampos,
  controladorBusqueda.consultarAsistente
);

module.exports = { rutasDescubrimiento: enrutador };
