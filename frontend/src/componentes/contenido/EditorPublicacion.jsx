import { useRef, useState } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { Avatar } from '../comunes/Avatar';
import { Boton } from '../comunes/Boton';
import { AreaTexto, Selector } from '../comunes/EntradaTexto';
import { useToast } from '../../contexto/ContextoToast';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { servicioPublicaciones } from '../../servicios/servicioPublicaciones';
import { CATEGORIAS_PUBLICACION } from '../../constantes/catalogos';
import { urlArchivo } from '../../utilidades/textos';

// Solo estos roles pueden publicar como contenido institucional oficial.
const ROLES_INSTITUCIONAL = ['docente', 'moderador', 'administrador'];

const MAXIMO_IMAGENES = 4;

/**
 * Editor de publicaciones del feed.
 * Plegado muestra solo una invitacion a publicar; expandido permite escribir,
 * elegir categoria, adjuntar imagenes y publicar.
 */
export function EditorPublicacion({ alCrear = null, comunidad = null, placeholder = '¿Que estas pensando, cadete?' }) {
  const toast = useToast();
  const { usuario } = useAutenticacion();
  const archivoRef = useRef(null);

  const [expandido, setExpandido] = useState(false);
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [imagenes, setImagenes] = useState([]);
  const [publicando, setPublicando] = useState(false);

  const categorias = CATEGORIAS_PUBLICACION.filter(
    (item) => item.valor !== 'institucional' || ROLES_INSTITUCIONAL.includes(usuario?.rol)
  );

  const seleccionarArchivos = (eventos) => {
    const archivos = Array.from(eventos.target.files || []);
    if (archivos.length === 0) return;

    const disponibles = MAXIMO_IMAGENES - imagenes.length;
    if (archivos.length > disponibles) {
      toast.informativo(`Puedes adjuntar hasta ${MAXIMO_IMAGENES} imagenes por publicacion.`);
    }
    setImagenes((actuales) => [...actuales, ...archivos.slice(0, disponibles)]);
    eventos.target.value = '';
  };

  const quitarImagen = (indice) => {
    setImagenes((actuales) => actuales.filter((_, posicion) => posicion !== indice));
  };

  const cancelar = () => {
    setExpandido(false);
    setContenido('');
    setCategoria('general');
    setImagenes([]);
  };

  const publicar = async () => {
    if (!contenido.trim() && imagenes.length === 0) {
      toast.error('Escribe algo o adjunta una imagen para publicar.');
      return;
    }

    setPublicando(true);
    try {
      const creada = await servicioPublicaciones.crear({
        contenido: contenido.trim(),
        categoria,
        imagenes,
        comunidad: comunidad ? comunidad._id || comunidad : null,
      });
      toast.exito('Publicacion creada correctamente.');
      cancelar();
      if (alCrear) alCrear(creada.publicacion);
    } catch (error) {
      toast.error(error.mensaje || 'No se pudo crear la publicacion.');
    } finally {
      setPublicando(false);
    }
  };

  return (
    <div className="tarjeta p-4">
      <div className="flex items-start gap-3">
        <Avatar usuario={usuario} tamanos="normal" />

        <div className="flex-1">
          {!expandido ? (
            <button
              type="button"
              onClick={() => setExpandido(true)}
              className="w-full rounded-full border border-emi-200 bg-emi-50 px-4 py-2.5 text-left text-sm text-emi-400 transition hover:border-emi-300 hover:bg-emi-100 dark:border-emi-700 dark:bg-emi-800 dark:text-emi-300 dark:hover:bg-emi-700"
            >
              {placeholder}
            </button>
          ) : (
            <div className="space-y-3">
              <AreaTexto
                valor={contenido}
                alCambiar={setContenido}
                filas={4}
                maxLength={5000}
                marcador={placeholder}
                deshabilitado={publicando}
                autoFocus
              />

              {/* Previsualizacion de imagenes */}
              {imagenes.length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {imagenes.map((imagen, indice) => (
                    <div key={`${imagen.name}-${indice}`} className="relative">
                      <img
                        src={URL.createObjectURL(imagen)}
                        alt={`Imagen seleccionada ${indice + 1}`}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => quitarImagen(indice)}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-emi-900 p-1 text-white shadow transition hover:bg-red-600"
                        aria-label={`Quitar imagen ${indice + 1}`}
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-end justify-between gap-3">
                <Selector
                  etiqueta="Categoria"
                  valor={categoria}
                  alCambiar={setCategoria}
                  opciones={categorias}
                  className="w-48"
                />

                <div className="flex items-center gap-2">
                  <input
                    ref={archivoRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={seleccionarArchivos}
                    className="hidden"
                    aria-label="Adjuntar imagenes"
                  />
                  <Boton
                    variante="contorno"
                    tamano="pequeno"
                    icono={ImagePlus}
                    onClick={() => archivoRef.current && archivoRef.current.click()}
                    deshabilitado={publicando || imagenes.length >= MAXIMO_IMAGENES}
                  >
                    Imagenes ({imagenes.length}/{MAXIMO_IMAGENES})
                  </Boton>
                  <Boton variante="sutil" tamano="pequeno" onClick={cancelar} deshabilitado={publicando}>
                    Cancelar
                  </Boton>
                  <Boton
                    variante="primario"
                    tamano="pequeno"
                    icono={Send}
                    onClick={publicar}
                    cargando={publicando}
                    deshabilitado={!contenido.trim() && imagenes.length === 0}
                  >
                    Publicar
                  </Boton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorPublicacion;
