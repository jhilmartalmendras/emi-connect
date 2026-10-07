const { body, param, query } = require('express-validator');
const { LISTA_ROLES } = require('../constantes/roles');
const {
  CATEGORIAS_PUBLICACION,
  TIPOS_REACCION,
  CATEGORIAS_PRODUCTO,
  ESTADOS_PRODUCTO,
  ESTADOS_REPORTE,
  TIPOS_REPORTE,
  MOTIVOS_REPORTE,
  ESTADOS_ASISTENCIA,
  NIVELES_PRIVACIDAD,
} = require('../constantes/catalogos');

/** Validacion de un identificador de MongoDB en la URL. */
const validarIdentificador = (nombre = 'id') =>
  param(nombre).isMongoId().withMessage('El identificador enviado no es valido.');

/** Validacion de paginacion reutilizable. */
const validarPaginacion = [
  query('pagina').optional().isInt({ min: 1 }).withMessage('La pagina debe ser un numero mayor o igual a 1.'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El limite debe estar entre 1 y 100.'),
];

/** Validacion de texto de busqueda. */
const validarBusqueda = [
  query('buscar')
    .optional()
    .isLength({ min: 2, max: 120 })
    .withMessage('El texto de busqueda debe tener entre 2 y 120 caracteres.'),
];

/** Validacion de contrasena segura y reutilizable. */
const validarContrasena = (campo = 'contrasena') =>
  body(campo)
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage('La contrasena debe tener al menos 8 caracteres.')
    .matches(/[A-Za-z]/)
    .withMessage('La contrasena debe incluir al menos una letra.')
    .matches(/[0-9]/)
    .withMessage('La contrasena debe incluir al menos un numero.');

module.exports = {
  validarIdentificador,
  validarPaginacion,
  validarBusqueda,
  validarContrasena,
  CATEGORIAS_PUBLICACION,
  TIPOS_REACCION,
  CATEGORIAS_PRODUCTO,
  ESTADOS_PRODUCTO,
  ESTADOS_REPORTE,
  TIPOS_REPORTE,
  MOTIVOS_REPORTE,
  ESTADOS_ASISTENCIA,
  NIVELES_PRIVACIDAD,
  LISTA_ROLES,
  body,
  param,
  query,
};
