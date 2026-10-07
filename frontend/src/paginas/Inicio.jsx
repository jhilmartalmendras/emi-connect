import { useState } from 'react';
import { Newspaper } from 'lucide-react';
import { EditorPublicacion } from '../componentes/contenido/EditorPublicacion';
import { TarjetaPublicacion } from '../componentes/contenido/TarjetaPublicacion';
import { Boton } from '../componentes/comunes/Boton';
import { EstadoVacio, EstadoError } from '../componentes/comunes/EstadoVacio';
import { EsqueletoLista } from '../componentes/comunes/Esqueleto';
import { usePaginacion } from '../hooks/usePaginacion';
import { servicioPublicaciones } from '../servicios/servicioPublicaciones';
import { CATEGORIAS_PUBLICACION } from '../constantes/catalogos';

/** Pagina de inicio: publicador, filtros de categoria y feed personalizado. */
export default function Inicio() {
  const [categoria, setCategoria] = useState('');

  const feed = usePaginacion(
    async (pagina, limite) => {
      const datos = await servicioPublicaciones.obtenerFeed(pagina, limite, categoria);
      return { elementos: datos.publicaciones || [], paginacion: datos.paginacion };
    },
    [categoria],
    { limite: 10 }
  );

  /** Inserta una publicacion nueva arriba del feed sin recargar. */
  const alCrear = (publicacion) => {
    if (publicacion) feed.establecerElementos((actuales) => [publicacion, ...actuales]);
  };

  const alEliminar = (id) => {
    feed.establecerElementos((actuales) => actuales.filter((item) => item._id !== id));
  };

  return (
    <div className="space-y-4">
      <EditorPublicacion alCrear={alCrear} />

      {/* Filtros de categoria */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar por categoria">
        <button
          type="button"
          role="tab"
          aria-selected={categoria === ''}
          onClick={() => setCategoria('')}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
            categoria === ''
              ? 'bg-emi-700 text-white'
              : 'bg-white text-emi-600 hover:bg-emi-100 dark:bg-emi-800 dark:text-emi-200 dark:hover:bg-emi-700'
          }`}
        >
          Todo
        </button>
        {CATEGORIAS_PUBLICACION.map((item) => (
          <button
            key={item.valor}
            type="button"
            role="tab"
            aria-selected={categoria === item.valor}
            onClick={() => setCategoria(item.valor)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition ${
              categoria === item.valor
                ? 'bg-emi-700 text-white'
                : 'bg-white text-emi-600 hover:bg-emi-100 dark:bg-emi-800 dark:text-emi-200 dark:hover:bg-emi-700'
            }`}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>

      {/* Feed */}
      {feed.cargando && <EsqueletoLista cantidad={3} />}

      {feed.error && !feed.cargando && (
        <EstadoError mensaje="No pudimos cargar el feed" detalle={feed.error} alReintentar={feed.recargar} />
      )}

      {!feed.cargando && !feed.error && feed.elementos.length === 0 && (
        <EstadoVacio
          titulo="Tu feed esta vacio"
          descripcion={
            categoria
              ? 'No hay publicaciones en esta categoria todavia. Prueba con otro filtro.'
              : 'Sigue a tus companeros, unete a comunidades o crea la primera publicacion.'
          }
          icono={Newspaper}
        />
      )}

      {feed.elementos.map((publicacion) => (
        <TarjetaPublicacion
          key={publicacion._id}
          publicacion={publicacion}
          alCambiar={feed.recargar}
          alEliminar={alEliminar}
        />
      ))}

      {feed.cargandoMas && <EsqueletoLista cantidad={1} />}

      {feed.paginacion?.hayPaginaSiguiente && !feed.cargandoMas && (
        <div className="flex justify-center pt-1">
          <Boton variante="contorno" onClick={feed.cargarMas}>
            Cargar mas publicaciones
          </Boton>
        </div>
      )}
    </div>
  );
}
