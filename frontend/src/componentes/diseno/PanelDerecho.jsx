import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, UsersRound, Sparkles } from 'lucide-react';
import { Cargador } from '../comunes/Cargador';
import { servicioEventos } from '../../servicios/servicioEventos';
import { servicioComunidades } from '../../servicios/servicioComunidades';
import { fechaCorta, horaCorta, tiempoHasta, yaPaso } from '../../utilidades/fechas';
import { plural, urlArchivo } from '../../utilidades/textos';

/**
 * Panel derecho del inicio: eventos proximos y comunidades sugeridas.
 * Se carga de forma independiente para no bloquear el feed.
 */
export function PanelDerecho({ className = '' }) {
  const [eventos, setEventos] = useState(null);
  const [comunidades, setComunidades] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    Promise.all([servicioEventos.listarProximos(4), servicioComunidades.listarSugeridas()])
      .then(([datosEventos, datosComunidades]) => {
        if (!activo) return;
        setEventos(datosEventos.eventos || []);
        setComunidades(datosComunidades.comunidades || []);
      })
      .catch(() => {
        if (!activo) return;
        setEventos([]);
        setComunidades([]);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  if (cargando) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="tarjeta flex justify-center p-6">
          <Cargador tamanos="h-5 w-5 text-emi-500" texto="Cargando novedades..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Eventos proximos */}
      <section className="tarjeta overflow-hidden" aria-labelledby="panel-eventos">
        <header className="flex items-center gap-2 border-b border-emi-100 px-4 py-3 dark:border-emi-800">
          <CalendarDays className="h-4 w-4 text-emi-500" aria-hidden="true" />
          <h2 id="panel-eventos" className="text-sm font-semibold text-emi-900 dark:text-emi-50">
            Eventos proximos
          </h2>
          <Link to="/eventos" className="ml-auto text-xs font-medium text-emi-600 hover:underline dark:text-emi-300">
            Ver todos
          </Link>
        </header>

        {eventos.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-emi-500 dark:text-emi-300">
            No hay eventos programados por ahora.
          </p>
        ) : (
          <ul className="divide-y divide-emi-50 dark:divide-emi-800">
            {eventos.map((evento) => (
              <li key={evento._id}>
                <Link
                  to={`/eventos/${evento._id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                >
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-emi-700 text-white">
                    <span className="text-sm font-bold leading-none">{new Date(evento.fecha).getDate()}</span>
                    <span className="text-[9px] uppercase">
                      {fechaCorta(evento.fecha).split(' de ')[1]?.split(' de ')[0]?.slice(0, 3) || ''}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-emi-900 dark:text-emi-50">
                      {evento.nombre}
                    </span>
                    <span className="block text-xs text-emi-500 dark:text-emi-300">
                      {horaCorta(evento.fecha)} · {yaPaso(evento.fecha) ? 'finalizado' : tiempoHasta(evento.fecha)}
                    </span>
                    {evento.ubicacion && (
                      <span className="block truncate text-[11px] text-emi-400">{evento.ubicacion}</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comunidades sugeridas */}
      <section className="tarjeta overflow-hidden" aria-labelledby="panel-comunidades">
        <header className="flex items-center gap-2 border-b border-emi-100 px-4 py-3 dark:border-emi-800">
          <UsersRound className="h-4 w-4 text-emi-500" aria-hidden="true" />
          <h2 id="panel-comunidades" className="text-sm font-semibold text-emi-900 dark:text-emi-50">
            Comunidades sugeridas
          </h2>
          <Link
            to="/comunidades"
            className="ml-auto text-xs font-medium text-emi-600 hover:underline dark:text-emi-300"
          >
            Explorar
          </Link>
        </header>

        {comunidades.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-emi-500 dark:text-emi-300">
            Todavia no hay comunidades disponibles.
          </p>
        ) : (
          <ul className="divide-y divide-emi-50 dark:divide-emi-800">
            {comunidades.map((comunidad) => (
              <li key={comunidad._id}>
                <Link
                  to={`/comunidades/${comunidad._id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emi-100 dark:bg-emi-800">
                    {comunidad.imagen ? (
                      <img
                        src={urlArchivo(comunidad.imagen)}
                        alt=""
                        className="h-10 w-10 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <UsersRound className="h-5 w-5 text-emi-500" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-emi-900 dark:text-emi-50">
                      {comunidad.nombre}
                    </span>
                    <span className="block text-xs text-emi-500 dark:text-emi-300">
                      {plural(comunidad.cantidadMiembros || 0, 'miembro')}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pie del panel */}
      <p className="flex items-center justify-center gap-1.5 px-2 text-center text-[11px] text-emi-400">
        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
        Recomendaciones personalizadas con el motor de afinidad de EMI Connect.
      </p>
    </div>
  );
}

export default PanelDerecho;
