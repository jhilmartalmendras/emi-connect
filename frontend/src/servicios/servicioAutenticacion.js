import api from './api';

/**
 * Funciones de la API relacionadas con la autenticacion institucional.
 * Todas devuelven directamente el objeto "datos" de la respuesta uniforme.
 */
export const servicioAutenticacion = {
  /** Registra una cuenta nueva (solo correo @est.emi.edu.bo). */
  async registrar(datos) {
    const { data } = await api.post('/auth/registro', datos);
    return data.datos;
  },

  /** Verifica la cuenta con el codigo de 6 digitos. */
  async verificar(correo, codigo) {
    const { data } = await api.post('/auth/verificar', { correo, codigo });
    return data.datos;
  },

  /** Reenvia el codigo de verificacion. */
  async reenviarCodigo(correo) {
    const { data } = await api.post('/auth/reenviar-codigo', { correo });
    return data.datos;
  },

  /** Inicia sesion y devuelve el token junto con los datos del usuario. */
  async iniciarSesion(correo, contrasena) {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    return data.datos;
  },

  /** Cierra la sesion en el servidor (el token se elimina en el cliente). */
  async cerrarSesion() {
    const { data } = await api.post('/auth/cerrar-sesion');
    return data.datos;
  },

  /** Obtiene los datos del usuario con la sesion activa. */
  async obtenerSesion() {
    const { data } = await api.get('/auth/sesion');
    return data.datos;
  },

  /** Paso 1 de recuperacion: envia el codigo al correo institucional. */
  async solicitarRecuperacion(correo) {
    const { data } = await api.post('/auth/recuperar', { correo });
    return data.datos;
  },

  /** Paso 2: valida el codigo y obtiene el token temporal. */
  async verificarRecuperacion(correo, codigo) {
    const { data } = await api.post('/auth/verificar-recuperacion', { correo, codigo });
    return data.datos;
  },

  /** Paso 3: cambia la contrasena con el token temporal. */
  async restablecerContrasena(datos) {
    const { data } = await api.post('/auth/restablecer', datos);
    return data.datos;
  },

  /** Cambio de contrasena desde la configuracion. */
  async cambiarContrasena(datos) {
    const { data } = await api.put('/auth/contrasena', datos);
    return data.datos;
  },

  /** Catalogos institucionales (carreras, unidades academicas, intereses). */
  async obtenerConfiguracion() {
    const { data } = await api.get('/auth/configuracion');
    return data.datos;
  },
};
