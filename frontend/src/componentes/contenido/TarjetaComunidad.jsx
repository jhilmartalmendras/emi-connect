import { Link } from 'react-router-dom';
import { UsersRound, Lock, Globe } from 'lucide-react';
import { Boton } from '../comunes/Boton';
import { Insignia } from '../comunes/Insignia';
import { colorCategoria, etiquetaCategoria } from '../../constantes/catalogos';
import { plural, urlArchivo } from '../../utilidades/textos';

/**
 * Tarjeta de comunidad con portada, categoria, cantidad de miembros
 * y accion opcional para unirse o salir.
 */
export function TarjetaComunidad({ comunidad, alUnirse = null, uniendose = false, className = '' }) {
  if (!comunidad) return null;

  const portada = comunidad.portada || comunidad.imagen;

  return (
    <div className={`tarjeta tarjeta-interactiva overflow-hidden ${className}`}>
      <Link to={`/comunidades/${comunidad._id}`} className="block">
        <div className="h-24 w-full bg-gradient-to-br from-emi-700 to-emi-900">
          {portada && (
            <img
              src={urlArchivo(portada)}
              alt={`Portada de ${comunidad.nombre}`}
              className="h-24 w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/comunidades/${comunidad._id}`}
            className="flex h-12 w-12 -translate-y-8 items-center justify-center rounded-xl border-4 border-white bg-emi-700 text-lg font-bold text-white shadow-suave dark:border-emi-900"
          >
            {comunidad.imagen ? (
              <img
                src={urlArchivo(comunidad.imagen)}
                alt={`Imagen de ${comunidad.nombre}`}
                className="h-full w-full rounded-lg object-cover"
              />
            ) : (
              <UsersRound className="h-6 w-6" aria-hidden="true" />
            )}
          </Link>

          <Insignia className={colorCategoria(comunidad.categoria)}>
            {etiquetaCategoria(comunidad.categoria)}
          </Insignia>
        </div>

        <Link
          to={`/comunidades/${comunidad._id}`}
          className="mt-2 block truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
        >
          {comunidad.nombre}
        </Link>

        {comunidad.descripcion && (
          <p className="mt-1 line-clamp-2 text-xs text-emi-500 dark:text-emi-300">{comunidad.descripcion}</p>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-emi-400">
            {comunidad.esPrivada ? (
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {plural(comunidad.cantidadMiembros || 0, 'miembro')}
          </span>

          {alUnirse && (
            <Boton
              variante={comunidad.soyMiembro ? 'contorno' : 'primario'}
              tamano="pequeno"
              onClick={alUnirse}
              cargando={uniendose}
            >
              {comunidad.soyMiembro ? 'Ver comunidad' : 'Unirse'}
            </Boton>
          )}
        </div>
      </div>
    </div>
  );
}

export default TarjetaComunidad;
