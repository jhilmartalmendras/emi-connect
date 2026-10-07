import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Share2, Bookmark, BookmarkCheck, Image as ImageIcon, X } from 'lucide-react';
import { Avatar } from '../comunes/Avatar';
import { InsigniaCategoria, InsigniaOficial, InsigniaRol } from '../comunes/Insignia';
import { MenuDesplegable } from '../comunes/MenuDesplegable';
import { ModalConfirmacion } from '../comunes/Modal';
import { ModalReporte } from '../comunes/ModalReporte';
import { ModalCompartir } from '../comunes/ModalCompartir';
import { SelectorReaccion } from './SelectorReaccion';
import { ListaComentarios } from './ListaComentarios';
import { useToast } from '../../contexto/ContextoToast';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { servicioPublicaciones } from '../../servicios/servicioPublicaciones';
import { tiempoRelativo } from '../../utilidades/fechas';
import { nombreCompleto, urlArchivo, plural } from '../../utilidades/textos';
import { obtenerReaccion } from '../../constantes/catalogos';

/** Suma de todas las reacciones del resumen de la publicacion. */
function totalReacciones(reaccionesResumen = {}) {
  return Object.values(reaccionesResumen || {}).reduce((total, cantidad) => total + (Number(cantidad) || 0), 0);
}

/** Desglose legible de las reacciones para el tooltip. */
function detalleReacciones(reaccionesResumen = {}) {
  return Object.entries(reaccionesResumen || {})
    .filter(([, cantidad]) => cantidad > 0)
    .map(([tipo, cantidad]) => {
      const reaccion = obtenerReaccion(tipo);
      return `${reaccion ? reaccion.emoji : ''} ${cantidad}`;
    })
    .join('  ');
}

/**
 * Tarjeta de publicacion: encabezado, contenido, imagenes, reacciones,
 * comentarios y acciones (guardar, compartir, reportar, editar, eliminar).
 */
export function TarjetaPublicacion({ publicacion, alCambiar = null, alEliminar = null, compacto = false }) {
  const toast = useToast();
  const navegar = useNavigate();
  const { usuario } = useAutenticacion();

  const [reaccion, setReaccion] = useState(publicacion.miReaccion || null);
  const [conteoReacciones, setConteoReacciones] = useState(totalReacciones(publicacion.reaccionesResumen));
  const [guardada, setGuardada] = useState(Boolean(publicacion.guardada));
  const [cantidadGuardados, setCantidadGuardados] = useState(publicacion.cantidadGuardados || 0);
  const [cantidadComentarios, setCantidadComentarios] = useState(publicacion.cantidadComentarios || 0);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [compartir, setCompartir] = useState(false);
  const [reportar, setReportar] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const autor = publicacion.autor || {};
  const esPropio = usuario && String(autor._id) === String(usuario._id);
  const enlace = `/publicacion/${publicacion._id}`;

  /** Aplica o retira la reaccion del usuario en la interfaz. */
  const reaccionar = async (tipo) => {
    const anterior = reaccion;
    const siguiente = anterior === tipo ? null : tipo;

    // Actualizacion optimista.
    setReaccion(siguiente);
    setConteoReacciones((total) => {
      let nuevo = total;
      if (anterior) nuevo -= 1;
      if (siguiente && anterior !== tipo) nuevo += 1;
      if (siguiente && !anterior) nuevo += 1;
      return Math.max(0, nuevo);
    });

    try {
      if (anterior === tipo) {
        await servicioPublicaciones.quitarReaccion(publicacion._id);
      } else {
        await servicioPublicaciones.reaccionar(publicacion._id, tipo);
      }
      if (alCambiar) alCambiar();
    } catch (error) {
      setReaccion(anterior);
      setConteoReacciones(totalReacciones(publicacion.reaccionesResumen));
      toast.error(error.mensaje || 'No se pudo registrar tu reaccion.');
    }
  };

  /** Guarda o quita la publicacion de guardados. */
  const alternarGuardado = async () => {
    const anterior = guardada;
    setGuardada(!anterior);
    setCantidadGuardados((cantidad) => Math.max(0, cantidad + (anterior ? -1 : 1)));
    try {
      await servicioPublicaciones.alternarGuardado(publicacion._id);
      if (alCambiar) alCambiar();
    } catch (error) {
      setGuardada(anterior);
      setCantidadGuardados(publicacion.cantidadGuardados || 0);
      toast.error(error.mensaje || 'No se pudo guardar la publicacion.');
    }
  };

  const eliminar = async () => {
    setEliminando(true);
    try {
      await servicioPublicaciones.eliminar(publicacion._id);
      toast.exito('Publicacion eliminada.');
      if (alEliminar) alEliminar(publicacion._id);
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo eliminar la publicacion.');
    } finally {
      setEliminando(false);
      setConfirmarEliminar(false);
    }
  };

  const opciones = [];
  if (esPropio) {
    opciones.push({
      etiqueta: 'Editar',
      alSeleccionar: () => navegar(`/publicacion/${publicacion._id}?editar=1`),
    });
    opciones.push({
      etiqueta: 'Eliminar',
      peligro: true,
      alSeleccionar: () => setConfirmarEliminar(true),
    });
  } else {
    opciones.push({ etiqueta: 'Reportar', alSeleccionar: () => setReportar(true) });
  }

  const total = conteoReacciones;

  return (
    <article className="tarjeta overflow-hidden">
      {/* Encabezado */}
      <header className="flex items-start gap-3 p-4 pb-2">
        <Link to={`/perfil/${autor._id || ''}`} className="shrink-0">
          <Avatar usuario={autor} tamanos="normal" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/perfil/${autor._id || ''}`}
              className="text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
            >
              {nombreCompleto(autor)}
            </Link>
            <InsigniaRol rol={autor.rol} />
            {publicacion.esInstitucional && <InsigniaOficial />}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-emi-400">
            <Link to={enlace} className="hover:underline">
              {tiempoRelativo(publicacion.fechaCreacion)}
            </Link>
            {publicacion.editado && <span>· editado</span>}
            {publicacion.comunidad && (
              <span>
                · en{' '}
                <Link to={`/comunidades/${publicacion.comunidad._id || publicacion.comunidad}`} className="hover:underline">
                  {publicacion.comunidad.nombre || 'una comunidad'}
                </Link>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <InsigniaCategoria categoria={publicacion.categoria} />
          <MenuDesplegable opciones={opciones} etiquetaBoton="Opciones de la publicacion" />
        </div>
      </header>

      {/* Contenido */}
      {publicacion.contenido && (
        <div className="px-4 pb-3">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-emi-800 dark:text-emi-100">
            {publicacion.contenido}
          </p>
        </div>
      )}

      {/* Imagen compartida */}
      {publicacion.publicacionOriginal && (
        <div className="mx-4 mb-3 rounded-xl border border-emi-100 bg-emi-50 p-3 dark:border-emi-800 dark:bg-emi-800/60">
          <p className="mb-1 text-xs font-semibold text-emi-500 dark:text-emi-300">
            Compartio la publicacion de{' '}
            <Link to={`/perfil/${publicacion.publicacionOriginal.autor?._id || ''}`} className="hover:underline">
              {nombreCompleto(publicacion.publicacionOriginal.autor)}
            </Link>
          </p>
          <p className="line-clamp-4 whitespace-pre-wrap text-sm text-emi-700 dark:text-emi-100">
            {publicacion.publicacionOriginal.contenido}
          </p>
        </div>
      )}

      {/* Galeria de imagenes */}
      {publicacion.imagenes && publicacion.imagenes.length > 0 && (
        <div className={`grid gap-1 px-2 ${publicacion.imagenes.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {publicacion.imagenes.map((imagen, indice) => (
            <button
              key={imagen}
              type="button"
              onClick={() => setImagenAmpliada(imagen)}
              className={`block overflow-hidden bg-emi-100 ${publicacion.imagenes.length === 1 ? 'max-h-[480px]' : ''}`}
              aria-label={`Ver imagen ${indice + 1} de la publicacion`}
            >
              <img
                src={urlArchivo(imagen)}
                alt={`Imagen ${indice + 1} de la publicacion de ${nombreCompleto(autor)}`}
                className="h-full w-full object-cover transition hover:opacity-90"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Contadores */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-emi-400">
        <span title={detalleReacciones(publicacion.reaccionesResumen)}>
          {total > 0 ? plural(total, 'reaccion', 'reacciones') : 'Sin reacciones'}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMostrarComentarios((valor) => !valor)}
            className="hover:text-emi-600 hover:underline"
          >
            {cantidadComentarios > 0 ? plural(cantidadComentarios, 'comentario') : 'Comentar'}
          </button>
          {cantidadGuardados > 0 && <span>{plural(cantidadGuardados, 'guardado')}</span>}
        </div>
      </div>

      {/* Acciones */}
      <div className="grid grid-cols-3 gap-1 border-t border-emi-100 px-2 py-1.5 dark:border-emi-800">
        <SelectorReaccion reaccionActual={reaccion} alReaccionar={reaccionar} compacto={false} />

        <button
          type="button"
          onClick={() => setMostrarComentarios((valor) => !valor)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emi-500 transition hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Comentar
        </button>

        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => setCompartir(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-emi-500 transition hover:bg-emi-50 dark:text-emi-300 dark:hover:bg-emi-800"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Compartir
          </button>

          <button
            type="button"
            onClick={alternarGuardado}
            aria-pressed={guardada}
            aria-label={guardada ? 'Quitar de guardados' : 'Guardar publicacion'}
            className={`rounded-lg p-2 transition hover:bg-emi-50 dark:hover:bg-emi-800 ${
              guardada ? 'text-dorado-500' : 'text-emi-500 dark:text-emi-300'
            }`}
          >
            {guardada ? <BookmarkCheck className="h-4 w-4" aria-hidden="true" /> : <Bookmark className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Comentarios */}
      <ListaComentarios
        publicacionId={publicacion._id}
        visible={mostrarComentarios}
        alCambiarContador={(delta) => setCantidadComentarios((cantidad) => Math.max(0, cantidad + delta))}
      />

      {/* Visor de imagenes */}
      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Imagen ampliada"
          onClick={() => setImagenAmpliada(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Cerrar imagen"
            onClick={() => setImagenAmpliada(null)}
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <img src={urlArchivo(imagenAmpliada)} alt="Imagen de la publicacion" className="max-h-[90vh] max-w-[90vw] object-contain" />
        </div>
      )}

      <ModalCompartir
        abierto={compartir}
        alCerrar={() => setCompartir(false)}
        publicacion={publicacion}
        alCompartir={() => alCambiar && alCambiar()}
      />

      <ModalReporte
        abierto={reportar}
        alCerrar={() => setReportar(false)}
        tipo="publicacion"
        objetivoId={publicacion._id}
        descripcionObjetivo={publicacion.contenido}
      />

      <ModalConfirmacion
        abierto={confirmarEliminar}
        alCerrar={() => setConfirmarEliminar(false)}
        alConfirmar={eliminar}
        titulo="Eliminar publicacion"
        mensaje="La publicacion y sus comentarios se eliminaran de forma permanente. Esta accion no se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={eliminando}
      />
    </article>
  );
}

export default TarjetaPublicacion;
