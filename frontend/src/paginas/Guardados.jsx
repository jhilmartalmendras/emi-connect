import { useCallback, useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { TarjetaPublicacion } from '../componentes/contenido/TarjetaPublicacion';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { EsqueletoLista } from '../componentes/comunes/Esqueleto';
import { servicioPublicaciones } from '../servicios/servicioPublicaciones';

/** Publicaciones guardadas por el usuario para leerlas mas tarde. */
export default function Guardados() {
  const [elementos, setElementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);

  const cargar = useCallback(async (numeroPagina = 1) => {
    setCargando(true);
    setError(null);
    try {
      const datos = await servicioPublicaciones.listarGuardadas(numeroPagina, 10);
      setElementos((actuales) =>
        numeroPagina === 1 ? datos.publicaciones || [] : [...actuales, ...(datos.publicaciones || [])]
      );
      setPagina(numeroPagina);
      setHayMas(Boolean(datos.paginacion?.hayPaginaSiguiente));
    } catch (excepcion) {
      setError(excepcion.mensaje || 'No se pudieron cargar tus guardados.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar(1);
  }, [cargar]);

  const quitar = (id) => {
    setElementos((actuales) => actuales.filter((item) => item._id !== id));
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="titulo-seccion">Guardados</h1>
        <p className="texto-secundario">Publicaciones que marcaste para leerlas mas tarde.</p>
      </header>

      {cargando && elementos.length === 0 && <EsqueletoLista cantidad={3} />}

      {error && !cargando && (
        <EstadoError mensaje="No pudimos cargar tus guardados" detalle={error} alReintentar={() => cargar(1)} />
      )}

      {!cargando && !error && elementos.length === 0 && (
        <EstadoVacio
          titulo="No tienes publicaciones guardadas"
          descripcion="Usa el icono de marcador en cualquier publicacion para guardarla aqui."
          icono={Bookmark}
        />
      )}

      {elementos.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion._id}
          publicacion={publicacion}
          alCambiar={() => cargar(1)}
          alEliminar={quitar}
        />
      ))}

      {hayMas && (
        <div className="flex justify-center">
          <Boton variante="contorno" cargando={cargando} onClick={() => cargar(pagina + 1)}>
            Cargar mas
          </Boton>
        </div>
      )}
    </div>
  );
}
