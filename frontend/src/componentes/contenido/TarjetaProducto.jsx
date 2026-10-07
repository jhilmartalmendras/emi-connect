import { Link } from 'react-router-dom';
import { MapPin, Eye } from 'lucide-react';
import { Insignia } from '../comunes/Insignia';
import { CATEGORIAS_PRODUCTO, ESTADOS_PRODUCTO } from '../../constantes/catalogos';
import { formatearPrecio, plural, urlArchivo } from '../../utilidades/textos';

/** Etiqueta y color del estado del producto. */
function estadoProducto(estado) {
  const encontrado = ESTADOS_PRODUCTO.find((item) => item.valor === estado) || ESTADOS_PRODUCTO[0];
  return encontrado;
}

/** Etiqueta de la categoria del producto. */
function categoriaProducto(categoria) {
  const encontrada = CATEGORIAS_PRODUCTO.find((item) => item.valor === categoria);
  return encontrada ? encontrada.etiqueta : categoria;
}

/**
 * Tarjeta de producto del marketplace con imagen, precio, estado y vendedor.
 */
export function TarjetaProducto({ producto, className = '' }) {
  if (!producto) return null;

  const estado = estadoProducto(producto.estado);
  const imagen = producto.imagenes && producto.imagenes.length > 0 ? producto.imagenes[0] : '';

  return (
    <div className={`tarjeta tarjeta-interactiva overflow-hidden ${className}`}>
      <Link to={`/marketplace/${producto._id}`} className="block">
        <div className="relative h-40 w-full bg-emi-100 dark:bg-emi-800">
          {imagen ? (
            <img
              src={urlArchivo(imagen)}
              alt={producto.titulo}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-40 w-full items-center justify-center text-4xl" aria-hidden="true">
              🛍️
            </div>
          )}
          <Insignia className={`absolute left-2 top-2 ${estado.color}`}>{estado.etiqueta}</Insignia>
        </div>
      </Link>

      <div className="p-3.5">
        <Link to={`/marketplace/${producto._id}`} className="block">
          <h3 className="truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50">
            {producto.titulo}
          </h3>
        </Link>

        <p className="mt-1 text-lg font-bold text-emi-700 dark:text-dorado-400">
          {formatearPrecio(producto.precio, producto.moneda)}
          {producto.esNegociable && <span className="ml-1 text-xs font-normal text-emi-400">negociable</span>}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-emi-400">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {producto.ubicacion || 'EMI'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            {plural(producto.vistas || 0, 'vista')}
          </span>
        </div>

        <p className="mt-1.5 text-[11px] text-emi-400">{categoriaProducto(producto.categoria)}</p>
      </div>
    </div>
  );
}

export default TarjetaProducto;
