import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, MessageSquare, UsersRound, CalendarDays, Store, Flag, Activity, ArrowRight } from 'lucide-react';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { EstadoError } from '../../componentes/comunes/EstadoVacio';
import { servicioAdministracion } from '../../servicios/servicioAdministracion';

/** Resumen general del panel administrativo. */
export default function Resumen() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await servicioAdministracion.obtenerResumen();
      setResumen(datos.resumen);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar el resumen.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, indice) => (
            <div key={indice} className="tarjeta space-y-3 p-4">
              <Esqueleto className="h-4 w-1/2" />
              <Esqueleto className="h-7 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !resumen) {
    return <EstadoError mensaje="No pudimos cargar el resumen" detalle={error || ''} alReintentar={cargar} />;
  }

  const tarjetas = [
    { etiqueta: 'Usuarios totales', valor: resumen.usuarios?.total, detalle: `+${resumen.usuarios?.nuevosUltimaSemana || 0} esta semana`, icono: Users, color: 'text-emi-600 bg-emi-50 dark:bg-emi-800 dark:text-emi-200' },
    { etiqueta: 'Usuarios activos (30 dias)', valor: resumen.usuarios?.activosUltimoMes, detalle: `${resumen.usuarios?.conectadosAhora || 0} conectados`, icono: Activity, color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-300' },
    { etiqueta: 'Publicaciones', valor: resumen.publicaciones?.total, detalle: `+${resumen.publicaciones?.ultimaSemana || 0} esta semana`, icono: FileText, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-300' },
    { etiqueta: 'Comentarios', valor: resumen.comentarios?.total, detalle: `${resumen.comentarios?.ultimoMes || 0} este mes`, icono: MessageSquare, color: 'text-emi-600 bg-emi-50 dark:bg-emi-800 dark:text-emi-200' },
    { etiqueta: 'Comunidades', valor: resumen.comunidades?.total, detalle: 'activas', icono: UsersRound, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-300' },
    { etiqueta: 'Eventos', valor: resumen.eventos?.total, detalle: 'registrados', icono: CalendarDays, color: 'text-dorado-600 bg-dorado-50 dark:bg-dorado-900/40 dark:text-dorado-300' },
    { etiqueta: 'Productos', valor: resumen.productos?.total, detalle: 'en el marketplace', icono: Store, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950 dark:text-teal-300' },
    { etiqueta: 'Reportes pendientes', valor: resumen.reportes?.pendientes, detalle: `${resumen.reportes?.total || 0} en total`, icono: Flag, color: 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-300' },
  ];

  const accesos = [
    { ruta: '/administracion/usuarios', etiqueta: 'Gestionar usuarios' },
    { ruta: '/administracion/publicaciones', etiqueta: 'Moderar publicaciones' },
    { ruta: '/administracion/reportes', etiqueta: 'Revisar reportes' },
    { ruta: '/administracion/estadisticas', etiqueta: 'Ver estadisticas' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="titulo-seccion">Resumen de la plataforma</h1>
        <p className="texto-secundario">Estado general de EMI Connect en tiempo real.</p>
      </header>

      {/* Indicadores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => {
          const Icono = tarjeta.icono;
          return (
            <div key={tarjeta.etiqueta} className="tarjeta p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emi-500 dark:text-emi-300">{tarjeta.etiqueta}</p>
                <span className={`rounded-lg p-1.5 ${tarjeta.color}`}>
                  <Icono className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-emi-900 dark:text-emi-50">{tarjeta.valor ?? 0}</p>
              <p className="text-[11px] text-emi-400">{tarjeta.detalle}</p>
            </div>
          );
        })}
      </div>

      {/* Accesos rapidos */}
      <section aria-labelledby="accesos-admin">
        <h2 id="accesos-admin" className="mb-2 text-sm font-semibold text-emi-900 dark:text-emi-50">
          Accesos rapidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {accesos.map((acceso) => (
            <Link
              key={acceso.ruta}
              to={acceso.ruta}
              className="tarjeta flex items-center justify-between gap-2 p-4 text-sm font-medium text-emi-700 transition hover:shadow-tarjeta dark:text-emi-100"
            >
              {acceso.etiqueta}
              <ArrowRight className="h-4 w-4 shrink-0 text-emi-400" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* Actividad */}
      <section className="tarjeta p-4" aria-labelledby="actividad-resumen">
        <h2 id="actividad-resumen" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
          Indicadores de actividad
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <Dato etiqueta="Usuarios bloqueados" valor={resumen.usuarios?.bloqueados} />
          <Dato etiqueta="Mensajes (30 dias)" valor={resumen.mensajes?.ultimoMes} />
          <Dato etiqueta="Relaciones de amistad" valor={resumen.amistades?.total} />
          <Dato etiqueta="Historias activas" valor={resumen.historiasActivas?.total} />
          <Dato etiqueta="Bloqueos entre usuarios" valor={resumen.bloqueos?.total} />
          <Dato etiqueta="Reportes totales" valor={resumen.reportes?.total} />
        </div>
      </section>
    </div>
  );
}

/** Dato numerico simple del resumen. */
function Dato({ etiqueta, valor }) {
  return (
    <div className="rounded-xl bg-emi-50 px-4 py-3 dark:bg-emi-800/60">
      <p className="text-xs text-emi-500 dark:text-emi-300">{etiqueta}</p>
      <p className="text-lg font-bold text-emi-900 dark:text-emi-50">{valor ?? 0}</p>
    </div>
  );
}
