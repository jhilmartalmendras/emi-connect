import { Cargador } from './Cargador';

// Estilos por variante de color.
const VARIANTES = {
  primario:
    'bg-emi-600 text-white hover:bg-emi-700 focus:ring-emi-200 disabled:bg-emi-300 dark:disabled:bg-emi-800',
  secundario:
    'bg-emi-100 text-emi-800 hover:bg-emi-200 focus:ring-emi-200 dark:bg-emi-800 dark:text-emi-50 dark:hover:bg-emi-700',
  contorno:
    'border border-emi-200 bg-white text-emi-700 hover:bg-emi-50 focus:ring-emi-200 dark:border-emi-700 dark:bg-transparent dark:text-emi-100 dark:hover:bg-emi-800',
  exito: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-200',
  peligro: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-200',
  dorado: 'bg-dorado-500 text-emi-950 hover:bg-dorado-600 focus:ring-dorado-200',
  sutil: 'text-emi-600 hover:bg-emi-100 focus:ring-emi-200 dark:text-emi-200 dark:hover:bg-emi-800',
};

// Estilos por tamano.
const TAMANOS = {
  pequeno: 'px-3 py-1.5 text-xs',
  normal: 'px-4 py-2 text-sm',
  grande: 'px-5 py-2.5 text-base',
  icono: 'p-2',
};

/**
 * Boton del sistema de diseño de EMI Connect.
 * Siempre es un elemento <button> real para mantener la accesibilidad.
 */
export function Boton({
  children,
  variante = 'primario',
  tamano = 'normal',
  tipo = 'button',
  cargando = false,
  deshabilitado = false,
  icono: Icono = null,
  className = '',
  ...resto
}) {
  const clasesVariante = VARIANTES[variante] || VARIANTES.primario;
  const clasesTamano = TAMANOS[tamano] || TAMANOS.normal;

  return (
    <button
      type={tipo}
      disabled={deshabilitado || cargando}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition
        focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70
        ${clasesVariante} ${clasesTamano} ${className}`}
      {...resto}
    >
      {cargando ? (
        <Cargador tamanos="h-4 w-4" />
      ) : (
        Icono && <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

export default Boton;
