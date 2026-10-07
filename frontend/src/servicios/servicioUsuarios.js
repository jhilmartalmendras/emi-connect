import api, { crearFormulario } from './api';

export const servicioUsuarios = {
  /** Perfil publico de un usuario. */
  async obtenerPerfil(id) {
    const { data } = await api.get(`/usuarios/perfil/${id}`);
    return data.datos;
  },

  /** Perfil del usuario autenticado. */
  async obtenerMiPerfil() {
    const { data } = await api.get('/usuarios/mi-perfil');
    return data.datos;
  },

  /** Actualiza los datos del perfil. */
  async actualizarMiPerfil(cambios) {
    const { data } = await api.put('/usuarios/mi-perfil', cambios);
    return data.datos;
  },

  /** Sube la foto de perfil. */
  async subirFotoPerfil(archivo) {
    const formulario = crearFormulario({ archivo });
    const { data } = await api.post('/usuarios/mi-perfil/foto', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Sube la foto de portada. */
  async subirFotoPortada(archivo) {
    const formulario = crearFormulario({ archivo });
    const { data } = await api.post('/usuarios/mi-perfil/portada', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Directorio de usuarios con filtros. */
  async listarUsuarios(filtros = {}) {
    const { data } = await api.get('/usuarios', { params: filtros });
    return data.datos;
  },

  /** Configuracion de privacidad del usuario. */
  async obtenerPrivacidad() {
    const { data } = await api.get('/usuarios/privacidad');
    return data.datos;
  },

  /** Actualiza la configuracion de privacidad. */
  async actualizarPrivacidad(cambios) {
    const { data } = await api.put('/usuarios/privacidad', cambios);
    return data.datos;
  },

  /** Bloquea a un usuario. */
  async bloquearUsuario(id, motivo = '') {
    const { data } = await api.post(`/usuarios/bloqueos/${id}`, { motivo });
    return data.datos;
  },

  /** Desbloquea a un usuario. */
  async desbloquearUsuario(id) {
    const { data } = await api.delete(`/usuarios/bloqueos/${id}`);
    return data.datos;
  },

  /** Lista de usuarios bloqueados. */
  async listarBloqueados() {
    const { data } = await api.get('/usuarios/bloqueos');
    return data.datos;
  },

  /** Desactiva la propia cuenta. */
  async desactivarCuenta() {
    const { data } = await api.delete('/usuarios/mi-perfil');
    return data.datos;
  },
};
