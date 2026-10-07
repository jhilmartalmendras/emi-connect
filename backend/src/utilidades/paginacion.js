/**
 * Normaliza los parametros de paginacion recibidos por la API.
 * Nunca se carga la coleccion completa: siempre existe un limite maximo.
 */
function normalizarPaginacion(consulta = {}, limitePorDefecto = 10, limiteMaximo = 50) {
  const pagina = Math.max(1, Number.parseInt(consulta.pagina, 10) || 1);
  const limiteSolicitado = Number.parseInt(consulta.limite, 10) || limitePorDefecto;
  const limite = Math.min(Math.max(1, limiteSolicitado), limiteMaximo);

  return {
    pagina,
    limite,
    saltar: (pagina - 1) * limite,
  };
}

/**
 * Arma los metadatos de paginacion que se devuelven al frontend.
 */
function metadatosPaginacion(total, pagina, limite) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  return {
    total,
    pagina,
    limite,
    totalPaginas,
    hayPaginaSiguiente: pagina < totalPaginas,
    hayPaginaAnterior: pagina > 1,
  };
}

/**
 * Escapa caracteres especiales de una expresion regular para evitar
 * inyeccion de patrones en las busquedas.
 */
function escaparExpresionRegular(texto = '') {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { normalizarPaginacion, metadatosPaginacion, escaparExpresionRegular };
