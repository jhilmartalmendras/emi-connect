import { iniciales, urlArchivo, colorDesdeTexto } from '../../utilidades/textos';

const TAMANOS = {
  mini: 'h-6 w-6 text-[10px]',
  pequeno: 'h-8 w-8 text-xs',
  normal: 'h-10 w-10 text-sm',
  grande: 'h-14 w-14 text-lg',
  extra: 'h-24 w-24 text-3xl',
  perfil: 'h-28 w-28 text-4xl sm:h-32 sm:w-32',
};

/**
 * Avatar de usuario: muestra la foto de perfil o, si no existe,
 * las iniciales con un color estable derivado del identificador.
 */
export function Avatar({ usuario, tamanos = 'normal', className = '', anillo = false, enLinea = false }) {
  const claseTamano = TAMANOS[tamanos] || TAMANOS.normal;
  const nombre = usuario?.nombres || '';
  const apellido = usuario?.apellidos || '';
  const foto = usuario?.fotoPerfil ? urlArchivo(usuario.fotoPerfil) : '';
  const color = colorDesdeTexto(usuario?._id || `${nombre}${apellido}`);

  return (
    <span className={`relative inline-block shrink-0 ${className}`}>
      {foto ? (
        <img
          src={foto}
          alt={`Foto de perfil de ${nombre} ${apellido}`.trim()}
          className={`${claseTamano} rounded-full object-cover ${
            anillo ? 'ring-2 ring-white dark:ring-emi-900' : ''
          }`}
          loading="lazy"
        />
      ) : (
        <span
          className={`${claseTamano} flex items-center justify-center rounded-full font-semibold text-white ${
            anillo ? 'ring-2 ring-white dark:ring-emi-900' : ''
          }`}
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {iniciales(nombre, apellido)}
        </span>
      )}

      {enLinea && (
        <span
          className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-emi-900"
          title="En linea"
        />
      )}
    </span>
  );
}

export default Avatar;
