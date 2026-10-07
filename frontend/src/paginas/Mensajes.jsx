import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Send, ImagePlus, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import { Avatar } from '../componentes/comunes/Avatar';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { ModalConfirmacion } from '../componentes/comunes/Modal';
import { useToast } from '../contexto/ContextoToast';
import { useAutenticacion } from '../contexto/ContextoAutenticacion';
import { useContadores } from '../contexto/ContextoContadores';
import { useSocket } from '../contexto/ContextoSocket';
import { servicioMensajes } from '../servicios/servicioMensajes';
import { tiempoRelativo, etiquetaDia, horaCorta } from '../utilidades/fechas';
import { nombreCompleto, recortar, urlArchivo } from '../utilidades/textos';

/**
 * Mensajeria instantanea: lista de conversaciones a la izquierda
 * y ventana de chat a la derecha (en movil se muestran por separado).
 */
export default function Mensajes() {
  const { conversacionId } = useParams();
  const navegar = useNavigate();
  const toast = useToast();
  const { usuario } = useAutenticacion();
  const { recargar: recargarContadores } = useContadores();
  const { socket } = useSocket();

  const [conversaciones, setConversaciones] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(null);

  const cargarLista = useCallback(async () => {
    setCargandoLista(true);
    setErrorLista(null);
    try {
      const datos = await servicioMensajes.listarConversaciones(1, 50);
      setConversaciones(datos.conversaciones || []);
    } catch (excepcion) {
      setErrorLista(excepcion.mensaje || 'No se pudieron cargar tus conversaciones.');
    } finally {
      setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    cargarLista();
  }, [cargarLista]);

  // Mensajes entrantes: se actualiza la lista y los contadores.
  useEffect(() => {
    if (!socket) return undefined;

    const alRecibir = () => {
      cargarLista();
      recargarContadores();
    };

    socket.on('mensaje:nuevo', alRecibir);
    return () => {
      socket.off('mensaje:nuevo', alRecibir);
    };
  }, [socket, cargarLista, recargarContadores]);

  return (
    <div className="flex h-[calc(100vh-8.5rem)] gap-4 lg:h-[calc(100vh-7rem)]">
      {/* Lista de conversaciones */}
      <section
        className={`w-full flex-col md:flex md:w-80 md:shrink-0 ${conversacionId ? 'hidden' : 'flex'}`}
        aria-label="Conversaciones"
      >
        <div className="tarjeta flex h-full flex-col overflow-hidden">
          <header className="border-b border-emi-100 px-4 py-3 dark:border-emi-800">
            <h1 className="text-sm font-semibold text-emi-900 dark:text-emi-50">Mensajes</h1>
          </header>

          <div className="flex-1 overflow-y-auto">
            {cargandoLista && (
              <div className="space-y-3 p-3">
                {Array.from({ length: 5 }).map((_, indice) => (
                  <div key={indice} className="flex items-center gap-3">
                    <Esqueleto className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Esqueleto className="h-3.5 w-1/2" />
                      <Esqueleto className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {errorLista && !cargandoLista && (
              <div className="p-3">
                <EstadoError mensaje="Error al cargar mensajes" detalle={errorLista} alReintentar={cargarLista} />
              </div>
            )}

            {!cargandoLista && !errorLista && conversaciones.length === 0 && (
              <div className="p-4">
                <EstadoVacio
                  titulo="No tienes conversaciones"
                  descripcion="Visita el perfil de un contacto y pulsa en Mensaje para empezar a hablar."
                  icono={MessageSquare}
                />
              </div>
            )}

            <ul>
              {conversaciones.map((conversacion) => {
                const activa = conversacion._id === conversacionId;
                const interlocutor = conversacion.interlocutor || {};

                return (
                  <li key={conversacion._id}>
                    <button
                      type="button"
                      onClick={() => navegar(`/mensajes/${conversacion._id}`)}
                      className={`flex w-full items-center gap-3 border-b border-emi-50 px-4 py-3 text-left transition dark:border-emi-800 ${
                        activa ? 'bg-emi-50 dark:bg-emi-800' : 'hover:bg-emi-50 dark:hover:bg-emi-800'
                      }`}
                      aria-current={activa}
                    >
                      <Avatar usuario={interlocutor} tamanos="normal" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-emi-900 dark:text-emi-50">
                            {nombreCompleto(interlocutor)}
                          </span>
                          <span className="shrink-0 text-[10px] text-emi-400">
                            {conversacion.fechaUltimoMensaje ? tiempoRelativo(conversacion.fechaUltimoMensaje) : ''}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span
                            className={`block truncate text-xs ${
                              conversacion.noLeidos > 0 ? 'font-semibold text-emi-800 dark:text-emi-100' : 'text-emi-500'
                            }`}
                          >
                            {recortar(conversacion.ultimoMensaje?.contenido || 'Iniciar conversacion', 42)}
                          </span>
                          {conversacion.noLeidos > 0 && (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-dorado-500 px-1 text-[10px] font-bold text-emi-950">
                              {conversacion.noLeidos}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Ventana de chat */}
      <section className={`flex-1 ${conversacionId ? 'flex' : 'hidden md:flex'}`} aria-label="Conversacion">
        {conversacionId ? (
          <VentanaChat
            conversacionId={conversacionId}
            conversacion={conversaciones.find((item) => item._id === conversacionId) || null}
            yo={usuario}
            socket={socket}
            alCambiarLista={cargarLista}
            alVolver={() => navegar('/mensajes')}
          />
        ) : (
          <div className="tarjeta flex w-full flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="rounded-full bg-emi-50 p-4 dark:bg-emi-800">
              <MessageSquare className="h-7 w-7 text-emi-400" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-emi-900 dark:text-emi-50">Tus conversaciones</h2>
            <p className="max-w-sm texto-secundario">
              Selecciona una conversacion de la lista o escribe a un contacto desde su perfil.
            </p>
            <Link to="/amigos" className="text-sm enlace">
              Ver mis contactos
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

/** Ventana de chat de una conversacion concreta. */
function VentanaChat({ conversacionId, conversacion, yo, socket, alCambiarLista, alVolver }) {
  const toast = useToast();
  const { recargar: recargarContadores } = useContadores();

  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const archivoRef = useRef(null);
  const finalRef = useRef(null);
  const mensajesRef = useRef([]);

  mensajesRef.current = mensajes;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await servicioMensajes.listarMensajes(conversacionId, 1, 50);
      setMensajes(datos.mensajes || []);
      // Marca la conversacion como leida y actualiza los contadores globales.
      await servicioMensajes.marcarLeidos(conversacionId).catch(() => {});
      recargarContadores();
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar la conversacion.');
    } finally {
      setCargando(false);
    }
  }, [conversacionId, recargarContadores]);

  useEffect(() => {
    setMensajes([]);
    cargar();
  }, [cargar]);

  // Mensajes en tiempo real de esta conversacion.
  useEffect(() => {
    if (!socket) return undefined;

    const alRecibir = (mensaje) => {
      const pertenece =
        String(mensaje.conversacion?._id || mensaje.conversacion) === String(conversacionId);
      if (!pertenece) return;

      setMensajes((actuales) =>
        actuales.some((item) => item._id === mensaje._id) ? actuales : [...actuales, mensaje]
      );
      servicioMensajes.marcarLeidos(conversacionId).catch(() => {});
      recargarContadores();
      alCambiarLista();
    };

    socket.on('mensaje:nuevo', alRecibir);
    return () => {
      socket.off('mensaje:nuevo', alRecibir);
    };
  }, [socket, conversacionId, alCambiarLista, recargarContadores]);

  // Scroll automatico al ultimo mensaje.
  useEffect(() => {
    if (finalRef.current) {
      finalRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }, [mensajes.length]);

  /** Envia el texto escrito. */
  const enviar = async () => {
    const contenido = texto.trim();
    if (!contenido || enviando) return;

    setEnviando(true);
    try {
      const resultado = await servicioMensajes.enviar({ conversacionId, contenido });
      const mensaje = resultado.mensaje;
      setMensajes((actuales) => (actuales.some((item) => item._id === mensaje._id) ? actuales : [...actuales, mensaje]));
      setTexto('');
      alCambiarLista();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo enviar el mensaje.');
    } finally {
      setEnviando(false);
    }
  };

  /** Envia una imagen en la conversacion. */
  const enviarImagen = async (eventos) => {
    const archivo = eventos.target.files?.[0];
    eventos.target.value = '';
    if (!archivo) return;

    setEnviando(true);
    try {
      const resultado = await servicioMensajes.enviarImagen({ conversacionId, archivo });
      setMensajes((actuales) => [...actuales, resultado.mensaje]);
      alCambiarLista();
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo enviar la imagen.');
    } finally {
      setEnviando(false);
    }
  };

  /** Vacia la conversacion. */
  const vaciar = async () => {
    setEliminando(true);
    try {
      await servicioMensajes.eliminarConversacion(conversacionId);
      setMensajes([]);
      toast.exito('Conversacion vaciada.');
      alCambiarLista();
      setConfirmarEliminar(false);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo vaciar la conversacion.');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="tarjeta flex h-full w-full flex-col overflow-hidden">
      {/* Encabezado */}
      <header className="flex items-center gap-3 border-b border-emi-100 px-4 py-3 dark:border-emi-800">
        <button
          type="button"
          onClick={alVolver}
          className="rounded-lg p-1.5 text-emi-500 transition hover:bg-emi-100 md:hidden dark:hover:bg-emi-800"
          aria-label="Volver a la lista"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <Avatar usuario={conversacion?.interlocutor} tamanos="pequeno" />
        <div className="min-w-0 flex-1">
          <Link
            to={`/perfil/${conversacion?.interlocutor?._id || ''}`}
            className="block truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
          >
            {nombreCompleto(conversacion?.interlocutor)}
          </Link>
          <p className="truncate text-[11px] text-emi-400">
            {conversacion?.interlocutor?.carrera || 'Comunidad EMI'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setConfirmarEliminar(true)}
          className="rounded-lg p-2 text-emi-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          aria-label="Vaciar conversacion"
          title="Vaciar conversacion"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {cargando && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, indice) => (
              <div key={indice} className={`flex ${indice % 2 ? 'justify-end' : 'justify-start'}`}>
                <Esqueleto className={`h-10 ${indice % 2 ? 'w-40' : 'w-56'} rounded-2xl`} />
              </div>
            ))}
          </div>
        )}

        {error && !cargando && (
          <EstadoError mensaje="No pudimos cargar los mensajes" detalle={error} alReintentar={cargar} />
        )}

        {!cargando && !error && mensajes.length === 0 && (
          <p className="py-10 text-center texto-secundario">
            Inicia la conversacion enviando el primer mensaje.
          </p>
        )}

        {!cargando &&
          mensajes.map((mensaje, indice) => {
            const mio = String(mensaje.emisor?._id || mensaje.emisor) === String(yo?._id);
            const anterior = mensajes[indice - 1];
            const mismoDia = anterior
              ? etiquetaDia(anterior.fechaCreacion) === etiquetaDia(mensaje.fechaCreacion)
              : true;
            const emisorAnterior = anterior
              ? String(anterior.emisor?._id || anterior.emisor) === String(mensaje.emisor?._id || mensaje.emisor)
              : false;

            return (
              <div key={mensaje._id}>
                {(!mismoDia || indice === 0) && (
                  <div className="my-3 flex items-center gap-3 text-[11px] text-emi-400">
                    <span className="h-px flex-1 bg-emi-100 dark:bg-emi-800" />
                    {etiquetaDia(mensaje.fechaCreacion)}
                    <span className="h-px flex-1 bg-emi-100 dark:bg-emi-800" />
                  </div>
                )}

                <div className={`flex items-end gap-2 ${mio ? 'justify-end' : 'justify-start'}`}>
                  {!mio && !emisorAnterior && (
                    <Avatar usuario={mensaje.emisor} tamanos="mini" className="mb-1" />
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      mio
                        ? 'rounded-br-sm bg-emi-700 text-white'
                        : 'rounded-bl-sm bg-emi-100 text-emi-900 dark:bg-emi-800 dark:text-emi-50'
                    }`}
                  >
                    {mensaje.imagen && (
                      <a href={urlArchivo(mensaje.imagen)} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={urlArchivo(mensaje.imagen)}
                          alt="Imagen compartida"
                          className="mb-1 max-h-64 rounded-xl object-cover"
                        />
                      </a>
                    )}
                    {mensaje.contenido && <p className="whitespace-pre-wrap break-words">{mensaje.contenido}</p>}
                    <p className={`mt-1 text-right text-[10px] ${mio ? 'text-emi-200' : 'text-emi-400'}`}>
                      {horaCorta(mensaje.fechaCreacion)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        <div ref={finalRef} />
      </div>

      {/* Envio */}
      <footer className="border-t border-emi-100 px-3 py-3 dark:border-emi-800">
        <div className="flex items-end gap-2">
          <input
            ref={archivoRef}
            type="file"
            accept="image/*"
            onChange={enviarImagen}
            className="hidden"
            aria-label="Adjuntar imagen"
          />
          <button
            type="button"
            onClick={() => archivoRef.current && archivoRef.current.click()}
            className="rounded-lg p-2 text-emi-500 transition hover:bg-emi-100 disabled:opacity-50 dark:text-emi-300 dark:hover:bg-emi-800"
            disabled={enviando}
            aria-label="Enviar imagen"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
          </button>

          <textarea
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            onKeyDown={(evento) => {
              if (evento.key === 'Enter' && !evento.shiftKey) {
                evento.preventDefault();
                enviar();
              }
            }}
            rows={1}
            maxLength={2000}
            placeholder="Escribe un mensaje..."
            aria-label="Escribir mensaje"
            className="campo-entrada max-h-32 min-h-[42px] flex-1 resize-y"
          />

          <Boton
            variante="primario"
            icono={Send}
            onClick={enviar}
            cargando={enviando}
            deshabilitado={!texto.trim()}
          >
            Enviar
          </Boton>
        </div>
      </footer>

      <ModalConfirmacion
        abierto={confirmarEliminar}
        alCerrar={() => setConfirmarEliminar(false)}
        alConfirmar={vaciar}
        titulo="Vaciar conversacion"
        mensaje="Todos los mensajes de esta conversacion se eliminaran para ti. Esta accion no se puede deshacer."
        textoConfirmar="Vaciar"
        cargando={eliminando}
      />
    </div>
  );
}
