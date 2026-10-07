import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, Users, UsersRound, FileText, CalendarDays, Store } from 'lucide-react';
import { servicioDescubrimiento } from '../../servicios/servicioDescubrimiento';
import { useDebounce } from '../../hooks/useDebounce';
import { useClickExterno } from '../../hooks/useClickExterno';
import { Avatar } from '../comunes/Avatar';
import { Cargador } from '../comunes/Cargador';
import { nombreCompleto, recortar } from '../../utilidades/textos';

/**
 * Buscador global de EMI Connect.
 * Permite buscar usuarios, publicaciones, comunidades, eventos y productos.
 */
export function BuscadorGlobal({ compacto = false }) {
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  const textoRetrasado = useDebounce(texto, 350);
  const referencia = useClickExterno(abierto, () => setAbierto(false));
  const contador = useRef(0);

  useEffect(() => {
    const termino = textoRetrasado.trim();

    if (termino.length < 2) {
      setResultados(null);
      setCargando(false);
      return;
    }

    contador.current += 1;
    const id = contador.current;

    async function buscar() {
      setCargando(true);
      try {
        const datos = await servicioDescubrimiento.buscar(termino, 'todo');
        if (id === contador.current) {
          setResultados(datos);
          setAbierto(true);
        }
      } catch (error) {
        if (id === contador.current) setResultados(null);
      } finally {
        if (id === contador.current) setCargando(false);
      }
    }

    buscar();
  }, [textoRetrasado]);

  const enviarFormulario = (evento) => {
    evento.preventDefault();
    if (texto.trim().length < 2) return;
    setAbierto(false);
    navegar(`/buscar?q=${encodeURIComponent(texto.trim())}`);
  };

  const totales = resultados?.totales || {};
  const hayResultados =
    resultados &&
    ((resultados.usuarios?.length || 0) +
      (resultados.publicaciones?.length || 0) +
      (resultados.comunidades?.length || 0) +
      (resultados.eventos?.length || 0) +
      (resultados.productos?.length || 0) >
      0);

  return (
    <div className="relative w-full" ref={referencia}>
      <form onSubmit={enviarFormulario} role="search">
        <label htmlFor="buscador-global" className="solo-lectores">
          Buscar en EMI Connect
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emi-400" aria-hidden="true" />
          <input
            id="buscador-global"
            type="search"
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onFocus={() => resultados && setAbierto(true)}
            placeholder={compacto ? 'Buscar...' : 'Buscar personas, publicaciones, comunidades...'}
            className="w-full rounded-full border border-emi-200 bg-emi-50 py-2 pl-9 pr-9 text-sm text-emi-900 outline-none transition placeholder:text-emi-400 focus:border-emi-400 focus:bg-white focus:ring-2 focus:ring-emi-100 dark:border-emi-700 dark:bg-emi-800 dark:text-emi-50 dark:focus:bg-emi-900"
            aria-expanded={abierto}
            aria-controls="resultados-busqueda"
            autoComplete="off"
          />
          {texto && (
            <button
              type="button"
              onClick={() => {
                setTexto('');
                setResultados(null);
                setAbierto(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-emi-400 transition hover:bg-emi-100 hover:text-emi-700 dark:hover:bg-emi-700"
              aria-label="Limpiar busqueda"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      {abierto && texto.trim().length >= 2 && (
        <div
          id="resultados-busqueda"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-emi-100 bg-white p-2 shadow-tarjeta animar-entrada dark:border-emi-700 dark:bg-emi-900"
        >
          {cargando && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Cargador tamanos="h-4 w-4 text-emi-500" texto="Buscando..." />
            </div>
          )}

          {!cargando && !hayResultados && (
            <p className="px-3 py-6 text-center text-sm text-emi-500 dark:text-emi-300">
              No se encontraron resultados para "{textoRetrasado}".
            </p>
          )}

          {!cargando && hayResultados && (
            <div className="space-y-3">
              {resultados.usuarios?.length > 0 && (
                <section>
                  <TituloGrupo icono={Users} texto="Personas" total={totales.usuarios} />
                  {resultados.usuarios.slice(0, 3).map((usuario) => (
                    <Link
                      key={usuario._id}
                      to={`/perfil/${usuario._id}`}
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                    >
                      <Avatar usuario={usuario} tamanos="pequeno" />
                      <span>
                        <span className="block text-sm font-medium text-emi-900 dark:text-emi-50">
                          {nombreCompleto(usuario)}
                        </span>
                        <span className="block text-xs text-emi-500 dark:text-emi-300">
                          {usuario.carrera || usuario.rol}
                        </span>
                      </span>
                    </Link>
                  ))}
                </section>
              )}

              {resultados.comunidades?.length > 0 && (
                <section>
                  <TituloGrupo icono={UsersRound} texto="Comunidades" total={totales.comunidades} />
                  {resultados.comunidades.slice(0, 3).map((comunidad) => (
                    <Link
                      key={comunidad._id}
                      to={`/comunidades/${comunidad._id}`}
                      onClick={() => setAbierto(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emi-100 text-xs font-semibold text-emi-700 dark:bg-emi-800 dark:text-emi-100">
                        {comunidad.nombre.charAt(0)}
                      </span>
                      <span className="text-sm text-emi-900 dark:text-emi-50">{comunidad.nombre}</span>
                    </Link>
                  ))}
                </section>
              )}

              {resultados.publicaciones?.length > 0 && (
                <section>
                  <TituloGrupo icono={FileText} texto="Publicaciones" total={totales.publicaciones} />
                  {resultados.publicaciones.slice(0, 3).map((publicacion) => (
                    <Link
                      key={publicacion._id}
                      to={`/publicacion/${publicacion._id}`}
                      onClick={() => setAbierto(false)}
                      className="block rounded-lg px-3 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                    >
                      <span className="block text-xs text-emi-500 dark:text-emi-300">
                        {nombreCompleto(publicacion.autor)}
                      </span>
                      <span className="block text-sm text-emi-900 dark:text-emi-50">
                        {recortar(publicacion.contenido, 90)}
                      </span>
                    </Link>
                  ))}
                </section>
              )}

              {resultados.eventos?.length > 0 && (
                <section>
                  <TituloGrupo icono={CalendarDays} texto="Eventos" total={totales.eventos} />
                  {resultados.eventos.slice(0, 2).map((evento) => (
                    <Link
                      key={evento._id}
                      to={`/eventos/${evento._id}`}
                      onClick={() => setAbierto(false)}
                      className="block rounded-lg px-3 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                    >
                      <span className="block text-sm text-emi-900 dark:text-emi-50">{evento.nombre}</span>
                    </Link>
                  ))}
                </section>
              )}

              {resultados.productos?.length > 0 && (
                <section>
                  <TituloGrupo icono={Store} texto="Marketplace" total={totales.productos} />
                  {resultados.productos.slice(0, 2).map((producto) => (
                    <Link
                      key={producto._id}
                      to={`/marketplace/${producto._id}`}
                      onClick={() => setAbierto(false)}
                      className="block rounded-lg px-3 py-2 transition hover:bg-emi-50 dark:hover:bg-emi-800"
                    >
                      <span className="block text-sm text-emi-900 dark:text-emi-50">{producto.titulo}</span>
                    </Link>
                  ))}
                </section>
              )}

              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  navegar(`/buscar?q=${encodeURIComponent(textoRetrasado.trim())}`);
                }}
                className="w-full rounded-lg bg-emi-50 px-3 py-2.5 text-center text-sm font-medium text-emi-700 transition hover:bg-emi-100 dark:bg-emi-800 dark:text-emi-100 dark:hover:bg-emi-700"
              >
                Ver todos los resultados
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Encabezado de cada grupo de resultados. */
function TituloGrupo({ icono: Icono, texto, total }) {
  return (
    <p className="flex items-center gap-2 px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-emi-400">
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
      {texto}
      {total !== undefined && <span className="font-normal normal-case text-emi-400">({total})</span>}
    </p>
  );
}

export default BuscadorGlobal;
