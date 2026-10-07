import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersRound, Search, Power } from 'lucide-react';
import { Boton } from '../../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { Campo, Selector } from '../../componentes/comunes/EntradaTexto';
import { ModalConfirmacion } from '../../componentes/comunes/Modal';
import { useToast } from '../../contexto/ContextoToast';
import { useDebounce } from '../../hooks/useDebounce';
import { servicioAdministracion } from '../../servicios/servicioAdministracion';
import { colorCategoria, etiquetaCategoria } from '../../constantes/catalogos';
import { plural, urlArchivo } from '../../utilidades/textos';
import { fechaCorta } from '../../utilidades/fechas';

/** Gestion de comunidades del panel administrativo. */
export default function Comunidades() {
  const toast = useToast();

  const [buscar, setBuscar] = useState('');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const [aCambiar, setACambiar] = useState(null);

  const buscarRetrasado = useDebounce(buscar, 350);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioAdministracion.listarComunidades({
          pagina: numeroPagina,
          limite: 20,
          buscar: buscarRetrasado.trim() || undefined,
        });
        setElementos((actuales) =>
          numeroPagina === 1 ? datos.comunidades || [] : [...actuales, ...(datos.comunidades || [])]
        );
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar las comunidades.');
      } finally {
        setCargando(false);
      }
    },
    [buscarRetrasado]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  /** Activa o desactiva una comunidad tras confirmar. */
  const cambiarEstado = async () => {
    if (!aCambiar) return;
    setProcesando(aCambiar._id);
    try {
      const activa = !aCambiar.activa;
      await servicioAdministracion.cambiarEstadoComunidad(aCambiar._id, activa);
      toast.exito(activa ? 'Comunidad reactivada.' : 'Comunidad desactivada.');
      setACambiar(null);
      cargar(1);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo cambiar el estado.');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Gestion de comunidades</h1>
        <p className="texto-secundario">Activa o desactiva comunidades de la plataforma.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Campo
          etiqueta=""
          valor={buscar}
          alCambiar={setBuscar}
          marcador="Buscar comunidad por nombre..."
          icono={Search}
          className="w-full sm:w-72"
        />
        <Selector
          valor=""
          alCambiar={() => {}}
          opciones={[
            { valor: 'activas', etiqueta: 'Activas primero' },
            { valor: 'todas', etiqueta: 'Todas' },
          ]}
          marcador="Orden predeterminado"
          className="w-48"
          deshabilitado
        />
      </div>

      {cargando && elementos.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, indice) => (
            <div key={indice} className="tarjeta flex items-center gap-3 p-4">
              <Esqueleto className="h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Esqueleto className="h-4 w-1/3" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar las comunidades" detalle={error} alReintentar={() => cargar(1)} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio titulo="Sin comunidades" descripcion="No hay comunidades que coincidan con la busqueda." icono={UsersRound} />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <ul className="space-y-3">
          {elementos.map((comunidad) => (
            <li key={comunidad._id} className="tarjeta flex flex-wrap items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emi-100 dark:bg-emi-800">
                {comunidad.imagen ? (
                  <img src={urlArchivo(comunidad.imagen)} alt="" className="h-11 w-11 object-cover" />
                ) : (
                  <UsersRound className="h-5 w-5 text-emi-500" aria-hidden="true" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/comunidades/${comunidad._id}`}
                    className="truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
                  >
                    {comunidad.nombre}
                  </Link>
                  <span className={`insignia ${colorCategoria(comunidad.categoria)}`}>
                    {etiquetaCategoria(comunidad.categoria)}
                  </span>
                  {!comunidad.activa && (
                    <span className="insignia bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                      Desactivada
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-emi-500">{comunidad.descripcion || 'Sin descripcion'}</p>
                <p className="text-[11px] text-emi-400">
                  {plural(comunidad.cantidadMiembros || 0, 'miembro')} ·{' '}
                  {plural(comunidad.cantidadPublicaciones || 0, 'publicacion', 'publicaciones')} · creada{' '}
                  {fechaCorta(comunidad.fechaCreacion)}
                </p>
              </div>

              <Boton
                variante={comunidad.activa ? 'peligro' : 'exito'}
                tamano="pequeno"
                icono={Power}
                cargando={procesando === comunidad._id}
                onClick={() => setACambiar(comunidad)}
              >
                {comunidad.activa ? 'Desactivar' : 'Reactivar'}
              </Boton>
            </li>
          ))}
        </ul>
      )}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas comunidades
          </Boton>
        </div>
      )}

      <ModalConfirmacion
        abierto={Boolean(aCambiar)}
        alCerrar={() => setACambiar(null)}
        alConfirmar={cambiarEstado}
        titulo={aCambiar?.activa ? 'Desactivar comunidad' : 'Reactivar comunidad'}
        mensaje={
          aCambiar?.activa
            ? `La comunidad "${aCambiar?.nombre}" dejara de estar visible y sus miembros no podran publicar en ella.`
            : `La comunidad "${aCambiar?.nombre}" volvera a estar visible para toda la comunidad EMI.`
        }
        textoConfirmar={aCambiar?.activa ? 'Desactivar' : 'Reactivar'}
        variante={aCambiar?.activa ? 'peligro' : 'exito'}
        cargando={procesando === aCambiar?._id}
      />
    </div>
  );
}
