const mongoose = require('mongoose');
const Usuario = require('../modelos/Usuario');
const { repositorioUsuario } = require('../repositorios/repositorioUsuario');
const { repositorioToken } = require('../repositorios/repositorioToken');
const { repositorioPrivacidad } = require('../repositorios/repositorioPrivacidad');
const { servicioCorreo } = require('./servicioCorreo');
const { servicioNotificacion } = require('./servicioNotificacion');
const { variablesEntorno } = require('../config/variablesEntorno');
const { ErrorAplicacion } = require('../utilidades/ErrorAplicacion');
const { generarTokenSesion, generarTokenRestablecimiento, verificarTokenRestablecimiento } = require('../utilidades/tokenJwt');
const { generarCodigoNumerico } = require('../utilidades/identificadores');
const { yaExpiro } = require('../utilidades/fechas');
const { ROLES } = require('../constantes/roles');

const MINUTOS_EXPIRACION_VERIFICACION = 15;
const MINUTOS_EXPIRACION_RECUPERACION = 30;
const MAX_INTENTOS_CODIGO = 5;

/**
 * Servicio de autenticacion.
 *
 * Regla institucional: unicamente se permiten cuentas con correo del dominio
 * configurado en DOMINIO_INSTITUCIONAL (por defecto @est.emi.edu.bo).
 */
const servicioAutenticacion = {
  /** Valida que el correo pertenezca al dominio institucional configurado. */
  validarCorreoInstitucional(correo) {
    const correoLimpio = String(correo || '').toLowerCase().trim();
    const dominio = variablesEntorno.dominioInstitucional;

    const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio);
    if (!formatoValido) {
      throw ErrorAplicacion.solicitudInvalida('El correo ingresado no tiene un formato valido');
    }
    if (!correoLimpio.endsWith(dominio)) {
      throw ErrorAplicacion.solicitudInvalida(
        `Solo se permiten correos institucionales que terminen en ${dominio}`
      );
    }
    return correoLimpio;
  },

  /**
   * Registra un usuario nuevo con correo institucional.
   * Devuelve el usuario creado y envia el codigo de verificacion por correo.
   */
  async registrarUsuario(datos, opciones = {}) {
    const correo = this.validarCorreoInstitucional(datos.correo);

    const existente = await repositorioUsuario.buscarPorCorreo(correo);
    if (existente) {
      throw ErrorAplicacion.conflicto('Este correo ya se encuentra registrado.');
    }

    const contrasenaCifrada = await Usuario.cifrarContrasena(datos.contrasena);

    const usuario = await repositorioUsuario.crear({
      nombres: String(datos.nombres).trim(),
      apellidos: String(datos.apellidos).trim(),
      correo,
      contrasena: contrasenaCifrada,
      rol: opciones.rol || ROLES.ESTUDIANTE,
      carrera: datos.carrera || '',
      semestre: datos.semestre || null,
      unidadAcademica: datos.unidadAcademica || '',
      fotoPerfil: datos.fotoPerfil || '',
      verificado: Boolean(opciones.verificadoAutomatico),
    });

    // Cada usuario nace con su configuracion de privacidad por defecto.
    await repositorioPrivacidad.obtenerOCrear(usuario._id);

    if (!opciones.verificadoAutomatico) {
      await this.enviarCodigoVerificacion(usuario);
    }

    return usuario.datosPublicos();
  },

  /** Genera e envia un nuevo codigo de verificacion de cuenta. */
  async enviarCodigoVerificacion(usuario) {
    const codigo = generarCodigoNumerico(6);

    await repositorioToken.invalidarAnteriores(usuario._id, 'verificacion');
    await repositorioToken.crear({
      usuario: usuario._id,
      correo: usuario.correo,
      codigo,
      tipo: 'verificacion',
      minutosExpiracion: MINUTOS_EXPIRACION_VERIFICACION,
      maxIntentos: MAX_INTENTOS_CODIGO,
    });

    const resultado = await servicioCorreo.enviarCodigoVerificacion({
      destino: usuario.correo,
      nombres: usuario.nombres,
      codigo,
      minutosExpiracion: MINUTOS_EXPIRACION_VERIFICACION,
    });

    // Ayuda de desarrollo: sin SMTP configurado el codigo se muestra en consola.
    if (!resultado.enviado || resultado.simulado) {
      console.log(`[verificacion] Codigo para ${usuario.correo}: ${codigo}`);
    }

    return { enviado: true, simulado: Boolean(resultado.simulado) };
  },

  /** Reenvia el codigo de verificacion a una cuenta no verificada. */
  async reenviarCodigoVerificacion(correo) {
    const correoLimpio = this.validarCorreoInstitucional(correo);
    const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio);

    if (!usuario) throw ErrorAplicacion.noEncontrado('No existe una cuenta registrada con este correo.');
    if (usuario.verificado) throw ErrorAplicacion.conflicto('Esta cuenta ya fue verificada.');
    if (usuario.bloqueado) throw ErrorAplicacion.prohibido('La cuenta se encuentra bloqueada.');

    return this.enviarCodigoVerificacion(usuario);
  },

  /** Verifica la cuenta con el codigo de 6 digitos. */
  async verificarCuenta({ correo, codigo }) {
    const correoLimpio = this.validarCorreoInstitucional(correo);
    const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio);
    if (!usuario) throw ErrorAplicacion.noEncontrado('No existe una cuenta registrada con este correo.');

    if (usuario.verificado) {
      return { verificado: true, mensaje: 'La cuenta ya estaba verificada.' };
    }

    const hash = repositorioToken.hashearCodigo(String(codigo || '').trim());
    const token = await repositorioToken.buscarVigentePorHash(hash, 'verificacion');

    if (!token || String(token.usuario) !== String(usuario._id)) {
      // Se registra el intento fallido sobre el token vigente del usuario.
      const tokenVigente = await repositorioToken.buscarPorUsuario(usuario._id, 'verificacion');
      if (tokenVigente) {
        const actualizado = await repositorioToken.incrementarIntentos(tokenVigente._id);
        if (actualizado && actualizado.intentos >= actualizado.maxIntentos) {
          await repositorioToken.marcarUsado(tokenVigente._id);
          throw ErrorAplicacion.solicitudInvalida(
            'Se agotaron los intentos permitidos. Solicita un nuevo codigo.'
          );
        }
      }
      throw ErrorAplicacion.solicitudInvalida('El codigo ingresado no es correcto o ya expiro.');
    }

    if (yaExpiro(token.expiraEn)) {
      throw ErrorAplicacion.solicitudInvalida('El codigo expiro. Solicita un nuevo codigo.');
    }

    await repositorioToken.marcarUsado(token._id);
    usuario.verificado = true;
    await usuario.save();

    await servicioNotificacion.crear({
      usuario: usuario._id,
      tipo: 'sistema',
      titulo: 'Cuenta verificada',
      mensaje: 'Tu cuenta fue verificada correctamente. Ya puedes usar EMI Connect.',
      enlace: '/inicio',
    });

    return { verificado: true, mensaje: 'Cuenta verificada correctamente.' };
  },

  /**
   * Inicia sesion con correo institucional y contrasena.
   * Devuelve el token JWT y los datos publicos del usuario.
   */
  async iniciarSesion({ correo, contrasena }) {
    const correoLimpio = this.validarCorreoInstitucional(correo);
    const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio, true);

    if (!usuario) {
      throw ErrorAplicacion.noAutorizado('Las credenciales ingresadas no son correctas.');
    }
    if (usuario.cuentaEliminada) {
      throw ErrorAplicacion.prohibido('Esta cuenta fue eliminada. Contacta al administrador.');
    }

    const contrasenaCorrecta = await usuario.compararContrasena(contrasena);
    if (!contrasenaCorrecta) {
      throw ErrorAplicacion.noAutorizado('Las credenciales ingresadas no son correctas.');
    }

    if (usuario.bloqueado) {
      throw ErrorAplicacion.prohibido(
        usuario.motivoBloqueo
          ? `Tu cuenta esta bloqueada: ${usuario.motivoBloqueo}`
          : 'Tu cuenta esta bloqueada. Contacta al administrador.'
      );
    }
    if (!usuario.activo) {
      throw ErrorAplicacion.prohibido('Tu cuenta esta desactivada. Contacta al administrador.');
    }
    if (!usuario.verificado) {
      // Se reenvia un codigo para que el usuario pueda completar la verificacion.
      await this.enviarCodigoVerificacion(usuario);
      throw new ErrorAplicacion(
        'Tu cuenta aun no fue verificada. Enviamos un nuevo codigo a tu correo institucional.',
        403,
        [{ campo: 'verificado', mensaje: 'cuenta_no_verificada', correo: usuario.correo }]
      );
    }

    usuario.fechaUltimaConexion = new Date();
    await usuario.save();

    const token = generarTokenSesion(usuario);
    return { token, usuario: usuario.datosPublicos() };
  },

  /**
   * Paso 1 de recuperacion: genera y envia el codigo.
   * Por seguridad siempre se responde el mismo mensaje exista o no la cuenta.
   */
  async solicitarRecuperacion(correo) {
    const mensajeGenerico =
      'Si el correo pertenece a una cuenta institucional, recibiras un codigo de recuperacion en tu bandeja.';

    let correoLimpio;
    try {
      correoLimpio = this.validarCorreoInstitucional(correo);
    } catch (error) {
      throw error;
    }

    const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio);
    if (!usuario || usuario.bloqueado || usuario.cuentaEliminada) {
      return { mensaje: mensajeGenerico, enviado: false };
    }

    const codigo = generarCodigoNumerico(6);
    await repositorioToken.invalidarAnteriores(usuario._id, 'recuperacion_contrasena');
    await repositorioToken.crear({
      usuario: usuario._id,
      correo: usuario.correo,
      codigo,
      tipo: 'recuperacion_contrasena',
      minutosExpiracion: MINUTOS_EXPIRACION_RECUPERACION,
      maxIntentos: MAX_INTENTOS_CODIGO,
    });

    const resultado = await servicioCorreo.enviarCodigoRecuperacion({
      destino: usuario.correo,
      nombres: usuario.nombres,
      codigo,
      minutosExpiracion: MINUTOS_EXPIRACION_RECUPERACION,
    });

    if (!resultado.enviado || resultado.simulado) {
      console.log(`[recuperacion] Codigo para ${usuario.correo}: ${codigo}`);
    }

    return { mensaje: mensajeGenerico, enviado: true };
  },

  /** Paso 2: valida el codigo y entrega un token temporal para cambiar la contrasena. */
  async verificarCodigoRecuperacion({ correo, codigo }) {
    const correoLimpio = this.validarCorreoInstitucional(correo);
    const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio);
    if (!usuario) throw ErrorAplicacion.solicitudInvalida('El codigo no es valido o ya expiro.');

    const hash = repositorioToken.hashearCodigo(String(codigo || '').trim());
    const token = await repositorioToken.buscarVigentePorHash(hash, 'recuperacion_contrasena');

    if (!token || String(token.usuario) !== String(usuario._id)) {
      const tokenVigente = await repositorioToken.buscarPorUsuario(usuario._id, 'recuperacion_contrasena');
      if (tokenVigente) {
        const actualizado = await repositorioToken.incrementarIntentos(tokenVigente._id);
        if (actualizado && actualizado.intentos >= actualizado.maxIntentos) {
          await repositorioToken.marcarUsado(tokenVigente._id);
          throw ErrorAplicacion.solicitudInvalida('Se agotaron los intentos. Solicita un nuevo codigo.');
        }
      }
      throw ErrorAplicacion.solicitudInvalida('El codigo no es valido o ya expiro.');
    }

    await repositorioToken.marcarUsado(token._id);
    const tokenTemporal = generarTokenRestablecimiento(usuario);

    return {
      tokenTemporal,
      mensaje: 'Codigo verificado. Ahora puedes definir tu nueva contrasena.',
    };
  },

  /**
   * Paso 3: cambia la contrasena usando el token temporal o el codigo vigente.
   */
  async restablecerContrasena({ tokenTemporal, correo, codigo, nuevaContrasena }) {
    let usuarioId = null;

    if (tokenTemporal) {
      const datos = verificarTokenRestablecimiento(tokenTemporal);
      usuarioId = datos.id;
    } else if (correo && codigo) {
      const correoLimpio = this.validarCorreoInstitucional(correo);
      const usuario = await repositorioUsuario.buscarPorCorreo(correoLimpio);
      if (!usuario) throw ErrorAplicacion.solicitudInvalida('El codigo no es valido o ya expiro.');

      const hash = repositorioToken.hashearCodigo(String(codigo).trim());
      const token = await repositorioToken.buscarVigentePorHash(hash, 'recuperacion_contrasena');
      if (!token || String(token.usuario) !== String(usuario._id)) {
        throw ErrorAplicacion.solicitudInvalida('El codigo no es valido o ya expiro.');
      }
      await repositorioToken.marcarUsado(token._id);
      usuarioId = usuario._id;
    } else {
      throw ErrorAplicacion.solicitudInvalida('Debes enviar el token temporal o el codigo de recuperacion.');
    }

    if (!mongoose.Types.ObjectId.isValid(String(usuarioId))) {
      throw ErrorAplicacion.solicitudInvalida('El identificador de usuario del token no es valido.');
    }

    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario) throw ErrorAplicacion.noEncontrado('La cuenta no existe.');
    if (usuario.bloqueado) throw ErrorAplicacion.prohibido('La cuenta se encuentra bloqueada.');

    usuario.contrasena = await Usuario.cifrarContrasena(nuevaContrasena);
    await usuario.save();

    // Se invalidan los demas tokens pendientes del usuario.
    await repositorioToken.invalidarAnteriores(usuario._id, 'recuperacion_contrasena');

    await servicioNotificacion.crear({
      usuario: usuario._id,
      tipo: 'sistema',
      titulo: 'Contrasena actualizada',
      mensaje: 'Tu contrasena fue cambiada correctamente.',
      enlace: '/inicio',
    });

    return { mensaje: 'Contrasena actualizada correctamente. Ya puedes iniciar sesion.' };
  },

  /** Cambio de contrasena desde la configuracion del usuario autenticado. */
  async cambiarContrasena(usuarioId, { contrasenaActual, nuevaContrasena }) {
    const usuario = await repositorioUsuario.buscarPorId(usuarioId, true);
    if (!usuario) throw ErrorAplicacion.noEncontrado('La cuenta no existe.');

    const esCorrecta = await usuario.compararContrasena(contrasenaActual);
    if (!esCorrecta) throw ErrorAplicacion.solicitudInvalida('La contrasena actual no es correcta.');

    usuario.contrasena = await Usuario.cifrarContrasena(nuevaContrasena);
    await usuario.save();

    return { mensaje: 'Contrasena actualizada correctamente.' };
  },

  /** Datos de la sesion actual: se consultan en cada carga de la aplicacion. */
  async obtenerSesion(usuarioId) {
    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario) throw ErrorAplicacion.noAutorizado('La sesion ya no es valida.');
    if (usuario.bloqueado || !usuario.activo || usuario.cuentaEliminada) {
      throw ErrorAplicacion.prohibido('Tu cuenta no esta habilitada para usar la plataforma.');
    }
    return usuario.datosPublicos();
  },
};

module.exports = { servicioAutenticacion };
