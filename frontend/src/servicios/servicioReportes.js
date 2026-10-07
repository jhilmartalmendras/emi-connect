import api from './api';

export const servicioReportes = {
  /** Crea un reporte sobre publicacion, comentario, usuario, producto o comunidad. */
  async crear({ tipo, objetivoId, motivo, descripcion }) {
    const { data } = await api.post('/reportes', { tipo, objetivoId, motivo, descripcion });
    return data.datos;
  },

  /** Reportes creados por el usuario. */
  async listarMios(pagina = 1, limite = 20) {
    const { data } = await api.get('/reportes/mios', { params: { pagina, limite } });
    return data.datos;
  },

  /** Listado de reportes (administracion). */
  async listar({ pagina = 1, limite = 20, estado, tipo } = {}) {
    const { data } = await api.get('/reportes', { params: { pagina, limite, estado, tipo } });
    return data.datos;
  },

  /** Resuelve o rechaza un reporte (administracion). */
  async resolver(id, { estado, notaRevision, accion }) {
    const { data } = await api.patch(`/reportes/${id}`, { estado, notaRevision, accion });
    return data.datos;
  },
};
