const { body } = require('express-validator');
const { validarContrasena } = require('./validacionesComunes');

const validarRegistro = [
  body('nombres')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio.')
    .isLength({ min: 2, max: 80 })
    .withMessage('El nombre debe tener entre 2 y 80 caracteres.')
    .matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s.'-]+$/)
    .withMessage('El nombre contiene caracteres no permitidos.'),
  body('apellidos')
    .trim()
    .notEmpty()
    .withMessage('El apellido es obligatorio.')
    .isLength({ min: 2, max: 80 })
    .withMessage('El apellido debe tener entre 2 y 80 caracteres.')
    .matches(/^[A-Za-zÁÉÍÓÚÑáéíóúñ\s.'-]+$/)
    .withMessage('El apellido contiene caracteres no permitidos.'),
  body('correo')
    .trim()
    .notEmpty()
    .withMessage('El correo institucional es obligatorio.')
    .isEmail()
    .withMessage('El correo institucional no es valido.')
    .normalizeEmail({ gmail_remove_dots: false }),
  validarContrasena('contrasena'),
  body('confirmarContrasena')
    .notEmpty()
    .withMessage('Debes confirmar la contrasena.')
    .custom((valor, { req }) => {
      if (valor !== req.body.contrasena) {
        throw new Error('Las contrasenas no coinciden.');
      }
      return true;
    }),
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
];

const validarVerificacion = [
  body('correo').trim().isEmail().withMessage('El correo institucional no es valido.'),
  body('codigo')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('El codigo de verificacion debe tener 6 digitos.')
    .isNumeric()
    .withMessage('El codigo de verificacion solo debe contener numeros.'),
];

const validarReenvioCodigo = [body('correo').trim().isEmail().withMessage('El correo institucional no es valido.')];

const validarInicioSesion = [
  body('correo').trim().isEmail().withMessage('El correo institucional no es valido.'),
  body('contrasena').notEmpty().withMessage('La contrasena es obligatoria.'),
];

const validarRecuperacion = [body('correo').trim().isEmail().withMessage('El correo institucional no es valido.')];

const validarRestablecimiento = [
  body('tokenTemporal').optional().isString(),
  body('correo').optional().trim().isEmail().withMessage('El correo institucional no es valido.'),
  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('El codigo debe tener 6 digitos.')
    .isNumeric()
    .withMessage('El codigo solo debe contener numeros.'),
  validarContrasena('nuevaContrasena'),
  body('confirmarContrasena')
    .notEmpty()
    .withMessage('Debes confirmar la nueva contrasena.')
    .custom((valor, { req }) => {
      if (valor !== req.body.nuevaContrasena) {
        throw new Error('Las contrasenas no coinciden.');
      }
      return true;
    }),
  body().custom((valor, { req }) => {
    if (!req.body.tokenTemporal && !(req.body.correo && req.body.codigo)) {
      throw new Error('Debes enviar el token temporal o el codigo de recuperacion.');
    }
    return true;
  }),
];

const validarCambioContrasena = [
  body('contrasenaActual').notEmpty().withMessage('La contrasena actual es obligatoria.'),
  validarContrasena('nuevaContrasena'),
  body('confirmarContrasena')
    .notEmpty()
    .withMessage('Debes confirmar la nueva contrasena.')
    .custom((valor, { req }) => {
      if (valor !== req.body.nuevaContrasena) {
        throw new Error('Las contrasenas no coinciden.');
      }
      return true;
    }),
];

module.exports = {
  validarRegistro,
  validarVerificacion,
  validarReenvioCodigo,
  validarInicioSesion,
  validarRecuperacion,
  validarRestablecimiento,
  validarCambioContrasena,
};
