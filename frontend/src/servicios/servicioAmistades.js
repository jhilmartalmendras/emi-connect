import api from './api';

export const servicioAmistades = {
  /** Lista de amigos confirmados. */
  async listarAmigos(pagina = 1, limite = 20) {
    const { data } = await api.get('/amistades', { params: { pagina, limite } });
    return data.datos;
  },

  /** Solicitudes recibidas pendientes. */
  async listarRecibidas(pagina = 1, limite = 20) {
    const { data } = await api.get('/amistades/solicitudes/recibidas', { params: { pagina, limite } });
    return data.datos;
  },

  /** Solicitudes enviadas. */
  async listarEnviadas(pagina = 1, limite = 20) {
    const { data } = await api.get('/amistades/solicitudes/enviadas', { params: { pagina, limite } });
    return data.datos;
  },

  /** Envia una solicitud de amistad. */
  async enviarSolicitud(usuarioId, mensaje = '') {
    const { data } = await api.post('/amistades/solicitudes', { usuarioId, mensaje });
    return data.datos;
  },

  async aceptarSolicitud(id) {
    const { data } = await api.patch(`/amistades/solicitudes/${id}/aceptar`);
    return data.datos;
  },

  async rechazarSolicitud(id) {
    const { data } = await api.patch(`/amistades/solicitudes/${id}/rechazar`);
    return data.datos;
  },

  async cancelarSolicitud(id) {
    const { data } = await api.patch(`/amistades/solicitudes/${id}/cancelar`);
    return data.datos;
  },

  /** Elimina una amistad existente. */
  async eliminarAmistad(usuarioId) {
    const { data } = await api.delete(`/amistades/${usuarioId}`);
    return data.datos;
  },
};
