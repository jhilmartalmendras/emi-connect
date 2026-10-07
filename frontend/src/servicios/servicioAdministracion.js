import api from './api';

export const servicioAdministracion = {
  /** Resumen general de la plataforma. */
  async obtenerResumen() {
    const { data } = await api.get('/admin/resumen');
    return data.datos;
  },

  /** Crecimiento y actividad reciente para las graficas y tablas. */
  async obtenerEstadisticas(dias = 30) {
    const { data } = await api.get('/admin/estadisticas', { params: { dias } });
    return data.datos;
  },

  /** Usuarios con filtros administrativos. */
  async listarUsuarios(parametros = {}) {
    const { data } = await api.get('/admin/usuarios', { params: parametros });
    return data.datos;
  },

  /** Bloquea o desbloquea un usuario. */
  async cambiarBloqueo(usuarioId, bloqueado, motivo = '') {
    const { data } = await api.patch(`/admin/usuarios/${usuarioId}/bloqueo`, { bloqueado, motivo });
    return data.datos;
  },

  /** Activa o desactiva una cuenta. */
  async cambiarEstado(usuarioId, activo) {
    const { data } = await api.patch(`/admin/usuarios/${usuarioId}/estado`, { activo });
    return data.datos;
  },

  /** Cambia el rol de un usuario. */
  async cambiarRol(usuarioId, rol) {
    const { data } = await api.patch(`/admin/usuarios/${usuarioId}/rol`, { rol });
    return data.datos;
  },

  /** Elimina un usuario de forma definitiva. */
  async eliminarUsuario(usuarioId) {
    const { data } = await api.delete(`/admin/usuarios/${usuarioId}`);
    return data.datos;
  },

  /** Publicaciones (incluye eliminadas). */
  async listarPublicaciones(parametros = {}) {
    const { data } = await api.get('/admin/publicaciones', { params: parametros });
    return data.datos;
  },

  /** Restaura una publicacion eliminada. */
  async restaurarPublicacion(id) {
    const { data } = await api.patch(`/admin/publicaciones/${id}/restaurar`);
    return data.datos;
  },

  /** Elimina definitivamente una publicacion. */
  async eliminarPublicacion(id) {
    const { data } = await api.delete(`/admin/publicaciones/${id}/definitivo`);
    return data.datos;
  },

  /** Comunidades para el panel. */
  async listarComunidades(parametros = {}) {
    const { data } = await api.get('/admin/comunidades', { params: parametros });
    return data.datos;
  },

  /** Activa o desactiva una comunidad. */
  async cambiarEstadoComunidad(id, activa) {
    const { data } = await api.patch(`/admin/comunidades/${id}/estado`, { activa });
    return data.datos;
  },

  /** Reportes pendientes. */
  async listarReportesPendientes() {
    const { data } = await api.get('/admin/reportes/pendientes');
    return data.datos;
  },
};
