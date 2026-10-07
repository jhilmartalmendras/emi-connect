import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, RotateCcw, Trash2 } from 'lucide-react';
import { Boton } from '../../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../../componentes/comunes/Esqueleto';
import { Campo, Selector } from '../../componentes/comunes/EntradaTexto';
import { ModalConfirmacion } from '../../componentes/comunes/Modal';
import { InsigniaCategoria } from '../../componentes/comunes/Insignia';
import { useToast } from '../../contexto/ContextoToast';
import { useDebounce } from '../../hooks/useDebounce';
import { servicioAdministracion } from '../../servicios/servicioAdministracion';
import { nombreCompleto, recortar } from '../../utilidades/textos';
import { tiempoRelativo } from '../../utilidades/fechas';

/** Moderacion de publicaciones del panel administrativo. */
export default function Publicaciones() {
  const toast = useToast();

  const [buscar, setBuscar] = useState('');
  const [estado, setEstado] = useState('activas');
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);
  const [procesando, setProcesando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const buscarRetrasado = useDebounce(buscar, 350);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioAdministracion.listarPublicaciones({
          pagina: numeroPagina,
          limite: 20,
          buscar: buscarRetrasado.trim() || undefined,
          estado: estado || undefined,
        });
        setElementos((actuales) =>
          numeroPagina === 1 ? datos.publicaciones || [] : [...actuales, ...(datos.publicaciones || [])]
        );
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar las publicaciones.');
      } finally {
        setCargando(false);
      }
    },
    [buscarRetrasado, estado]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const restaurar = async (publicacion) => {
    setProcesando(`restaurar-${publicacion._id}`);
    try {
      await servicioAdministracion.restaurarPublicacion(publicacion._id);
      toast.exito('Publicacion restaurada.');
      cargar(1);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo restaurar la publicacion.');
    } finally {
      setProcesando(null);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    setProcesando(`eliminar-${aEliminar._id}`);
    try {
      await servicioAdministracion.eliminarPublicacion(aEliminar._id);
      toast.exito('Publicacion eliminada definitivamente.');
      setAEliminar(null);
      cargar(1);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo eliminar la publicacion.');
    } finally {
      setProcesando(null);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Moderacion de publicaciones</h1>
        <p className="texto-secundario">Revisa, restaura o elimina contenido de la plataforma.</p>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Campo
          etiqueta=""
          valor={buscar}
          alCambiar={setBuscar}
          marcador="Buscar por contenido..."
          icono={Search}
          className="w-full sm:w-72"
        />
        <Selector
          valor={estado}
          alCambiar={setEstado}
          opciones={[
            { valor: 'activas', etiqueta: 'Activas' },
            { valor: 'eliminadas', etiqueta: 'Eliminadas' },
          ]}
          marcador="Todos"
          className="w-44"
        />
      </div>

      {/* Contenido */}
      {cargando && elementos.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, indice) => (
            <div key={indice} className="tarjeta space-y-2 p-4">
              <Esqueleto className="h-3.5 w-1/3" />
              <Esqueleto className="h-3.5 w-full" />
              <Esqueleto className="h-3.5 w-2/3" />
            </div>
          ))}
        </div>
      )}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar las publicaciones" detalle={error} alReintentar={() => cargar(1)} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo="Sin publicaciones"
          descripcion="No hay publicaciones que coincidan con el filtro seleccionado."
          icono={FileText}
        />
      )}

      {!cargando && !error && elementos.length > 0 && (
        <ul className="space-y-3">
          {elementos.map((publicacion) => (
            <li key={publicacion._id} className={`tarjeta p-4 ${publicacion.eliminado ? 'opacity-70' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-emi-400">
                    <Link
                      to={`/perfil/${publicacion.autor?._id || ''}`}
                      className="font-semibold text-emi-700 hover:underline dark:text-emi-100"
                    >
                      {nombreCompleto(publicacion.autor)}
                    </Link>
                    <InsigniaCategoria categoria={publicacion.categoria} />
                    <span>{tiempoRelativo(publicacion.fechaCreacion)}</span>
                    {publicacion.eliminado && (
                      <span className="insignia bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                        Eliminada
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-emi-800 dark:text-emi-100">
                    {recortar(publicacion.contenido, 300) || '(sin texto, solo imagenes)'}
                  </p>

                  <p className="mt-1.5 text-[11px] text-emi-400">
                    {publicacion.cantidadComentarios || 0} comentarios · {publicacion.cantidadCompartidos || 0}{' '}
                    compartidos
                    {publicacion.motivoEliminacion ? ` · motivo: ${publicacion.motivoEliminacion}` : ''}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link to={`/publicacion/${publicacion._id}`} className="text-xs font-medium text-emi-600 hover:underline dark:text-emi-300">
                    Ver detalle
                  </Link>

                  {publicacion.eliminado ? (
                    <Boton
                      variante="secundario"
                      tamano="pequeno"
                      icono={RotateCcw}
                      cargando={procesando === `restaurar-${publicacion._id}`}
                      onClick={() => restaurar(publicacion)}
                    >
                      Restaurar
                    </Boton>
                  ) : (
                    <Boton
                      variante="peligro"
                      tamano="pequeno"
                      icono={Trash2}
                      onClick={() => setAEliminar(publicacion)}
                    >
                      Eliminar
                    </Boton>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas publicaciones
          </Boton>
        </div>
      )}

      <ModalConfirmacion
        abierto={Boolean(aEliminar)}
        alCerrar={() => setAEliminar(null)}
        alConfirmar={eliminar}
        titulo="Eliminar definitivamente"
        mensaje="La publicacion se borrara de la base de datos junto con sus comentarios. Esta accion no se puede deshacer."
        textoConfirmar="Eliminar definitivamente"
        cargando={procesando === `eliminar-${aEliminar?._id}`}
      />
    </div>
  );
}
