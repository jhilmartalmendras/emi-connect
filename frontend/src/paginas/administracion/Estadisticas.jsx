import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { EstadoError } from '../../componentes/comunes/EstadoVacio';
import { Selector } from '../../componentes/comunes/EntradaTexto';
import { servicioAdministracion } from '../../servicios/servicioAdministracion';
import { ESTADOS_REPORTE, etiquetaCategoria } from '../../constantes/catalogos';
import { nombreCompleto, recortar, plural } from '../../utilidades/textos';
import { fechaCorta, tiempoRelativo } from '../../utilidades/fechas';

/** Graficas de crecimiento y actividad reciente para la administracion. */
export default function Estadisticas() {
  const [datos, setDatos] = useState(null);
  const [dias, setDias] = useState('30');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await servicioAdministracion.obtenerEstadisticas(Number(dias));
      setDatos(resultado);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudieron cargar las estadisticas.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  if (cargando) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="tarjeta p-4">
            <Esqueleto className="mb-4 h-4 w-40" />
            <Esqueleto className="h-40 w-full" />
          </div>
          <div className="tarjeta p-4">
            <Esqueleto className="mb-4 h-4 w-40" />
            <Esqueleto className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !datos) {
    return <EstadoError mensaje="No pudimos cargar las estadisticas" detalle={error || ''} alReintentar={cargar} />;
  }

  const { crecimiento, actividad } = datos;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo-seccion">Estadisticas</h1>
          <p className="texto-secundario">Crecimiento y actividad reciente de la plataforma.</p>
        </div>
        <Selector
          valor={dias}
          alCambiar={setDias}
          opciones={[
            { valor: '7', etiqueta: 'Ultimos 7 dias' },
            { valor: '30', etiqueta: 'Ultimos 30 dias' },
            { valor: '90', etiqueta: 'Ultimos 90 dias' },
            { valor: '180', etiqueta: 'Ultimos 180 dias' },
          ]}
          className="w-48"
        />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Crecimiento de usuarios */}
        <GraficaBarras
          titulo="Nuevos usuarios por dia"
          serie={crecimiento.usuariosPorDia}
          color="bg-emi-600"
        />

        {/* Publicaciones por dia */}
        <GraficaBarras
          titulo="Publicaciones por dia"
          serie={crecimiento.publicacionesPorDia}
          color="bg-dorado-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Publicaciones por categoria */}
        <section className="tarjeta p-4" aria-labelledby="grafica-categorias">
          <h2 id="grafica-categorias" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Publicaciones por categoria
          </h2>
          <BarrasHorizontales
            elementos={(crecimiento.publicacionesPorCategoria || []).map((item) => ({
              etiqueta: etiquetaCategoria(item.categoria),
              cantidad: item.cantidad,
            }))}
          />
        </section>

        {/* Reportes por estado */}
        <section className="tarjeta p-4" aria-labelledby="grafica-reportes">
          <h2 id="grafica-reportes" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Reportes por estado
          </h2>
          <BarrasHorizontales
            elementos={(crecimiento.reportesPorEstado || []).map((item) => ({
              etiqueta: ESTADOS_REPORTE.find((estado) => estado.valor === item.estado)?.etiqueta || item.estado,
              cantidad: item.cantidad,
            }))}
          />
          <p className="mt-3 text-xs text-emi-400">
            {plural(crecimiento.eventosProximos || 0, 'evento')} programados a futuro.
          </p>
        </section>
      </div>

      {/* Actividad reciente */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="tarjeta p-4" aria-labelledby="actividad-usuarios">
          <h2 id="actividad-usuarios" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Ultimos usuarios registrados
          </h2>
          <ul className="space-y-2">
            {(actividad.usuariosRecientes || []).map((usuario) => (
              <li key={usuario._id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-emi-900 dark:text-emi-50">
                    {nombreCompleto(usuario)}
                  </span>
                  <span className="block truncate text-xs text-emi-500">{usuario.correo}</span>
                </span>
                <span className="shrink-0 text-xs text-emi-400">{tiempoRelativo(usuario.fechaCreacion)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta p-4" aria-labelledby="actividad-publicaciones">
          <h2 id="actividad-publicaciones" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Ultimas publicaciones
          </h2>
          <ul className="space-y-2">
            {(actividad.publicacionesRecientes || []).map((publicacion) => (
              <li key={publicacion._id} className="text-sm">
                <p className="font-medium text-emi-900 dark:text-emi-50">{nombreCompleto(publicacion.autor)}</p>
                <p className="text-xs text-emi-500">{recortar(publicacion.contenido, 90)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta p-4" aria-labelledby="actividad-comunidades">
          <h2 id="actividad-comunidades" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Comunidades recientes
          </h2>
          <ul className="space-y-2 text-sm">
            {(actividad.comunidadesRecientes || []).map((comunidad) => (
              <li key={comunidad._id} className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-emi-900 dark:text-emi-50">{comunidad.nombre}</span>
                <span className="shrink-0 text-xs text-emi-400">
                  {plural(comunidad.cantidadMiembros || 0, 'miembro')}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tarjeta p-4" aria-labelledby="actividad-eventos">
          <h2 id="actividad-eventos" className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">
            Eventos y productos recientes
          </h2>
          <ul className="space-y-2 text-sm">
            {(actividad.eventosRecientes || []).map((evento) => (
              <li key={evento._id} className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-emi-900 dark:text-emi-50">{evento.nombre}</span>
                <span className="shrink-0 text-xs text-emi-400">{fechaCorta(evento.fecha)}</span>
              </li>
            ))}
            {(actividad.productosRecientes || []).map((producto) => (
              <li key={producto._id} className="flex items-center justify-between gap-3">
                <span className="truncate font-medium text-emi-900 dark:text-emi-50">{producto.titulo}</span>
                <span className="shrink-0 text-xs text-emi-400">{tiempoRelativo(producto.fechaCreacion)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Grafica de barras verticales simple (sin librerias externas). */
function GraficaBarras({ titulo, serie = [], color = 'bg-emi-600' }) {
  const maximo = Math.max(1, ...serie.map((punto) => Number(punto.cantidad) || 0));

  return (
    <section className="tarjeta p-4" aria-label={titulo}>
      <h2 className="mb-3 text-sm font-semibold text-emi-900 dark:text-emi-50">{titulo}</h2>

      {serie.length === 0 ? (
        <p className="py-8 text-center texto-secundario">Sin actividad en el rango seleccionado.</p>
      ) : (
        <>
          <div className="flex h-40 items-end gap-1" role="img" aria-label={`${titulo}: ${serie.length} registros`}>
            {serie.map((punto) => (
              <div
                key={punto._id}
                className={`flex-1 rounded-t transition-all ${color}`}
                style={{ height: `${Math.max(4, ((Number(punto.cantidad) || 0) / maximo) * 100)}%` }}
                title={`${punto._id}: ${punto.cantidad}`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-emi-400">
            <span>{serie[0]?._id}</span>
            <span>
              maximo: {maximo} · total:{' '}
              {serie.reduce((total, punto) => total + (Number(punto.cantidad) || 0), 0)}
            </span>
            <span>{serie[serie.length - 1]?._id}</span>
          </div>
        </>
      )}
    </section>
  );
}

/** Barras horizontales con etiqueta y cantidad. */
function BarrasHorizontales({ elementos = [] }) {
  const maximo = Math.max(1, ...elementos.map((item) => item.cantidad || 0));

  if (elementos.length === 0) {
    return <p className="py-6 text-center texto-secundario">Sin datos todavia.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {elementos.map((item) => (
        <li key={item.etiqueta}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-emi-600 dark:text-emi-200">{item.etiqueta}</span>
            <span className="font-semibold text-emi-900 dark:text-emi-50">{item.cantidad}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-emi-100 dark:bg-emi-800">
            <div
              className="h-full rounded-full bg-emi-600"
              style={{ width: `${Math.max(3, ((item.cantidad || 0) / maximo) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
