const { Router } = require('express');
const { controladorAdmin } = require('../controladores/controladorAdmin');
const { autenticar } = require('../middlewares/autenticacion');
const { soloAdministracion, soloAdministrador } = require('../middlewares/autorizacion');
const { validarCampos } = require('../middlewares/validacion');
const { validarCambioRol } = require('../validaciones/validacionesUsuario');
const { validarIdentificador, validarPaginacion } = require('../validaciones/validacionesComunes');
const { body } = require('express-validator');

const enrutador = Router();

// Todas las rutas del panel requieren sesion y rol de moderador o administrador.
enrutador.use(autenticar, soloAdministracion);

// Resumen y estadisticas
enrutador.get('/resumen', controladorAdmin.resumen);
enrutador.get('/estadisticas', controladorAdmin.estadisticas);

// Gestion de usuarios
enrutador.get('/usuarios', validarPaginacion, validarCampos, controladorAdmin.listarUsuarios);
enrutador.patch(
  '/usuarios/:id/bloqueo',
  validarIdentificador(),
  body('bloqueado').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  validarCampos,
  controladorAdmin.bloquearUsuario
);
enrutador.patch(
  '/usuarios/:id/estado',
  validarIdentificador(),
  body('activo').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  validarCampos,
  controladorAdmin.cambiarEstadoUsuario
);
enrutador.patch(
  '/usuarios/:id/rol',
  soloAdministrador,
  validarIdentificador(),
  validarCambioRol,
  validarCampos,
  controladorAdmin.cambiarRol
);
enrutador.delete('/usuarios/:id', soloAdministrador, validarIdentificador(), validarCampos, controladorAdmin.eliminarUsuario);

// Gestion de publicaciones
enrutador.get('/publicaciones', validarPaginacion, validarCampos, controladorAdmin.listarPublicaciones);
enrutador.patch(
  '/publicaciones/:id/restaurar',
  validarIdentificador(),
  validarCampos,
  controladorAdmin.restaurarPublicacion
);
enrutador.delete(
  '/publicaciones/:id/definitivo',
  validarIdentificador(),
  validarCampos,
  controladorAdmin.eliminarPublicacionDefinitiva
);

// Gestion de comunidades
enrutador.get('/comunidades', validarPaginacion, validarCampos, controladorAdmin.listarComunidades);
enrutador.patch(
  '/comunidades/:id/estado',
  validarIdentificador(),
  body('activa').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  validarCampos,
  controladorAdmin.cambiarEstadoComunidad
);

// Reportes
enrutador.get('/reportes', validarPaginacion, validarCampos, controladorAdmin.listarReportes);
enrutador.get('/reportes/pendientes', controladorAdmin.reportesPendientes);

module.exports = { rutasAdmin: enrutador };
