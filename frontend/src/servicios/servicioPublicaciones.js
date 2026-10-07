import api, { crearFormulario } from './api';

export const servicioPublicaciones = {
  /** Feed personalizado del usuario. */
  async obtenerFeed(pagina = 1, limite = 10, categoria = '') {
    const { data } = await api.get('/publicaciones', { params: { pagina, limite, categoria } });
    return data.datos;
  },

  /** Publicaciones publicas recientes (explorar). */
  async explorar(pagina = 1, limite = 10) {
    const { data } = await api.get('/publicaciones/explorar', { params: { pagina, limite } });
    return data.datos;
  },

  /** Detalle de una publicacion. */
  async obtener(id) {
    const { data } = await api.get(`/publicaciones/${id}`);
    return data.datos;
  },

  /** Publicaciones de un usuario. */
  async listarPorUsuario(usuarioId, pagina = 1, limite = 10) {
    const { data } = await api.get(`/publicaciones/usuario/${usuarioId}`, { params: { pagina, limite } });
    return data.datos;
  },

  /** Publicaciones de una comunidad. */
  async listarPorComunidad(comunidadId, pagina = 1, limite = 10) {
    const { data } = await api.get(`/publicaciones/comunidad/${comunidadId}`, { params: { pagina, limite } });
    return data.datos;
  },

  /** Crea una publicacion (acepta imagenes). */
  async crear({ contenido, categoria, imagenes, comunidad, etiquetas }) {
    const formulario = crearFormulario({
      contenido,
      categoria,
      comunidad,
      etiquetas,
      archivo: imagenes || [],
    });
    const { data } = await api.post('/publicaciones', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Edita el contenido de una publicacion propia. */
  async actualizar(id, cambios) {
    const { data } = await api.put(`/publicaciones/${id}`, cambios);
    return data.datos;
  },

  /** Elimina una publicacion. */
  async eliminar(id, motivo = '') {
    const { data } = await api.delete(`/publicaciones/${id}`, { data: { motivo } });
    return data.datos;
  },

  /** Comparte una publicacion. */
  async compartir(id, comentario = '') {
    const { data } = await api.post(`/publicaciones/${id}/compartir`, { comentario });
    return data.datos;
  },

  /** Guarda o quita una publicacion de guardados. */
  async alternarGuardado(id) {
    const { data } = await api.post(`/publicaciones/${id}/guardar`);
    return data.datos;
  },

  /** Lista las publicaciones guardadas. */
  async listarGuardadas(pagina = 1, limite = 10) {
    const { data } = await api.get('/publicaciones/guardadas', { params: { pagina, limite } });
    return data.datos;
  },

  // ------------------------------------------------------------ Comentarios
  async listarComentarios(publicacionId, pagina = 1, limite = 15) {
    const { data } = await api.get(`/publicaciones/${publicacionId}/comentarios`, { params: { pagina, limite } });
    return data.datos;
  },

  async comentar(publicacionId, contenido, comentarioPadreId = null) {
    const { data } = await api.post(`/publicaciones/${publicacionId}/comentarios`, {
      contenido,
      comentarioPadreId,
    });
    return data.datos;
  },

  async actualizarComentario(comentarioId, contenido) {
    const { data } = await api.put(`/comentarios/${comentarioId}`, { contenido });
    return data.datos;
  },

  async eliminarComentario(comentarioId) {
    const { data } = await api.delete(`/comentarios/${comentarioId}`);
    return data.datos;
  },

  // ------------------------------------------------------------ Reacciones
  async reaccionar(objetivoId, tipo, objetivoModelo = 'Publicacion') {
    const { data } = await api.post('/reacciones', { objetivoId, objetivoModelo, tipo });
    return data.datos;
  },

  async quitarReaccion(objetivoId, objetivoModelo = 'Publicacion') {
    const { data } = await api.delete(`/reacciones/${objetivoId}`, { params: { objetivoModelo } });
    return data.datos;
  },

  // ------------------------------------------------------------ Historias
  async listarHistorias() {
    const { data } = await api.get('/publicaciones/historias');
    return data.datos;
  },

  async crearHistoria({ texto, imagen }) {
    const formulario = crearFormulario({ texto, archivo: imagen });
    const { data } = await api.post('/publicaciones/historias', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  async verHistoria(id) {
    const { data } = await api.post(`/publicaciones/historias/${id}/visualizacion`);
    return data.datos;
  },

  async eliminarHistoria(id) {
    const { data } = await api.delete(`/publicaciones/historias/${id}`);
    return data.datos;
  },
};
