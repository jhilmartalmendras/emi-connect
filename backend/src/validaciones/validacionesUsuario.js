const { body } = require('express-validator');
const { NIVELES_PRIVACIDAD, LISTA_ROLES } = require('./validacionesComunes');

const validarActualizacionPerfil = [
  body('nombres')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres.'),
  body('apellidos')
    .optional()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('El apellido debe tener entre 2 y 80 caracteres.'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La descripcion no debe superar los 500 caracteres.'),
  body('carrera').optional().trim().isLength({ max: 120 }).withMessage('La carrera es demasiado larga.'),
  body('semestre')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1, max: 12 })
    .withMessage('El semestre debe estar entre 1 y 12.'),
  body('unidadAcademica')
    .optional()
    .trim()
    .isLength({ max: 120 })
    .withMessage('La unidad academica es demasiado larga.'),
  body('intereses')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Los intereses deben ser una lista de hasta 20 elementos.'),
  body('intereses.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Cada interes debe tener entre 2 y 60 caracteres.'),
];

const validarPrivacidad = [
  body('visibilidadPerfil').optional().isIn(NIVELES_PRIVACIDAD).withMessage('Valor de privacidad no valido.'),
  body('visibilidadPublicaciones')
    .optional()
    .isIn(NIVELES_PRIVACIDAD)
    .withMessage('Valor de privacidad no valido.'),
  body('quienPuedeEnviarSolicitudes')
    .optional()
    .isIn(NIVELES_PRIVACIDAD)
    .withMessage('Valor de privacidad no valido.'),
  body('quienPuedeEnviarMensajes')
    .optional()
    .isIn(NIVELES_PRIVACIDAD)
    .withMessage('Valor de privacidad no valido.'),
  body('quienPuedeVerAmigos').optional().isIn(NIVELES_PRIVACIDAD).withMessage('Valor de privacidad no valido.'),
  body('quienPuedeVerComunidades')
    .optional()
    .isIn(NIVELES_PRIVACIDAD)
    .withMessage('Valor de privacidad no valido.'),
  body('mostrarCorreo').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  body('mostrarSemestre').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  body('permitirEtiquetas').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  body('aparecerEnBusquedas').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
  body('recibirNotificaciones').optional().isBoolean().withMessage('El valor debe ser verdadero o falso.'),
];

const validarBloqueo = [
  body('motivo').optional().trim().isLength({ max: 200 }).withMessage('El motivo es demasiado largo.'),
];

const validarCambioRol = [
  body('rol').isIn(LISTA_ROLES).withMessage('El rol indicado no es valido.'),
];

module.exports = { validarActualizacionPerfil, validarPrivacidad, validarBloqueo, validarCambioRol };
