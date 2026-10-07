import api, { crearFormulario } from './api';

export const servicioEventos = {
  /** Lista de eventos con filtros. */
  async listar(parametros = {}) {
    const { data } = await api.get('/eventos', { params: parametros });
    return data.datos;
  },

  /** Eventos proximos (panel derecho del inicio). */
  async listarProximos(limite = 5) {
    const { data } = await api.get('/eventos/proximos', { params: { limite } });
    return data.datos;
  },

  /** Detalle del evento con asistentes y mi asistencia. */
  async obtener(id) {
    const { data } = await api.get(`/eventos/${id}`);
    return data.datos;
  },

  /** Crea un evento (acepta imagen). */
  async crear(datos) {
    const formulario = crearFormulario({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fecha: datos.fecha,
      horaFin: datos.horaFin,
      ubicacion: datos.ubicacion,
      categoria: datos.categoria,
      cupos: datos.cupos,
      esInstitucional: datos.esInstitucional,
      comunidad: datos.comunidad,
      archivo: datos.imagen,
    });
    const { data } = await api.post('/eventos', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Edita o cancela un evento. */
  async actualizar(id, cambios) {
    const { data } = await api.put(`/eventos/${id}`, cambios);
    return data.datos;
  },

  /** Elimina un evento. */
  async eliminar(id) {
    const { data } = await api.delete(`/eventos/${id}`);
    return data.datos;
  },

  /** Confirma la asistencia con estado: asistire | interesado | no_asistire. */
  async confirmarAsistencia(id, estado) {
    const { data } = await api.post(`/eventos/${id}/asistencia`, { estado });
    return data.datos;
  },
};
