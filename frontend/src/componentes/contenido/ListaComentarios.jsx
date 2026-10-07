import { useCallback, useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { Avatar } from '../comunes/Avatar';
import { Boton } from '../comunes/Boton';
import { Cargador } from '../comunes/Cargador';
import { EstadoVacio, EstadoError } from '../comunes/EstadoVacio';
import { ComponenteComentario } from './ComponenteComentario';
import { servicioPublicaciones } from '../../servicios/servicioPublicaciones';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { useToast } from '../../contexto/ContextoToast';

/**
 * Lista de comentarios de una publicacion con su campo de envio.
 * Se carga bajo demanda (recibiendo la propieda `visible`).
 */
export function ListaComentarios({ publicacionId, visible = true, alCambiarContador = null }) {
  const { usuario } = useAutenticacion();
  const toast = useToast();
  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);

  const cargar = useCallback(
    async (numeroPagina = 1) => {
      if (!visible) return;
      setCargando(true);
      setError(null);
      try {
        const datos = await servicioPublicaciones.listarComentarios(publicacionId, numeroPagina, 15);
        const lista = datos.comentarios || [];
        setComentarios((actuales) => (numeroPagina === 1 ? lista : [...actuales, ...lista]));
        setPagina(numeroPagina);
        setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
      } catch (excepcion) {
        setError(excepcion.mensaje || 'No se pudieron cargar los comentarios.');
      } finally {
        setCargando(false);
      }
    },
    [publicacionId, visible]
  );

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const nuevo = await servicioPublicaciones.comentar(publicacionId, texto.trim());
      setComentarios((actuales) => [
        { respuestas: [], ...nuevo.comentario },
        ...actuales,
      ]);
      setTexto('');
      if (alCambiarContador) alCambiarContador(1);
    } catch (excepcion) {
      toast.error(excepcion.mensaje || 'No se pudo publicar tu comentario.');
    } finally {
      setEnviando(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="border-t border-emi-100 px-4 py-3 dark:border-emi-800">
      {/* Campo para comentar */}
      <div className="flex items-start gap-3">
        <Avatar usuario={usuario} tamanos="pequeno" className="mt-1" />
        <div className="flex flex-1 items-end gap-2">
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
            maxLength={1000}
            placeholder="Escribe un comentario..."
            aria-label="Escribir comentario"
            className="campo-entrada max-h-32 min-h-[40px] resize-y"
          />
          <Boton
            variante="primario"
            tamano="pequeno"
            icono={MessageSquare}
            onClick={enviar}
            cargando={enviando}
            deshabilitado={!texto.trim()}
          >
            Comentar
          </Boton>
        </div>
      </div>

      {/* Lista */}
      <div className="mt-3 space-y-4">
        {cargando && comentarios.length === 0 && (
          <div className="flex justify-center py-4">
            <Cargador tamanos="h-5 w-5 text-emi-500" texto="Cargando comentarios..." />
          </div>
        )}

        {error && <EstadoError mensaje={error} detalle="Intenta nuevamente." alReintentar={() => cargar(1)} />}

        {!cargando && !error && comentarios.length === 0 && (
          <EstadoVacio
            titulo="Todavia no hay comentarios"
            descripcion="Se el primero en comentar esta publicacion."
            icono={MessageSquare}
          />
        )}

        {comentarios.map((comentario) => (
          <ComponenteComentario
            key={comentario._id}
            comentario={comentario}
            publicacionId={publicacionId}
            alCambiar={() => cargar(1)}
            alResponder={() => cargar(1)}
          />
        ))}

        {hayMas && (
          <div className="flex justify-center pt-1">
            <Boton variante="contorno" tamano="pequeno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
              Cargar mas comentarios
            </Boton>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListaComentarios;
