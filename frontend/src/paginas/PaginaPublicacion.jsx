import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TarjetaPublicacion } from '../componentes/contenido/TarjetaPublicacion';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoError, EstadoVacio } from '../componentes/comunes/EstadoVacio';
import { Esqueleto } from '../componentes/comunes/Esqueleto';
import { servicioPublicaciones } from '../servicios/servicioPublicaciones';

/** Pagina dedicada de una publicacion (enlace compartido o notificacion). */
export default function PaginaPublicacion() {
  const { id } = useParams();
  const navegar = useNavigate();

  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await servicioPublicaciones.obtener(id);
      setPublicacion(datos.publicacion);
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudo cargar la publicacion.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) {
    return (
      <div className="space-y-4">
        <Boton variante="sutil" tamano="pequeno" icono={ArrowLeft} onClick={() => navegar(-1)}>
          Volver
        </Boton>
        <div className="tarjeta space-y-4 p-4">
          <div className="flex items-center gap-3">
            <Esqueleto className="h-11 w-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <Esqueleto className="h-3.5 w-40" />
              <Esqueleto className="h-3 w-24" />
            </div>
          </div>
          <Esqueleto className="h-4 w-full" />
          <Esqueleto className="h-4 w-5/6" />
          <Esqueleto className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !publicacion) {
    return (
      <div className="space-y-4">
        <Boton variante="sutil" tamano="pequeno" icono={ArrowLeft} onClick={() => navegar(-1)}>
          Volver
        </Boton>
        {error ? (
          <EstadoError mensaje="Publicacion no disponible" detalle={error} alReintentar={cargar} />
        ) : (
          <EstadoVacio titulo="Publicacion no encontrada" descripcion="Puede que haya sido eliminada." />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Boton variante="sutil" tamano="pequeno" icono={ArrowLeft} onClick={() => navegar(-1)}>
        Volver
      </Boton>

      <TarjetaPublicacion
        publicacion={publicacion}
        alCambiar={cargar}
        alEliminar={() => navegar('/inicio')}
      />
    </div>
  );
}
