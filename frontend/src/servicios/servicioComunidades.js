import api, { crearFormulario } from './api';

export const servicioComunidades = {
  /** Lista comunidades con filtros (categoria, filtro=misComunidades). */
  async listar(parametros = {}) {
    const { data } = await api.get('/comunidades', { params: parametros });
    return data.datos;
  },

  /** Comunidades sugeridas para el usuario. */
  async listarSugeridas() {
    const { data } = await api.get('/comunidades/sugeridas');
    return data.datos;
  },

  /** Detalle de una comunidad. */
  async obtener(id) {
    const { data } = await api.get(`/comunidades/${id}`);
    return data.datos;
  },

  /** Crea una comunidad (acepta imagen y portada). */
  async crear({ nombre, descripcion, categoria, reglas, esPrivada, imagen, portada }) {
    const formulario = crearFormulario({
      nombre,
      descripcion,
      categoria,
      reglas,
      esPrivada,
      imagen,
      portada,
    });
    const { data } = await api.post('/comunidades', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Edita la comunidad. */
  async actualizar(id, cambios) {
    const { data } = await api.put(`/comunidades/${id}`, cambios);
    return data.datos;
  },

  /** Elimina la comunidad. */
  async eliminar(id) {
    const { data } = await api.delete(`/comunidades/${id}`);
    return data.datos;
  },

  /** Se une a la comunidad. */
  async unirse(id) {
    const { data } = await api.post(`/comunidades/${id}/unirse`);
    return data.datos;
  },

  /** Sale de la comunidad. */
  async salir(id) {
    const { data } = await api.delete(`/comunidades/${id}/salir`);
    return data.datos;
  },

  /** Miembros de la comunidad. */
  async listarMiembros(id, pagina = 1, limite = 30) {
    const { data } = await api.get(`/comunidades/${id}/miembros`, { params: { pagina, limite } });
    return data.datos;
  },

  /** Solicitudes pendientes de ingreso. */
  async listarSolicitudes(id) {
    const { data } = await api.get(`/comunidades/${id}/solicitudes`);
    return data.datos;
  },

  /** Aprueba o rechaza una solicitud. */
  async gestionarSolicitud(comunidadId, miembroId, accion) {
    const { data } = await api.patch(`/comunidades/${comunidadId}/solicitudes/${miembroId}`, { accion });
    return data.datos;
  },

  /** Amigos que aun pueden ser invitados. */
  async amigosInvitables(id) {
    const { data } = await api.get(`/comunidades/${id}/amigos-invitables`);
    return data.datos;
  },

  /** Invita a un usuario. */
  async invitar(id, usuarioId) {
    const { data } = await api.post(`/comunidades/${id}/invitaciones`, { usuarioId });
    return data.datos;
  },

  /** Expulsa a un miembro. */
  async expulsarMiembro(id, usuarioId) {
    const { data } = await api.delete(`/comunidades/${id}/miembros/${usuarioId}`);
    return data.datos;
  },

  /** Sube la imagen o portada de la comunidad. */
  async subirImagen(id, archivo, tipo = 'imagen') {
    const formulario = crearFormulario({ archivo, tipo });
    const { data } = await api.post(`/comunidades/${id}/imagen`, formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },
};
