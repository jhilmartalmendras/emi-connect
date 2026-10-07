import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Avatar } from '../comunes/Avatar';
import { Boton } from '../comunes/Boton';
import { Esqueleto } from '../comunes/Esqueleto';
import { EstadoVacio } from '../comunes/EstadoVacio';
import { tiempoRelativo } from '../../utilidades/fechas';

/**
 * Lista de notificaciones con acciones de lectura y eliminacion.
 */
export function ListaNotificaciones({ notificaciones = [], cargando = false, alMarcarLeida, alEliminar, alMarcarTodas }) {
  if (cargando) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, indice) => (
          <div key={indice} className="tarjeta flex items-center gap-3 p-4">
            <Esqueleto className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Esqueleto className="h-3.5 w-1/2" />
              <Esqueleto className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notificaciones.length === 0) {
    return (
      <EstadoVacio
        titulo="No tienes notificaciones"
        descripcion="Cuando alguien reaccione, comente o te envie una solicitud, aparecera aqui."
        icono={Bell}
      />
    );
  }

  const hayNoLeidas = notificaciones.some((notificacion) => !notificacion.leida);

  return (
    <div className="space-y-3">
      {hayNoLeidas && alMarcarTodas && (
        <div className="flex justify-end">
          <Boton variante="contorno" tamano="pequeno" icono={CheckCheck} onClick={alMarcarTodas}>
            Marcar todas como leidas
          </Boton>
        </div>
      )}

      <ul className="space-y-2">
        {notificaciones.map((notificacion) => (
          <li
            key={notificacion._id}
            className={`tarjeta flex items-start gap-3 p-4 transition ${
              notificacion.leida ? '' : 'border-l-4 border-l-dorado-400'
            }`}
          >
            {notificacion.actor ? (
              <Avatar usuario={notificacion.actor} tamanos="normal" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emi-100 text-emi-600 dark:bg-emi-800 dark:text-emi-200">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </span>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-emi-900 dark:text-emi-50">{notificacion.titulo}</p>
              {notificacion.mensaje && (
                <p className="mt-0.5 text-sm text-emi-600 dark:text-emi-200">{notificacion.mensaje}</p>
              )}
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs text-emi-400">{tiempoRelativo(notificacion.fechaCreacion)}</span>
                {notificacion.enlace && (
                  <Link to={notificacion.enlace} className="text-xs font-medium text-emi-600 hover:underline dark:text-emi-300">
                    Ver detalle
                  </Link>
                )}
                {!notificacion.leida && alMarcarLeida && (
                  <button
                    type="button"
                    onClick={() => alMarcarLeida(notificacion)}
                    className="text-xs font-medium text-emi-600 hover:underline dark:text-emi-300"
                  >
                    Marcar como leida
                  </button>
                )}
              </div>
            </div>

            {alEliminar && (
              <button
                type="button"
                onClick={() => alEliminar(notificacion)}
                className="rounded-lg p-1.5 text-emi-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                aria-label="Eliminar notificacion"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ListaNotificaciones;
