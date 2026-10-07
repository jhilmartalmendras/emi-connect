import api from './api';

export const servicioDescubrimiento = {
  /** Busqueda global en usuarios, publicaciones, comunidades, eventos y productos. */
  async buscar(texto, tipo = 'todo') {
    const { data } = await api.get('/busqueda', { params: { buscar: texto, tipo } });
    return data.datos;
  },

  /** Recomendaciones personalizadas por reglas de afinidad. */
  async obtenerRecomendaciones(parametros = {}) {
    const { data } = await api.get('/recomendaciones', { params: parametros });
    return data.datos;
  },

  /** Resumen para la pagina de inicio (recomendaciones + contadores propios). */
  async obtenerResumenInicio() {
    const { data } = await api.get('/resumen-inicio');
    return data.datos;
  },

  /** Consulta al asistente de EMI Connect (capa preparada para IA). */
  async consultarAsistente(consulta) {
    const { data } = await api.post('/asistente/consultar', { consulta });
    return data.datos;
  },

  /** Sugerencias rapidas del asistente. */
  async obtenerSugerenciasAsistente() {
    const { data } = await api.get('/asistente/sugerencias');
    return data.datos;
  },
};
