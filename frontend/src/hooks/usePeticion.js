import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Ejecuta una peticion a la API y administra los estados de carga, error y datos.
 *
 * @param {Function} funcionPeticion funcion que devuelve una promesa
 * @param {Array} dependencias se vuelve a ejecutar cuando cambian
 * @param {{ejecutarAlMontar?: boolean}} opciones
 */
export function usePeticion(funcionPeticion, dependencias = [], { ejecutarAlMontar = true } = {}) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(ejecutarAlMontar);
  const [error, setError] = useState(null);

  // Permite ignorar respuestas de peticiones anteriores cuando cambian las dependencias.
  const contadorPeticion = useRef(0);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const ejecutar = useCallback(async () => {
    contadorPeticion.current += 1;
    const idPeticion = contadorPeticion.current;

    setCargando(true);
    setError(null);

    try {
      const resultado = await funcionPeticion();
      if (montado.current && idPeticion === contadorPeticion.current) {
        setDatos(resultado);
      }
      return resultado;
    } catch (excepcion) {
      if (montado.current && idPeticion === contadorPeticion.current) {
        setError(excepcion?.mensaje || 'No pudimos cargar esta informacion.');
      }
      throw excepcion;
    } finally {
      if (montado.current && idPeticion === contadorPeticion.current) {
        setCargando(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  useEffect(() => {
    if (!ejecutarAlMontar) return;
    ejecutar().catch(() => {
      // El error ya quedo registrado en el estado.
    });
  }, [ejecutar, ejecutarAlMontar]);

  return { datos, cargando, error, recargar: ejecutar, establecerDatos: setDatos };
}

export default usePeticion;
