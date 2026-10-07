import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, MessageSquare, UserPlus, Users, CalendarDays, Flag, Heart, Info } from 'lucide-react';
import { servicioNotificaciones } from '../../servicios/servicioNotificaciones';
import { useContadores } from '../../contexto/ContextoContadores';
import { useClickExterno } from '../../hooks/useClickExterno';
import { Avatar } from '../comunes/Avatar';
import { Cargador } from '../comunes/Cargador';
import { tiempoRelativo } from '../../utilidades/fechas';
import { nombreCompleto } from '../../utilidades/textos';

// Icono segun el tipo de notificacion.
const ICONOS = {
  reaccion: Heart,
  comentario: MessageSquare,
  solicitud_amistad: UserPlus,
  amistad_aceptada: UserPlus,
  mensaje: MessageSquare,
  evento: CalendarDays,
  comunidad: Users,
  publicacion_institucional: Flag,
  reporte_resuelto: Flag,
  sistema: Info,
};

/**
 * Campana de notificaciones con lista desplegable.
 * Muestra las notificaciones mas recientes y permite marcarlas como leidas.
 */
export function MenuNotificaciones() {
  const navegar = useNavigate();
  const { contadores, actualizarContador, recargar } = useContadores();
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const referencia = useClickExterno(abierto, () => setAbierto(false));

  // Se carga la lista cada vez que se abre el menu.
  useEffect(() => {
    if (!abierto) return;

    let activo = true;
    setCargando(true);

    servicioNotificaciones
      .listar({ pagina: 1, limite: 12 })
      .then((datos) => {
        if (activo) setNotificaciones(datos.notificaciones || []);
      })
      .catch(() => {
        if (activo) setNotificaciones([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [abierto]);

  const noLeidas = contadores.notificaciones || 0;

  const abrirNotificacion = async (notificacion) => {
    if (!notificacion.leida) {
      try {
        await servicioNotificaciones.marcarLeida(notificacion._id);
        setNotificaciones((actuales) =>
          actuales.map((item) => (item._id === notificacion._id ? { ...item, leida: true } : item))
        );
        actualizarContador('notificaciones', Math.max(0, noLeidas - 1));
      } catch (error) {
        // Si falla el marcado, se continua con la navegacion.
      }
    }

    setAbierto(false);
    if (notificacion.enlace) navegar(notificacion.enlace);
  };

  const marcarTodasLeidas = async () => {
    try {
      await servicioNotificaciones.marcarTodasLeidas();
      setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true })));
      actualizarContador('notificaciones', 0);
    } catch (error) {
      // Sin conexion: se mantiene el estado actual.
    }
  };

  const eliminar = async (notificacion) => {
    try {
      await servicioNotificaciones.eliminar(notificacion._id);
      setNotificaciones((actuales) => actuales.filter((item) => item._id !== notificacion._id));
      recargar();
    } catch (error) {
      // Sin conexion: se mantiene el estado actual.
    }
  };

  return (
    <div className="relative" ref={referencia}>
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="relative rounded-full p-2.5 text-emi-100 transition hover:bg-emi-700 dark:text-emi-100"
        aria-label={`Notificaciones${noLeidas > 0 ? `: ${noLeidas} sin leer` : ''}`}
        aria-expanded={abierto}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-dorado-500 px-1 text-[10px] font-bold text-emi-950">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-emi-100 bg-white shadow-tarjeta animar-entrada dark:border-emi-700 dark:bg-emi-900">
          <header className="flex items-center justify-between border-b border-emi-100 px-4 py-3 dark:border-emi-800">
            <h3 className="text-sm font-semibold text-emi-900 dark:text-emi-50">Notificaciones</h3>
            {noLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasLeidas}
                className="inline-flex items-center gap-1 text-xs font-medium text-emi-600 transition hover:text-emi-800 dark:text-emi-300"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Marcar todas
              </button>
            )}
          </header>

          <div className="max-h-[60vh] overflow-y-auto">
            {cargando && (
              <div className="flex justify-center py-8">
                <Cargador tamanos="h-5 w-5 text-emi-500" />
              </div>
            )}

            {!cargando && notificaciones.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-emi-500 dark:text-emi-300">
                No tienes notificaciones por ahora.
              </p>
            )}

            <ul>
              {notificaciones.map((notificacion) => {
                const Icono = ICONOS[notificacion.tipo] || Info;
                return (
                  <li key={notificacion._id}>
                    <div
                      className={`flex items-start gap-3 border-b border-emi-50 px-4 py-3 transition hover:bg-emi-50 dark:border-emi-800 dark:hover:bg-emi-800 ${
                        notificacion.leida ? '' : 'bg-emi-50/70 dark:bg-emi-800/50'
                      }`}
                    >
                      {notificacion.actor ? (
                        <Avatar usuario={notificacion.actor} tamanos="pequeno" />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emi-100 text-emi-600 dark:bg-emi-800 dark:text-emi-200">
                          <Icono className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}

                      <button type="button" onClick={() => abrirNotificacion(notificacion)} className="flex-1 text-left">
                        <p className="text-sm font-medium text-emi-900 dark:text-emi-50">{notificacion.titulo}</p>
                        <p className="text-xs text-emi-500 dark:text-emi-300">{notificacion.mensaje}</p>
                        <p className="mt-0.5 text-[11px] text-emi-400">
                          {tiempoRelativo(notificacion.fechaCreacion)}
                          {notificacion.actor ? ` · ${nombreCompleto(notificacion.actor)}` : ''}
                        </p>
                      </button>

                      <div className="flex flex-col gap-1">
                        {!notificacion.leida && (
                          <button
                            type="button"
                            onClick={() => abrirNotificacion(notificacion)}
                            className="rounded p-1 text-emi-400 transition hover:bg-emi-100 hover:text-emi-700 dark:hover:bg-emi-700"
                            aria-label="Marcar como leida"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => eliminar(notificacion)}
                          className="rounded p-1 text-emi-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          aria-label="Eliminar notificacion"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <Link
            to="/notificaciones"
            onClick={() => setAbierto(false)}
            className="block bg-emi-50 px-4 py-3 text-center text-sm font-medium text-emi-700 transition hover:bg-emi-100 dark:bg-emi-800 dark:text-emi-100 dark:hover:bg-emi-700"
          >
            Ver todas las notificaciones
          </Link>
        </div>
      )}
    </div>
  );
}

export default MenuNotificaciones;
