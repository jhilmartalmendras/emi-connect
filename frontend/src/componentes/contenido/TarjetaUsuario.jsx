import { Link } from 'react-router-dom';
import { Avatar } from '../comunes/Avatar';
import { Boton } from '../comunes/Boton';
import { InsigniaRol } from '../comunes/Insignia';
import { nombreCompleto, plural } from '../../utilidades/textos';

/**
 * Tarjeta de usuario reutilizable (directorio, amigos, sugerencias, miembros).
 * Muestra los datos basicos y una accion opcional (agregar, mensaje, aprobar...).
 */
export function TarjetaUsuario({
  usuario,
  accion = null,
  accionSecundaria = null,
  subtitulo = '',
  mostrarCantidadAmigos = false,
  fecha = '',
  className = '',
}) {
  if (!usuario) return null;

  return (
    <div className={`tarjeta flex items-center gap-3 p-4 ${className}`}>
      <Link to={`/perfil/${usuario._id}`} className="shrink-0">
        <Avatar usuario={usuario} tamanos="grande" />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/perfil/${usuario._id}`}
            className="truncate text-sm font-semibold text-emi-900 hover:underline dark:text-emi-50"
          >
            {nombreCompleto(usuario)}
          </Link>
          <InsigniaRol rol={usuario.rol} />
        </div>
        <p className="truncate text-xs text-emi-500 dark:text-emi-300">
          {subtitulo || usuario.carrera || usuario.correo || ''}
        </p>
        <p className="mt-0.5 text-[11px] text-emi-400">
          {fecha || (mostrarCantidadAmigos && usuario.cantidadAmigos != null
            ? plural(usuario.cantidadAmigos, 'contacto')
            : '')}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
        {accionSecundaria && (
          <Boton
            variante={accionSecundaria.variante || 'contorno'}
            tamano="pequeno"
            onClick={accionSecundaria.alEjecutar}
            cargando={accionSecundaria.cargando}
            deshabilitado={accionSecundaria.deshabilitado}
          >
            {accionSecundaria.etiqueta}
          </Boton>
        )}

        {accion && (
          <Boton
            variante={accion.variante || 'secundario'}
            tamano="pequeno"
            onClick={accion.alEjecutar}
            cargando={accion.cargando}
            deshabilitado={accion.deshabilitado}
          >
            {accion.etiqueta}
          </Boton>
        )}
      </div>
    </div>
  );
}

export default TarjetaUsuario;
