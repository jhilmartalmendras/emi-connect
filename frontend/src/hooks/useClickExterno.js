import { useEffect, useRef } from 'react';

/**
 * Cierra un menu o modal cuando el usuario hace clic fuera del elemento
 * o presiona la tecla Escape.
 */
export function useClickExterno(estaAbierto, alCerrar) {
  const referencia = useRef(null);

  useEffect(() => {
    if (!estaAbierto) return undefined;

    function manejarClic(evento) {
      if (referencia.current && !referencia.current.contains(evento.target)) {
        alCerrar();
      }
    }

    function manejarTecla(evento) {
      if (evento.key === 'Escape') alCerrar();
    }

    document.addEventListener('mousedown', manejarClic);
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('mousedown', manejarClic);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [estaAbierto, alCerrar]);

  return referencia;
}

export default useClickExterno;
