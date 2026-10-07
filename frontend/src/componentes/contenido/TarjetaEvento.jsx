import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { Boton } from '../comunes/Boton';
import { Insignia } from '../comunes/Insignia';
import { fechaCorta, horaCorta, tiempoHasta, yaPaso } from '../../utilidades/fechas';
import { plural, urlArchivo } from '../../utilidades/textos';

/**
 * Tarjeta de evento con fecha destacada, ubicacion, cupos y
 * accion opcional para confirmar asistencia.
 */
export function TarjetaEvento({ evento, alAsistir = null, asistiendo = false, miAsistencia = null, className = '' }) {
  if (!evento) return null;

  const paso = yaPaso(evento.fecha);

  return (
    <div className={`tarjeta tarjeta-interactiva overflow-hidden ${className}`}>
      <Link to={`/eventos/${evento._id}`} className="flex gap-3 p-4 pb-2">
        {/* Bloque de fecha */}
        <div
          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl text-white ${
            paso ? 'bg-emi-400' : 'bg-emi-700'
          }`}
        >
          <span className="text-xl font-bold leading-none">{new Date(evento.fecha).getDate()}</span>
          <span className="text-[10px] uppercase tracking-wide">
            {fechaCorta(evento.fecha).split(' de ')[1]?.split(' de ')[0] || ''}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50">
              {evento.nombre}
            </h3>
            {evento.cancelado && (
              <Insignia className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Cancelado</Insignia>
            )}
            {evento.esInstitucional && !evento.cancelado && (
              <Insignia className="bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100">
                Institucional
              </Insignia>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-emi-500 dark:text-emi-300">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {fechaCorta(evento.fecha)} · {horaCorta(evento.fecha)}
            {!paso && <span className="font-medium text-dorado-600"> ({tiempoHasta(evento.fecha)})</span>}
          </p>

          {evento.ubicacion && (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-emi-500 dark:text-emi-300">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {evento.ubicacion}
            </p>
          )}

          {evento.cupos > 0 && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emi-500 dark:text-emi-300">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {plural(evento.cantidadAsistentes || 0, 'asistente')} de {evento.cupos} cupos
            </p>
          )}
        </div>
      </Link>

      {alAsistir && (
        <div className="flex flex-wrap items-center gap-2 border-t border-emi-100 px-4 py-2.5 dark:border-emi-800">
          <Boton
            variante={miAsistencia === 'asistire' ? 'exito' : 'secundario'}
            tamano="pequeno"
            onClick={() => alAsistir('asistire')}
            cargando={asistiendo}
            deshabilitado={evento.cancelado}
          >
            {miAsistencia === 'asistire' ? '✓ Asistire' : 'Asistire'}
          </Boton>
          <Boton
            variante={miAsistencia === 'interesado' ? 'dorado' : 'contorno'}
            tamano="pequeno"
            onClick={() => alAsistir('interesado')}
            cargando={asistiendo}
            deshabilitado={evento.cancelado}
          >
            Me interesa
          </Boton>
          <Link to={`/eventos/${evento._id}`} className="ml-auto text-xs font-medium text-emi-600 hover:underline dark:text-emi-300">
            Ver detalle
          </Link>
        </div>
      )}
    </div>
  );
}

export default TarjetaEvento;
