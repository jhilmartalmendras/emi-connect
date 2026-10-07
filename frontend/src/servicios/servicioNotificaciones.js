import api from './api';

export const servicioNotificaciones = {
  /** Notificaciones del usuario (paginadas). */
  async listar({ pagina = 1, limite = 20, soloNoLeidas = false } = {}) {
    const { data } = await api.get('/notificaciones', { params: { pagina, limite, soloNoLeidas } });
    return data.datos;
  },

  /** Contadores de la barra superior: notificaciones, solicitudes y mensajes. */
  async obtenerContadores() {
    const { data } = await api.get('/notificaciones/contadores');
    return data.datos;
  },

  async marcarLeida(id) {
    const { data } = await api.patch(`/notificaciones/${id}/leer`);
    return data.datos;
  },

  async marcarTodasLeidas() {
    const { data } = await api.patch('/notificaciones/leer-todas');
    return data.datos;
  },

  async eliminar(id) {
    const { data } = await api.delete(`/notificaciones/${id}`);
    return data.datos;
  },
};
