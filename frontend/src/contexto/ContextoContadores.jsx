import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { servicioNotificaciones } from '../servicios/servicioNotificaciones';
import { useAutenticacion } from './ContextoAutenticacion';

const ContextoContadores = createContext(null);

const CONTADORES_INICIALES = { notificaciones: 0, solicitudes: 0, mensajes: 0, reportes: 0 };

/**
 * Mantiene los contadores de la barra superior (avisos, solicitudes y mensajes)
 * en un solo lugar para que se actualicen desde cualquier parte de la aplicacion.
 */
export function ProveedorContadores({ children }) {
  const { autenticado, esAdministracion } = useAutenticacion();
  const [contadores, setContadores] = useState(CONTADORES_INICIALES);

  const recargar = useCallback(async () => {
    if (!autenticado) {
      setContadores(CONTADORES_INICIALES);
      return;
    }

    try {
      const datos = await servicioNotificaciones.obtenerContadores();
      setContadores((actuales) => ({ ...actuales, ...datos }));
    } catch (error) {
      // Si falla la consulta de contadores no se interrumpe la navegacion.
    }
  }, [autenticado]);

  // Carga inicial de contadores.
  useEffect(() => {
    recargar();
  }, [recargar]);

  // Refresco periodico discreto (60s) para no depender solo del socket.
  useEffect(() => {
    if (!autenticado) return undefined;
    const intervalo = window.setInterval(recargar, 60000);
    return () => window.clearInterval(intervalo);
  }, [autenticado, recargar]);

  /** Actualiza un contador puntual (por ejemplo al recibir un mensaje). */
  const actualizarContador = useCallback((nombre, valor) => {
    setContadores((actuales) => ({ ...actuales, [nombre]: valor }));
  }, []);

  const incrementarContador = useCallback((nombre, cantidad = 1) => {
    setContadores((actuales) => ({ ...actuales, [nombre]: (actuales[nombre] || 0) + cantidad }));
  }, []);

  const valor = useMemo(
    () => ({
      contadores,
      recargar,
      actualizarContador,
      incrementarContador,
      pendientesTotales: contadores.notificaciones + contadores.solicitudes + contadores.mensajes,
    }),
    [contadores, recargar, actualizarContador, incrementarContador]
  );

  return <ContextoContadores.Provider value={valor}>{children}</ContextoContadores.Provider>;
}

/** Hook de acceso a los contadores globales. */
export function useContadores() {
  const contexto = useContext(ContextoContadores);
  if (!contexto) {
    throw new Error('useContadores debe usarse dentro de ProveedorContadores');
  }
  return contexto;
}
