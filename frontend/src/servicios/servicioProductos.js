import api, { crearFormulario } from './api';

export const servicioProductos = {
  /** Lista productos con filtros (categoria, estado, precio, busqueda). */
  async listar(parametros = {}) {
    const { data } = await api.get('/productos', { params: parametros });
    return data.datos;
  },

  /** Productos publicados por el usuario. */
  async listarMios(pagina = 1, limite = 12) {
    const { data } = await api.get('/productos/mios', { params: { pagina, limite } });
    return data.datos;
  },

  /** Detalle del producto. */
  async obtener(id) {
    const { data } = await api.get(`/productos/${id}`);
    return data.datos;
  },

  /** Publica un producto (acepta imagenes). */
  async crear(datos) {
    const formulario = crearFormulario({
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      precio: datos.precio,
      moneda: datos.moneda,
      esNegociable: datos.esNegociable,
      categoria: datos.categoria,
      ubicacion: datos.ubicacion,
      archivo: datos.imagenes || [],
    });
    const { data } = await api.post('/productos', formulario, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.datos;
  },

  /** Edita un producto propio. */
  async actualizar(id, cambios) {
    const { data } = await api.put(`/productos/${id}`, cambios);
    return data.datos;
  },

  /** Elimina un producto propio. */
  async eliminar(id) {
    const { data } = await api.delete(`/productos/${id}`);
    return data.datos;
  },

  /** Registra el interes en un producto y notifica al vendedor. */
  async contactarVendedor(id, mensaje = '') {
    const { data } = await api.post(`/productos/${id}/contactar`, { mensaje });
    return data.datos;
  },
};
