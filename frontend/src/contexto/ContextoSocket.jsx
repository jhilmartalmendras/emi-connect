import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAutenticacion } from './ContextoAutenticacion';
import { useToast } from './ContextoToast';
import { CLAVE_TOKEN } from '../servicios/api';
import { ORIGEN_BACKEND } from '../utilidades/textos';

const ContextoSocket = createContext(null);

/**
 * Mantiene una unica conexion Socket.IO para toda la aplicacion.
 * Expone el socket y el estado de la conexion; los componentes se suscriben
 * a los eventos que necesitan.
 */
export function ProveedorSocket({ children, alRecibirNotificacion, alRecibirMensaje }) {
  const { autenticado } = useAutenticacion();
  const toast = useToast();
  const [conectado, setConectado] = useState(false);
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // Referencias actualizadas a los manejadores para no reconectar en cada render.
  const notificacionRef = useRef(alRecibirNotificacion);
  const mensajeRef = useRef(alRecibirMensaje);

  useEffect(() => {
    notificacionRef.current = alRecibirNotificacion;
  }, [alRecibirNotificacion]);

  useEffect(() => {
    mensajeRef.current = alRecibirMensaje;
  }, [alRecibirMensaje]);

  useEffect(() => {
    const token = localStorage.getItem(CLAVE_TOKEN);

    if (!autenticado || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConectado(false);
      }
      return undefined;
    }

    const instancia = io(ORIGEN_BACKEND, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 8,
      reconnectionDelay: 2000,
    });

    socketRef.current = instancia;
    setSocket(instancia);

    instancia.on('connect', () => setConectado(true));
    instancia.on('disconnect', () => setConectado(false));
    instancia.on('connect_error', () => setConectado(false));

    instancia.on('notificacion:nueva', (notificacion) => {
      if (notificacionRef.current) notificacionRef.current(notificacion);
      toast.informativo(notificacion.titulo || 'Tienes una nueva notificacion.');
    });

    instancia.on('mensaje:nuevo', (mensaje) => {
      if (mensajeRef.current) mensajeRef.current(mensaje);
    });

    return () => {
      instancia.removeAllListeners();
      instancia.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConectado(false);
    };
    // El toast es estable: se incluye para satisfacer las reglas de dependencias.
  }, [autenticado, toast]);

  const valor = useMemo(() => ({ socket, conectado }), [socket, conectado]);

  return <ContextoSocket.Provider value={valor}>{children}</ContextoSocket.Provider>;
}

/** Hook de acceso al socket. Puede devolver null si no hay sesion. */
export function useSocket() {
  return useContext(ContextoSocket);
}
