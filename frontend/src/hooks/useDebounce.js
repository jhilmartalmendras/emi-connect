import { useEffect, useState } from 'react';

/** Retrasa la actualizacion de un valor para no disparar una peticion por tecla. */
export function useDebounce(valor, retraso = 400) {
  const [valorRetrasado, setValorRetrasado] = useState(valor);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setValorRetrasado(valor), retraso);
    return () => window.clearTimeout(temporizador);
  }, [valor, retraso]);

  return valorRetrasado;
}

export default useDebounce;
