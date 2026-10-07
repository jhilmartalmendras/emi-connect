const { Router } = require('express');
const { controladorAutenticacion } = require('../controladores/controladorAutenticacion');
const { validarCampos } = require('../middlewares/validacion');
const { autenticar, autenticacionOpcional } = require('../middlewares/autenticacion');
const { limitadorAutenticacion, limitadorCorreo } = require('../middlewares/limitadores');
const {
  validarRegistro,
  validarVerificacion,
  validarReenvioCodigo,
  validarInicioSesion,
  validarRecuperacion,
  validarRestablecimiento,
  validarCambioContrasena,
} = require('../validaciones/validacionesAutenticacion');

const enrutador = Router();

// Registro con correo institucional (@est.emi.edu.bo)
enrutador.post('/registro', limitadorAutenticacion, validarRegistro, validarCampos, controladorAutenticacion.registrar);

// Verificacion de la cuenta con codigo de 6 digitos
enrutador.post('/verificar', limitadorAutenticacion, validarVerificacion, validarCampos, controladorAutenticacion.verificar);
enrutador.post(
  '/reenviar-codigo',
  limitadorCorreo,
  validarReenvioCodigo,
  validarCampos,
  controladorAutenticacion.reenviarCodigo
);

// Inicio y cierre de sesion
enrutador.post('/login', limitadorAutenticacion, validarInicioSesion, validarCampos, controladorAutenticacion.iniciarSesion);
enrutador.post('/cerrar-sesion', autenticacionOpcional, controladorAutenticacion.cerrarSesion);
enrutador.get('/sesion', autenticar, controladorAutenticacion.obtenerSesion);

// Recuperacion de contrasena en tres pasos
enrutador.post('/recuperar', limitadorCorreo, validarRecuperacion, validarCampos, controladorAutenticacion.solicitarRecuperacion);
enrutador.post(
  '/verificar-recuperacion',
  limitadorAutenticacion,
  validarVerificacion,
  validarCampos,
  controladorAutenticacion.verificarRecuperacion
);
enrutador.post(
  '/restablecer',
  limitadorAutenticacion,
  validarRestablecimiento,
  validarCampos,
  controladorAutenticacion.restablecerContrasena
);

// Cambio de contrasena del usuario autenticado
enrutador.put('/contrasena', autenticar, validarCambioContrasena, validarCampos, controladorAutenticacion.cambiarContrasena);

// Catalogos institucionales para los formularios
enrutador.get('/configuracion', controladorAutenticacion.obtenerConfiguracion);

module.exports = { rutasAutenticacion: enrutador };
