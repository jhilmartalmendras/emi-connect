import api, { crearFormulario } from './api';

export const servicioMensajes = {
  /** Conversaciones del usuario ordenadas por actividad reciente. */
  async listarConversaciones(pagina = 1, limite = 30) {
    const { data } = await api.get('/mensajes/conversaciones', { params: { pagina, limite } });
    return data.datos;
  },

  /** Abre o crea la conversacion con un usuario. */
  async abrirConversacion(usuarioId) {
    const { data } = await api.post('/mensajes/conversaciones', { usuarioId });
    return data.datos;
  },

  /** Historial de mensajes de una conversacion. */
  async listarMensajes(conversacionId, pagina = 1, limite = 30) {
    const { data } = await api.get(`/mensajes/conversaciones/${conversacionId}`, { params: { pagina, limite } });
    return data.datos;
  },

  /** Envia un mensaje de texto. */
  async enviar({ conversacionId, destinatarioId, contenido }) {
    const { data } = await api.post('/mensajes', { conversacionId, destinatarioId, contenido });
    return data.datos;
  },

  /** Envia una imagen en la conversacion. */
  async enviarImagen({ conversacionId, destinatarioId, archivo, contenido = '' }) {
    const formulario = crearFormulario({ conversacionId, destinatarioId, contenido, archivo });
    const { data } = await api.post('/mensajes/imagen', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Marca los mensajes recibidos como leidos. */
  async marcarLeidos(conversacionId) {
    const { data } = await api.patch(`/mensajes/conversaciones/${conversacionId}/leidos`);
    return data.datos;
  },

  /** Cantidad total de mensajes sin leer. */
  async contarNoLeidos() {
    const { data } = await api.get('/mensajes/no-leidos');
    return data.datos;
  },

  /** Vacia una conversacion. */
  async eliminarConversacion(conversacionId) {
    const { data } = await api.delete(`/mensajes/conversaciones/${conversacionId}`);
    return data.datos;
  },
};
