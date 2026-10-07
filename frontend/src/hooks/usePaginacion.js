import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga paginas de contenido acumulandolas (feed progresivo).
 *
 * @param {Function} cargarPagina funcion (pagina) => { elementos, paginacion }
 * @param {Array} dependencias se reinicia la lista cuando cambian
 */
export function usePaginacion(cargarPagina, dependencias = [], { limite = 10 } = {}) {
  const [elementos, setElementos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [error, setError] = useState(null);

  const contador = useRef(0);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const cargar = useCallback(
    async (pagina, acumular) => {
      contador.current += 1;
      const id = contador.current;

      if (acumular) setCargandoMas(true);
      else setCargando(true);
      setError(null);

      try {
        const resultado = await cargarPagina(pagina, limite);
        if (!montado.current || id !== contador.current) return;

        setElementos((actuales) => (acumular ? [...actuales, ...resultado.elementos] : resultado.elementos));
        setPaginacion(resultado.paginacion || null);
      } catch (excepcion) {
        if (montado.current && id === contador.current) {
          setError(excepcion?.mensaje || 'No pudimos cargar esta informacion.');
        }
      } finally {
        if (montado.current && id === contador.current) {
          setCargando(false);
          setCargandoMas(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencias
  );

  // Carga inicial (y recarga cuando cambian las dependencias).
  useEffect(() => {
    cargar(1, false);
  }, [cargar]);

  /** Carga la siguiente pagina y agrega los resultados a la lista. */
  const cargarMas = useCallback(() => {
    if (!paginacion || !paginacion.hayPaginaSiguiente || cargandoMas) return;
    cargar(paginacion.pagina + 1, true);
  }, [cargar, paginacion, cargandoMas]);

  /** Vuelve a cargar desde la primera pagina. */
  const recargar = useCallback(() => cargar(1, false), [cargar]);

  return {
    elementos,
    paginacion,
    cargando,
    cargandoMas,
    error,
    cargarMas,
    recargar,
    establecerElementos: setElementos,
  };
}

export default usePaginacion;
