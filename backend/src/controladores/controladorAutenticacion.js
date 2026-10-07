const { servicioAutenticacion } = require('../servicios/servicioAutenticacion');
const { servicioUsuario } = require('../servicios/servicioUsuario');
const { asincrono } = require('../utilidades/asincrono');
const { respuestaExito } = require('../utilidades/respuesta');
const { configuracionInstitucional } = require('../config/institucional');
const { variablesEntorno } = require('../config/variablesEntorno');

/**
 * Controlador de autenticacion.
 * Solo traduce peticiones HTTP a llamadas de servicio y arma la respuesta.
 */
const controladorAutenticacion = {
  /** POST /api/auth/registro */
  registrar: asincrono(async (req, res) => {
    const usuario = await servicioAutenticacion.registrarUsuario({
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      correo: req.body.correo,
      contrasena: req.body.contrasena,
      carrera: req.body.carrera,
      semestre: req.body.semestre,
      unidadAcademica: req.body.unidadAcademica,
      fotoPerfil: req.body.fotoPerfil,
    });

    return respuestaExito(
      res,
      { usuario },
      'Cuenta creada correctamente. Revisa tu correo institucional para obtener el codigo de verificacion.',
      201
    );
  }),

  /** POST /api/auth/verificar */
  verificar: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.verificarCuenta({
      correo: req.body.correo,
      codigo: req.body.codigo,
    });

    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/auth/reenviar-codigo */
  reenviarCodigo: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.reenviarCodigoVerificacion(req.body.correo);
    return respuestaExito(
      res,
      resultado,
      'Enviamos un nuevo codigo de verificacion a tu correo institucional.'
    );
  }),

  /** POST /api/auth/login */
  iniciarSesion: asincrono(async (req, res) => {
    const { token, usuario } = await servicioAutenticacion.iniciarSesion({
      correo: req.body.correo,
      contrasena: req.body.contrasena,
    });

    return respuestaExito(res, { token, usuario }, `Bienvenido a ${configuracionInstitucional.nombrePlataforma}`);
  }),

  /** GET /api/auth/sesion */
  obtenerSesion: asincrono(async (req, res) => {
    const usuario = await servicioAutenticacion.obtenerSesion(req.usuario._id);
    return respuestaExito(res, { usuario }, 'Sesion activa.');
  }),

  /** POST /api/auth/cerrar-sesion */
  cerrarSesion: asincrono(async (req, res) => {
    // El token JWT no se puede invalidar sin lista negra; el frontend lo elimina.
    return respuestaExito(res, {}, 'Sesion cerrada correctamente.');
  }),

  /** POST /api/auth/recuperar */
  solicitarRecuperacion: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.solicitarRecuperacion(req.body.correo);
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/auth/verificar-recuperacion */
  verificarRecuperacion: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.verificarCodigoRecuperacion({
      correo: req.body.correo,
      codigo: req.body.codigo,
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** POST /api/auth/restablecer */
  restablecerContrasena: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.restablecerContrasena({
      tokenTemporal: req.body.tokenTemporal,
      correo: req.body.correo,
      codigo: req.body.codigo,
      nuevaContrasena: req.body.nuevaContrasena,
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** PUT /api/auth/contrasena */
  cambiarContrasena: asincrono(async (req, res) => {
    const resultado = await servicioAutenticacion.cambiarContrasena(req.usuario._id, {
      contrasenaActual: req.body.contrasenaActual,
      nuevaContrasena: req.body.nuevaContrasena,
    });
    return respuestaExito(res, resultado, resultado.mensaje);
  }),

  /** GET /api/auth/configuracion-institucional (catalogos para los formularios) */
  obtenerConfiguracion: asincrono(async (req, res) => {
    return respuestaExito(
      res,
      {
        nombreInstitucion: configuracionInstitucional.nombreInstitucion,
        siglas: configuracionInstitucional.siglasInstitucion,
        plataforma: configuracionInstitucional.nombrePlataforma,
        dominioInstitucional: variablesEntorno.dominioInstitucional,
        carreras: configuracionInstitucional.carreras,
        unidadesAcademicas: configuracionInstitucional.unidadesAcademicas,
        semestres: configuracionInstitucional.semestres,
        intereses: configuracionInstitucional.intereses,
      },
      'Configuracion institucional cargada.'
    );
  }),

  /** GET /api/auth/privacidad */
  obtenerPrivacidad: asincrono(async (req, res) => {
    const privacidad = await servicioUsuario.obtenerPrivacidad(req.usuario._id);
    return respuestaExito(res, { privacidad }, 'Configuracion de privacidad cargada.');
  }),
};

module.exports = { controladorAutenticacion };
