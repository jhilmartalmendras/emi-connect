import { useState } from 'react';
import { Share2, Send } from 'lucide-react';
import { Modal } from './Modal';
import { Boton } from './Boton';
import { AreaTexto } from './EntradaTexto';
import { Avatar } from './Avatar';
import { servicioPublicaciones } from '../../servicios/servicioPublicaciones';
import { servicioMensajes } from '../../servicios/servicioMensajes';
import { servicioAmistades } from '../../servicios/servicioAmistades';
import { useToast } from '../../contexto/ContextoToast';
import { nombreCompleto } from '../../utilidades/textos';

/**
 * Modal para compartir una publicacion.
 * Permite publicarla en el propio perfil o enviarla por mensaje a un amigo.
 */
export function ModalCompartir({ abierto, alCerrar, publicacion, alCompartir = null }) {
  const toast = useToast();
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [amigos, setAmigos] = useState(null);
  const [cargandoAmigos, setCargandoAmigos] = useState(false);

  /** Comparte la publicacion en el propio perfil. */
  const compartirEnPerfil = async () => {
    setEnviando(true);
    try {
      await servicioPublicaciones.compartir(publicacion._id, comentario);
      toast.exito('Publicacion compartida en tu perfil.');
      setComentario('');
      if (alCompartir) alCompartir();
      alCerrar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo compartir la publicacion.');
    } finally {
      setEnviando(false);
    }
  };

  /** Carga la lista de amigos para enviar el enlace por mensaje. */
  const cargarAmigos = async () => {
    if (amigos || cargandoAmigos) return;
    setCargandoAmigos(true);
    try {
      const datos = await servicioAmistades.listarAmigos(1, 30);
      setAmigos(datos.amigos || []);
    } catch (error) {
      toast.error(error.mensaje || 'No se pudieron cargar tus contactos.');
    } finally {
      setCargandoAmigos(false);
    }
  };

  /** Envia el enlace de la publicacion por mensaje directo. */
  const enviarPorMensaje = async (amigo) => {
    try {
      const enlace = `${window.location.origin}/publicacion/${publicacion._id}`;
      const datos = await servicioMensajes.enviar({
        destinatarioId: amigo._id,
        contenido: `${comentario ? `${comentario}\n` : ''}Mira esta publicacion en EMI Connect: ${enlace}`,
      });
      toast.exito(`Publicacion enviada a ${nombreCompleto(amigo)}.`);
      if (datos?.mensaje) {
        // El mensaje ya se entrego por la API: se notifica al destinatario.
      }
      alCerrar();
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo enviar el mensaje.');
    }
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Compartir publicacion"
      descripcion="Publica el contenido en tu perfil o envialo por mensaje directo."
      tamanos="normal"
      bloquearCierre={enviando}
      pie={
        <div className="flex justify-end gap-2">
          <Boton variante="contorno" onClick={alCerrar} deshabilitado={enviando}>
            Cancelar
          </Boton>
          <Boton variante="primario" icono={Share2} onClick={compartirEnPerfil} cargando={enviando}>
            Compartir en mi perfil
          </Boton>
        </div>
      }
    >
      <div className="space-y-4">
        <AreaTexto
          etiqueta="Agrega un comentario (opcional)"
          valor={comentario}
          alCambiar={setComentario}
          filas={3}
          maxLength={500}
          marcador="¿Por que quieres compartir esta publicacion?"
        />

        <div className="separador pt-4">
          <p className="mb-2 text-sm font-medium text-emi-800 dark:text-emi-100">Enviar por mensaje a un contacto</p>

          {!amigos ? (
            <Boton variante="contorno" tamano="pequeno" icono={Send} onClick={cargarAmigos} cargando={cargandoAmigos}>
              Mostrar mis contactos
            </Boton>
          ) : amigos.length === 0 ? (
            <p className="texto-secundario">Todavia no tienes contactos agregados.</p>
          ) : (
            <ul className="max-h-52 space-y-1 overflow-y-auto">
              {amigos.map((amigo) => (
                <li key={amigo._id}>
                  <button
                    type="button"
                    onClick={() => enviarPorMensaje(amigo)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-emi-50 dark:hover:bg-emi-800"
                  >
                    <Avatar usuario={amigo} tamanos="pequeno" />
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-emi-900 dark:text-emi-50">
                        {nombreCompleto(amigo)}
                      </span>
                      <span className="block text-xs text-emi-500 dark:text-emi-300">{amigo.carrera}</span>
                    </span>
                    <Send className="h-4 w-4 text-emi-400" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ModalCompartir;
