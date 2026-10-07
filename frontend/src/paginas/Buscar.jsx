import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Users, FileText, UsersRound, CalendarDays, Store } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { useDebounce } from '../hooks/useDebounce';
import { servicioDescubrimiento } from '../servicios/servicioDescubrimiento';
import { recortar, nombreCompleto, formatearPrecio } from '../utilidades/textos';
import { fechaCorta as fechaCortaUtil } from '../utilidades/fechas';

const TIPOS = [
  { valor: 'todo', etiqueta: 'Todo', icono: Search },
  { valor: 'usuarios', etiqueta: 'Personas', icono: Users },
  { valor: 'publicaciones', etiqueta: 'Publicaciones', icono: FileText },
  { valor: 'comunidades', etiqueta: 'Comunidades', icono: UsersRound },
  { valor: 'eventos', etiqueta: 'Eventos', icono: CalendarDays },
  { valor: 'productos', etiqueta: 'Marketplace', icono: Store },
];

/** Busqueda global con pestañas por tipo de contenido. */
export default function Buscar() {
  const [parametros, setParametros] = useSearchParams();
  const consultaInicial = parametros.get('q') || '';

  const [texto, setTexto] = useState(consultaInicial);
  const [tipo, setTipo] = useState('todo');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const textoRetrasado = useDebounce(texto, 400);

  // La URL acompana la busqueda para poder compartirla.
  useEffect(() => {
    if (textoRetrasado.trim()) {
      setParametros({ q: textoRetrasado.trim() }, { replace: true });
    }
  }, [textoRetrasado, setParametros]);

  useEffect(() => {
    const termino = textoRetrasado.trim();
    if (termino.length < 2) {
      setResultados(null);
      setCargando(false);
      return;
    }

    let activo = true;
    setCargando(true);
    setError(null);

    servicioDescubrimiento
      .buscar(termino, tipo)
      .then((datos) => {
        if (activo) setResultados(datos);
      })
      .catch((excepcion) => {
        if (activo) setError(excepcion.mensaje || 'No se pudo realizar la busqueda.');
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [textoRetrasado, tipo]);

  const hayContenido =
    resultados &&
    ((resultados.usuarios?.length || 0) > 0 ||
      (resultados.publicaciones?.length || 0) > 0 ||
      (resultados.comunidades?.length || 0) > 0 ||
      (resultados.eventos?.length || 0) > 0 ||
      (resultados.productos?.length || 0) > 0);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Buscar en EMI Connect</h1>
        <p className="texto-secundario">Personas, publicaciones, comunidades, eventos y productos.</p>
      </header>

      {/* Campo de busqueda */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emi-400" aria-hidden="true" />
        <input
          type="search"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          placeholder="Escribe al menos 2 letras para buscar..."
          aria-label="Termino de busqueda"
          autoFocus
          className="campo-entrada pl-9"
        />
      </div>

      {/* Filtros de tipo */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-emi-100 bg-white p-1 dark:border-emi-800 dark:bg-emi-900">
        {TIPOS.map((opcion) => {
          const Icono = opcion.icono;
          return (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => setTipo(opcion.valor)}
              aria-current={tipo === opcion.valor}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                tipo === opcion.valor
                  ? 'bg-emi-700 text-white'
                  : 'text-emi-500 hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {opcion.etiqueta}
            </button>
          );
        })}
      </div>

      {/* Estado inicial */}
      {textoRetrasado.trim().length < 2 && (
        <EstadoVacio
          titulo="¿Que quieres encontrar?"
          descripcion="Busca personas por nombre o carrera, comunidades, eventos, productos o texto de publicaciones."
          icono={Search}
        />
      )}

      {cargando && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, indice) => (
            <div key={indice} className="tarjeta flex items-center gap-3 p-4">
              <Esqueleto className="h-11 w-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Esqueleto className="h-4 w-1/2" />
                <Esqueleto className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="Falló la busqueda" detalle={error} alReintentar={() => setTexto(`${texto} `.trim())} />
      )}

      {!cargando && !error && textoRetrasado.trim().length >= 2 && !hayContenido && (
        <EstadoVacio
          titulo={`Sin resultados para "${textoRetrasado.trim()}"`}
          descripcion="Prueba con otras palabras o cambia el filtro de busqueda."
          icono={Search}
        />
      )}

      {!cargando && !error && hayContenido && (
        <div className="space-y-5">
          {/* Personas */}
          {(tipo === 'todo' || tipo === 'usuarios') && resultados.usuarios?.length > 0 && (
            <Seccion titulo="Personas" total={resultados.totales?.usuarios}>
              <div className="grid gap-3 sm:grid-cols-2">
                {resultados.usuarios.map((usuario) => (
                  <Link
                    key={usuario._id}
                    to={`/perfil/${usuario._id}`}
                    className="tarjeta flex items-center gap-3 p-4 transition hover:shadow-tarjeta"
                  >
                    <Avatar usuario={usuario} tamanos="normal" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                        {nombreCompleto(usuario)}
                      </span>
                      <span className="block truncate text-xs text-emi-500">
                        {usuario.carrera || usuario.correo}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </Seccion>
          )}

          {/* Publicaciones */}
          {(tipo === 'todo' || tipo === 'publicaciones') && resultados.publicaciones?.length > 0 && (
            <Seccion titulo="Publicaciones" total={resultados.totales?.publicaciones}>
              <div className="space-y-2">
                {resultados.publicaciones.map((publicacion) => (
                  <Link
                    key={publicacion._id}
                    to={`/publicacion/${publicacion._id}`}
                    className="tarjeta block p-4 transition hover:shadow-tarjeta"
                  >
                    <p className="text-xs font-medium text-emi-500">{nombreCompleto(publicacion.autor)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-emi-800 dark:text-emi-100">
                      {recortar(publicacion.contenido, 220)}
                    </p>
                  </Link>
                ))}
              </div>
            </Seccion>
          )}

          {/* Comunidades */}
          {(tipo === 'todo' || tipo === 'comunidades') && resultados.comunidades?.length > 0 && (
            <Seccion titulo="Comunidades" total={resultados.totales?.comunidades}>
              <div className="grid gap-3 sm:grid-cols-2">
                {resultados.comunidades.map((comunidad) => (
                  <Link
                    key={comunidad._id}
                    to={`/comunidades/${comunidad._id}`}
                    className="tarjeta flex items-center gap-3 p-4 transition hover:shadow-tarjeta"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emi-700 text-sm font-bold text-white">
                      {comunidad.nombre.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                        {comunidad.nombre}
                      </span>
                      <span className="block truncate text-xs text-emi-500">{recortar(comunidad.descripcion, 70)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Seccion>
          )}

          {/* Eventos */}
          {(tipo === 'todo' || tipo === 'eventos') && resultados.eventos?.length > 0 && (
            <Seccion titulo="Eventos" total={resultados.totales?.eventos}>
              <div className="space-y-2">
                {resultados.eventos.map((evento) => (
                  <Link
                    key={evento._id}
                    to={`/eventos/${evento._id}`}
                    className="tarjeta flex items-center justify-between gap-3 p-4 transition hover:shadow-tarjeta"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                        {evento.nombre}
                      </span>
                      <span className="block truncate text-xs text-emi-500">{evento.ubicacion}</span>
                    </span>
                    <span className="shrink-0 text-xs text-emi-400">{fechaCortaUtil(evento.fecha)}</span>
                  </Link>
                ))}
              </div>
            </Seccion>
          )}

          {/* Marketplace */}
          {(tipo === 'todo' || tipo === 'productos') && resultados.productos?.length > 0 && (
            <Seccion titulo="Marketplace" total={resultados.totales?.productos}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resultados.productos.map((producto) => (
                  <Link
                    key={producto._id}
                    to={`/marketplace/${producto._id}`}
                    className="tarjeta p-4 transition hover:shadow-tarjeta"
                  >
                    <p className="truncate text-sm font-semibold text-emi-900 dark:text-emi-50">{producto.titulo}</p>
                    <p className="mt-1 text-base font-bold text-emi-700 dark:text-dorado-400">
                      {formatearPrecio(producto.precio, producto.moneda)}
                    </p>
                    <p className="mt-1 text-xs text-emi-400">{fechaCortaUtil(producto.fechaCreacion)}</p>
                  </Link>
                ))}
              </div>
            </Seccion>
          )}
        </div>
      )}
    </div>
  );
}

/** Seccion de resultados con titulo y contador. */
function Seccion({ titulo, total, children }) {
  return (
    <section aria-labelledby={`seccion-${titulo}`}>
      <h2 id={`seccion-${titulo}`} className="mb-2 flex items-center gap-2 text-sm font-semibold text-emi-900 dark:text-emi-50">
        {titulo}
        {total !== undefined && <span className="text-xs font-normal text-emi-400">({total})</span>}
      </h2>
      {children}
    </section>
  );
}
