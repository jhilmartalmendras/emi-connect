import { ShieldCheck } from 'lucide-react';
import { colorCategoria, etiquetaCategoria, etiquetaRol } from '../../constantes/catalogos';

/** Insignia generica con color personalizado. */
export function Insignia({ children, className = '', icono: Icono = null }) {
  return (
    <span className={`insignia ${className}`}>
      {Icono && <Icono className="h-3 w-3" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Insignia de la categoria de una publicacion. */
export function InsigniaCategoria({ categoria }) {
  return <Insignia className={colorCategoria(categoria)}>{etiquetaCategoria(categoria)}</Insignia>;
}

/** Marca de contenido institucional verificado. */
export function InsigniaOficial() {
  return (
    <Insignia className="bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100" icono={ShieldCheck}>
      Oficial EMI
    </Insignia>
  );
}

/** Insignia del rol del usuario. */
export function InsigniaRol({ rol }) {
  const colores = {
    estudiante: 'bg-emi-100 text-emi-700 dark:bg-emi-800 dark:text-emi-100',
    docente: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    administrativo: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100',
    moderador: 'bg-dorado-100 text-dorado-800 dark:bg-dorado-800 dark:text-dorado-100',
    administrador: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  };

  return <Insignia className={colores[rol] || colores.estudiante}>{etiquetaRol(rol)}</Insignia>;
}

/** Insignia con color libre (estados, categorias de producto, etc.). */
export function InsigniaEstado({ children, className = '' }) {
  return <Insignia className={className}>{children}</Insignia>;
}

export default Insignia;
