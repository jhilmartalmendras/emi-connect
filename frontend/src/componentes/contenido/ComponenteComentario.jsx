import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Pencil, Trash2, Flag, CornerDownRight } from 'lucide-react';
import { Avatar } from '../comunes/Avatar';
import { Boton } from '../comunes/Boton';
import { AreaTexto } from '../comunes/EntradaTexto';
import { ModalConfirmacion } from '../comunes/Modal';
import { MenuDesplegable } from '../comunes/MenuDesplegable';
import { ModalReporte } from '../comunes/ModalReporte';
import { useToast } from '../../contexto/ContextoToast';
import { servicioPublicaciones } from '../../servicios/servicioPublicaciones';
import { tiempoRelativo } from '../../utilidades/fechas';
import { nombreCompleto } from '../../utilidades/textos';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';

/**
 * Un comentario con sus respuestas anidadas (un nivel).
 * Permite responder, editar y eliminar los propios comentarios.
 */
export function ComponenteComentario({
  comentario,
  publicacionId,
  alCambiar = null,
  alResponder = null,
  esRespuesta = false,
}) {
  const toast = useToast();
  const { usuario } = useAutenticacion();
  const [respondiendo, setRespondiendo] = useState(false);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState(comentario.contenido);
  const [enviando, setEnviando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [reportar, setReportar] = useState(false);

  const esPropio = usuario && comentario.autor && String(comentario.autor._id) === String(usuario._id);
  const autor = comentario.autor || {};

  const enviarRespuesta = async () => {
    if (!textoRespuesta.trim()) return;
    setEnviando(true);
    try {
      await servicioPublicaciones.comentar(publicacionId, textoRespuesta.trim(), comentario._id);
      setTextoRespuesta('');
      setRespondiendo(false);
      if (alResponder) alResponder();
      if (alCambiar) alCambiar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo enviar la respuesta.');
    } finally {
      setEnviando(false);
    }
  };

  const guardarEdicion = async () => {
    if (!textoEdicion.trim()) return;
    setEnviando(true);
    try {
      await servicioPublicaciones.actualizarComentario(comentario._id, textoEdicion.trim());
      setEditando(false);
      if (alCambiar) alCambiar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo editar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async () => {
    setEnviando(true);
    try {
      await servicioPublicaciones.eliminarComentario(comentario._id);
      setConfirmarEliminar(false);
      if (alCambiar) alCambiar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo eliminar el comentario.');
    } finally {
      setEnviando(false);
    }
  };

  const opciones = [];
  if (esPropio) {
    opciones.push({ etiqueta: 'Editar', icono: Pencil, alSeleccionar: () => setEditando(true) });
    opciones.push({ etiqueta: 'Eliminar', icono: Trash2, peligro: true, alSeleccionar: () => setConfirmarEliminar(true) });
  } else {
    opciones.push({ etiqueta: 'Reportar', icono: Flag, alSeleccionar: () => setReportar(true) });
  }

  return (
    <div className={`flex gap-3 ${esRespuesta ? 'mt-3' : ''}`}>
      <Link to={`/perfil/${autor._id || ''}`} className="shrink-0 self-start">
        <Avatar usuario={autor} tamanos="pequeno" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-emi-50 px-3.5 py-2.5 dark:bg-emi-800">
          <div className="flex items-center justify-between gap-2">
            <Link
              to={`/perfil/${autor._id || ''}`}
              className="text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
            >
              {nombreCompleto(autor)}
            </Link>
            <MenuDesplegable opciones={opciones} etiquetaBoton="Opciones del comentario" />
          </div>

          {editando ? (
            <div className="mt-1">
              <AreaTexto
                valor={textoEdicion}
                alCambiar={setTextoEdicion}
                filas={2}
                maxLength={1000}
                deshabilitado={enviando}
              />
              <div className="mt-2 flex justify-end gap-2">
                <Boton variante="sutil" tamano="pequeno" onClick={() => setEditando(false)} deshabilitado={enviando}>
                  Cancelar
                </Boton>
                <Boton variante="primario" tamano="pequeno" onClick={guardarEdicion} cargando={enviando}>
                  Guardar
                </Boton>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-emi-800 dark:text-emi-100">
              {comentario.contenido}
            </p>
          )}

          <div className="mt-1 flex items-center gap-3 text-[11px] text-emi-400">
            <span>{tiempoRelativo(comentario.fechaCreacion)}</span>
            {comentario.editado && <span>Editado</span>}
          </div>
        </div>

        <div className="mt-1 flex items-center gap-3 pl-1 text-xs">
          {!esRespuesta && alResponder && (
            <button
              type="button"
              onClick={() => setRespondiendo((valor) => !valor)}
              className="inline-flex items-center gap-1 font-medium text-emi-500 transition hover:text-emi-800 dark:text-emi-300 dark:hover:text-emi-100"
            >
              <CornerDownRight className="h-3.5 w-3.5" aria-hidden="true" />
              Responder
            </button>
          )}
          <span className="text-emi-400">
            {comentario.respuestas && comentario.respuestas.length > 0
              ? `${comentario.respuestas.length} respuesta${comentario.respuestas.length === 1 ? '' : 's'}`
              : ''}
          </span>
        </div>

        {respondiendo && (
          <div className="mt-2 flex items-start gap-2">
            <AreaTexto
              valor={textoRespuesta}
              alCambiar={setTextoRespuesta}
              filas={2}
              maxLength={1000}
              marcador={`Responder a ${nombreCompleto(autor)}...`}
              deshabilitado={enviando}
              className="flex-1"
            />
            <Boton
              variante="primario"
              tamano="pequeno"
              icono={MessageSquare}
              onClick={enviarRespuesta}
              cargando={enviando}
              deshabilitado={!textoRespuesta.trim()}
            >
              Enviar
            </Boton>
          </div>
        )}

        {/* Respuestas anidadas (un solo nivel) */}
        {!esRespuesta && comentario.respuestas && comentario.respuestas.length > 0 && (
          <div className="mt-2 pl-4">
            {comentario.respuestas.map((respuesta) => (
              <ComponenteComentario
                key={respuesta._id}
                comentario={respuesta}
                publicacionId={publicacionId}
                alCambiar={alCambiar}
                esRespuesta
              />
            ))}
          </div>
        )}
      </div>

      <ModalConfirmacion
        abierto={confirmarEliminar}
        alCerrar={() => setConfirmarEliminar(false)}
        alConfirmar={eliminar}
        titulo="Eliminar comentario"
        mensaje="El comentario se eliminara de forma permanente. Esta accion no se puede deshacer."
        textoConfirmar="Eliminar"
        cargando={enviando}
      />

      <ModalReporte
        abierto={reportar}
        alCerrar={() => setReportar(false)}
        tipo="comentario"
        objetivoId={comentario._id}
        descripcionObjetivo={comentario.contenido}
      />
    </div>
  );
}

export default ComponenteComentario;
